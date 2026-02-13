;; market-factory.clar
;; Creates and manages binary Yes/No prediction markets
;; Satoshi Bets — XXIX Labs 2026

;; ============================================================
;; CONSTANTS
;; ============================================================
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-ADMIN (err u100))
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-INVALID-PARAMS (err u102))
(define-constant ERR-DUPLICATE (err u103))
(define-constant ERR-UNAUTHORIZED (err u104))
(define-constant ERR-ALREADY-RESOLVED (err u105))

(define-constant STATUS-ACTIVE u1)
(define-constant STATUS-PAUSED u2)
(define-constant STATUS-RESOLVED u3)
(define-constant STATUS-CANCELLED u4)

(define-constant CATEGORY-CRYPTO u1)
(define-constant CATEGORY-STACKS u2)
(define-constant CATEGORY-MACRO u3)
(define-constant CATEGORY-REGULATION u4)
(define-constant CATEGORY-TECH u5)
(define-constant CATEGORY-GLOBAL u6)

;; Minimum 144 blocks (~24h) before resolution
(define-constant MIN-RESOLUTION-BLOCKS u144)

;; ============================================================
;; DATA VARS
;; ============================================================
(define-data-var admin principal CONTRACT-OWNER)
(define-data-var market-count uint u0)

;; ============================================================
;; DATA MAPS
;; ============================================================
(define-map markets uint {
  question: (string-ascii 256),
  description: (string-ascii 1024),
  category: uint,
  creator: principal,
  created-at: uint,
  resolution-block: uint,
  status: uint,
  outcome: (optional bool),
  ai-generated: bool,
  metadata-uri: (string-ascii 256)
})

(define-map authorized-creators principal bool)

;; ============================================================
;; READ-ONLY FUNCTIONS
;; ============================================================
(define-read-only (get-market (market-id uint))
  (ok (map-get? markets market-id))
)

(define-read-only (get-market-count)
  (ok (var-get market-count))
)

(define-read-only (get-admin)
  (ok (var-get admin))
)

(define-read-only (is-authorized-creator (creator principal))
  (ok (default-to false (map-get? authorized-creators creator)))
)

(define-read-only (get-active-markets (limit uint) (offset uint))
  (ok { limit: limit, offset: offset, total: (var-get market-count) })
)

;; ============================================================
;; PRIVATE HELPERS
;; ============================================================
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

(define-private (is-authorized (caller principal))
  (or (is-admin) (default-to false (map-get? authorized-creators caller)))
)

;; ============================================================
;; PUBLIC FUNCTIONS
;; ============================================================

(define-public (create-market
    (question (string-ascii 256))
    (description (string-ascii 1024))
    (category uint)
    (resolution-block uint)
    (ai-generated bool)
    (metadata-uri (string-ascii 256)))
  (begin
    (asserts! (is-authorized tx-sender) ERR-UNAUTHORIZED)
    (asserts! (> (len question) u0) ERR-INVALID-PARAMS)
    (asserts! (> (len description) u0) ERR-INVALID-PARAMS)
    (asserts! (and (>= category CATEGORY-CRYPTO) (<= category CATEGORY-GLOBAL)) ERR-INVALID-PARAMS)
    (asserts! (> resolution-block (+ block-height MIN-RESOLUTION-BLOCKS)) ERR-INVALID-PARAMS)
    (let ((new-id (+ (var-get market-count) u1)))
      (map-set markets new-id {
        question: question,
        description: description,
        category: category,
        creator: tx-sender,
        created-at: block-height,
        resolution-block: resolution-block,
        status: STATUS-ACTIVE,
        outcome: none,
        ai-generated: ai-generated,
        metadata-uri: metadata-uri
      })
      (var-set market-count new-id)
      (ok new-id)
    )
  )
)

(define-public (pause-market (market-id uint))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (let ((market (unwrap! (map-get? markets market-id) ERR-NOT-FOUND)))
      (asserts! (is-eq (get status market) STATUS-ACTIVE) ERR-INVALID-PARAMS)
      (map-set markets market-id (merge market { status: STATUS-PAUSED }))
      (ok true)
    )
  )
)

(define-public (resume-market (market-id uint))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (let ((market (unwrap! (map-get? markets market-id) ERR-NOT-FOUND)))
      (asserts! (is-eq (get status market) STATUS-PAUSED) ERR-INVALID-PARAMS)
      (map-set markets market-id (merge market { status: STATUS-ACTIVE }))
      (ok true)
    )
  )
)

;; Called internally by oracle-registry.clar after finalization
(define-public (resolve-market (market-id uint) (outcome bool))
  (begin
    ;; Only the oracle-registry contract (deployed at same address) can call this
    (asserts! (is-admin) ERR-UNAUTHORIZED)
    (let ((market (unwrap! (map-get? markets market-id) ERR-NOT-FOUND)))
      (asserts! (is-eq (get status market) STATUS-ACTIVE) ERR-ALREADY-RESOLVED)
      (map-set markets market-id (merge market {
        status: STATUS-RESOLVED,
        outcome: (some outcome)
      }))
      (ok true)
    )
  )
)

(define-public (cancel-market (market-id uint))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (let ((market (unwrap! (map-get? markets market-id) ERR-NOT-FOUND)))
      (asserts! (not (is-eq (get status market) STATUS-RESOLVED)) ERR-ALREADY-RESOLVED)
      (map-set markets market-id (merge market { status: STATUS-CANCELLED }))
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

(define-public (add-creator (creator principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (map-set authorized-creators creator true)
    (ok true)
  )
)

(define-public (remove-creator (creator principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (map-delete authorized-creators creator)
    (ok true)
  )
)
