;; oracle-registry.clar
;; Manages oracle authorization, resolution submission, disputes, and finalization
;; Satoshi Bets — XXIX Labs 2026

(use-trait sip010-trait .sip010-ft-trait.sip010-ft-trait)

;; ============================================================
;; CONSTANTS
;; ============================================================
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-ADMIN (err u100))
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-INVALID-PARAMS (err u102))
(define-constant ERR-UNAUTHORIZED (err u103))
(define-constant ERR-ALREADY-SUBMITTED (err u104))
(define-constant ERR-DISPUTE-WINDOW-ACTIVE (err u105))
(define-constant ERR-DISPUTE-WINDOW-CLOSED (err u106))
(define-constant ERR-INSUFFICIENT-STAKE (err u107))
(define-constant ERR-NOT-ORACLE (err u108))
(define-constant ERR-NOT-FINALIZABLE (err u109))

(define-constant ORACLE-TYPE-PYTH u1)
(define-constant ORACLE-TYPE-AI u2)
(define-constant ORACLE-TYPE-MANUAL u3)

(define-constant RESOLUTION-STATUS-PENDING u1)
(define-constant RESOLUTION-STATUS-DISPUTED u2)
(define-constant RESOLUTION-STATUS-FINALIZED u3)
(define-constant RESOLUTION-STATUS-OVERRIDDEN u4)

;; 144 blocks ≈ 24 hours (10min/block on Stacks post-Nakamoto)
(define-constant DISPUTE-WINDOW-BLOCKS u144)
;; Minimum dispute stake: 0.01 sBTC (in sats * 10^2, matching sBTC 8-decimal representation)
(define-constant MIN-DISPUTE-STAKE u1000000)
;; 95% confidence threshold for auto-submit (in basis points)
(define-constant AUTO-SUBMIT-CONFIDENCE u9500)

;; ============================================================
;; DATA VARS
;; ============================================================
(define-data-var admin principal CONTRACT-OWNER)

;; ============================================================
;; DATA MAPS
;; ============================================================
(define-map oracles principal {
  oracle-type: uint,
  name: (string-ascii 64),
  active: bool,
  total-resolutions: uint,
  accuracy-score: uint
})

(define-map resolutions uint {
  oracle: principal,
  outcome: bool,
  confidence: uint,
  evidence-uri: (string-ascii 256),
  submitted-at: uint,
  status: uint,
  dispute-deadline: uint,
  disputer: (optional principal),
  dispute-stake: uint
})

;; ============================================================
;; READ-ONLY FUNCTIONS
;; ============================================================
(define-read-only (get-resolution (market-id uint))
  (ok (map-get? resolutions market-id))
)

(define-read-only (get-oracle (oracle-principal principal))
  (ok (map-get? oracles oracle-principal))
)

(define-read-only (is-oracle (oracle-principal principal))
  (match (map-get? oracles oracle-principal)
    oracle-data (ok (get active oracle-data))
    (ok false)
  )
)

(define-read-only (is-in-dispute-window (market-id uint))
  (match (map-get? resolutions market-id)
    resolution (ok (< block-height (get dispute-deadline resolution)))
    (ok false)
  )
)

(define-read-only (get-admin)
  (ok (var-get admin))
)

;; ============================================================
;; PRIVATE HELPERS
;; ============================================================
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

(define-private (is-active-oracle (oracle-principal principal))
  (match (map-get? oracles oracle-principal)
    oracle-data (get active oracle-data)
    false
  )
)

;; ============================================================
;; PUBLIC FUNCTIONS
;; ============================================================

(define-public (register-oracle
    (oracle-principal principal)
    (oracle-type uint)
    (name (string-ascii 64)))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (asserts! (and (>= oracle-type ORACLE-TYPE-PYTH) (<= oracle-type ORACLE-TYPE-MANUAL)) ERR-INVALID-PARAMS)
    (asserts! (> (len name) u0) ERR-INVALID-PARAMS)
    (map-set oracles oracle-principal {
      oracle-type: oracle-type,
      name: name,
      active: true,
      total-resolutions: u0,
      accuracy-score: u10000
    })
    (ok true)
  )
)

(define-public (remove-oracle (oracle-principal principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (let ((oracle (unwrap! (map-get? oracles oracle-principal) ERR-NOT-FOUND)))
      (map-set oracles oracle-principal (merge oracle { active: false }))
      (ok true)
    )
  )
)

(define-public (submit-resolution
    (market-id uint)
    (outcome bool)
    (confidence uint)
    (evidence-uri (string-ascii 256))
    (pyth-price-feed-id (optional (buff 32))))
  (begin
    (asserts! (is-active-oracle tx-sender) ERR-NOT-ORACLE)
    (asserts! (is-none (map-get? resolutions market-id)) ERR-ALREADY-SUBMITTED)
    (asserts! (<= confidence u10000) ERR-INVALID-PARAMS)
    (asserts! (> (len evidence-uri) u0) ERR-INVALID-PARAMS)
    (map-set resolutions market-id {
      oracle: tx-sender,
      outcome: outcome,
      confidence: confidence,
      evidence-uri: evidence-uri,
      submitted-at: block-height,
      status: RESOLUTION-STATUS-PENDING,
      dispute-deadline: (+ block-height DISPUTE-WINDOW-BLOCKS),
      disputer: none,
      dispute-stake: u0
    })
    (match (map-get? oracles tx-sender)
      oracle-data (map-set oracles tx-sender
        (merge oracle-data {
          total-resolutions: (+ (get total-resolutions oracle-data) u1)
        }))
      false
    )
    (ok true)
  )
)

(define-public (dispute-resolution
    (market-id uint)
    (sbtc-contract <sip010-trait>)
    (stake-amount uint))
  (let ((resolution (unwrap! (map-get? resolutions market-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (get status resolution) RESOLUTION-STATUS-PENDING) ERR-NOT-FINALIZABLE)
    (asserts! (< block-height (get dispute-deadline resolution)) ERR-DISPUTE-WINDOW-CLOSED)
    (asserts! (>= stake-amount MIN-DISPUTE-STAKE) ERR-INSUFFICIENT-STAKE)
    (try! (contract-call? sbtc-contract transfer
      stake-amount tx-sender (as-contract tx-sender) none))
    (map-set resolutions market-id (merge resolution {
      status: RESOLUTION-STATUS-DISPUTED,
      disputer: (some tx-sender),
      dispute-stake: stake-amount
    }))
    (ok true)
  )
)

(define-public (finalize-resolution
    (market-id uint)
    (sbtc-contract <sip010-trait>))
  (let ((resolution (unwrap! (map-get? resolutions market-id) ERR-NOT-FOUND)))
    ;; Can finalize if: pending after dispute window, OR disputed and admin is calling
    (asserts!
      (or
        (and
          (is-eq (get status resolution) RESOLUTION-STATUS-PENDING)
          (>= block-height (get dispute-deadline resolution))
        )
        (and
          (is-eq (get status resolution) RESOLUTION-STATUS-DISPUTED)
          (is-admin)
        )
      )
      ERR-NOT-FINALIZABLE
    )
    ;; Return dispute stake to disputer if any (admin overrode their dispute)
    (match (get disputer resolution)
      disputer-addr
        (as-contract
          (try! (contract-call? sbtc-contract transfer
            (get dispute-stake resolution) tx-sender disputer-addr none)))
      true
    )
    (map-set resolutions market-id (merge resolution {
      status: RESOLUTION-STATUS-FINALIZED
    }))
    ;; Trigger AMM to mark the market as resolved
    (try! (contract-call? .market-amm resolve market-id (get outcome resolution)))
    (ok true)
  )
)

(define-public (override-resolution
    (market-id uint)
    (new-outcome bool))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (let ((resolution (unwrap! (map-get? resolutions market-id) ERR-NOT-FOUND)))
      (asserts!
        (or
          (is-eq (get status resolution) RESOLUTION-STATUS-PENDING)
          (is-eq (get status resolution) RESOLUTION-STATUS-DISPUTED)
        )
        ERR-NOT-FINALIZABLE
      )
      (map-set resolutions market-id (merge resolution {
        outcome: new-outcome,
        status: RESOLUTION-STATUS-OVERRIDDEN
      }))
      (try! (contract-call? .market-amm resolve market-id new-outcome))
      (ok true)
    )
  )
)

(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (var-set admin new-admin)
    (ok true)
  )
)
