;; market-amm.clar
;; Constant Product Market Maker (x * y = k) for prediction market shares
;; Price of YES = No_pool / (Yes_pool + No_pool)
;; Price of NO  = Yes_pool / (Yes_pool + No_pool)
;; Satoshi Bets — XXIX Labs 2026

(use-trait sip010-trait .sip010-ft-trait.sip010-ft-trait)

;; ============================================================
;; CONSTANTS
;; ============================================================
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-ADMIN (err u100))
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-INVALID-PARAMS (err u102))
(define-constant ERR-INSUFFICIENT-FUNDS (err u103))
(define-constant ERR-MARKET-PAUSED (err u104))
(define-constant ERR-SLIPPAGE (err u105))
(define-constant ERR-NOT-RESOLVED (err u106))
(define-constant ERR-ALREADY-CLAIMED (err u107))
(define-constant ERR-WRONG-OUTCOME (err u108))
(define-constant ERR-POOL-EXISTS (err u109))
(define-constant ERR-POOL-NOT-FOUND (err u110))
(define-constant ERR-ZERO-AMOUNT (err u111))
(define-constant ERR-UNAUTHORIZED (err u112))

;; Fee constants in basis points (10000 = 100%)
(define-constant BUY-FEE-BPS u200)     ;; 2% fee on buys
(define-constant SELL-FEE-BPS u100)    ;; 1% fee on sells
(define-constant CLAIM-FEE-BPS u100)   ;; 1% fee on winning claims

;; 6-decimal precision for price representation (0–1,000,000 = 0–1.0)
(define-constant PRECISION u1000000)
;; Minimum pool size: 0.01 sBTC to prevent division by zero
(define-constant MIN-POOL-SIZE u1000000)

;; ============================================================
;; DATA VARS
;; ============================================================
(define-data-var admin principal CONTRACT-OWNER)
(define-data-var fee-recipient principal CONTRACT-OWNER)

;; ============================================================
;; DATA MAPS
;; ============================================================
(define-map pools uint {
  yes-pool: uint,
  no-pool: uint,
  k-constant: uint,
  total-volume: uint,
  total-fees: uint,
  resolved: bool,
  outcome: (optional bool),
  sbtc-contract: principal
})

(define-map positions { market-id: uint, trader: principal } {
  yes-shares: uint,
  no-shares: uint,
  cost-basis: uint,
  claimed: bool
})

;; ============================================================
;; READ-ONLY: PRICE QUERIES
;; ============================================================

;; Returns YES price as fraction of PRECISION (e.g., 500000 = 0.5 = 50%)
(define-read-only (get-yes-price (market-id uint))
  (match (map-get? pools market-id)
    pool
      (let (
          (yes (get yes-pool pool))
          (no (get no-pool pool))
          (total (+ yes no))
        )
        (ok (/ (* no PRECISION) total))
      )
    (err ERR-POOL-NOT-FOUND)
  )
)

(define-read-only (get-no-price (market-id uint))
  (match (map-get? pools market-id)
    pool
      (let (
          (yes (get yes-pool pool))
          (no (get no-pool pool))
          (total (+ yes no))
        )
        (ok (/ (* yes PRECISION) total))
      )
    (err ERR-POOL-NOT-FOUND)
  )
)

(define-read-only (get-pool (market-id uint))
  (ok (map-get? pools market-id))
)

(define-read-only (get-position (market-id uint) (trader principal))
  (ok (map-get? positions { market-id: market-id, trader: trader }))
)

;; Pre-trade quote: estimated YES shares out for given sBTC in (includes fee breakdown)
(define-read-only (quote-buy-yes (market-id uint) (amount-in uint))
  (match (map-get? pools market-id)
    pool
      (let (
          (fee (/ (* amount-in BUY-FEE-BPS) u10000))
          (amount-after-fee (- amount-in fee))
          (yes (get yes-pool pool))
          (no (get no-pool pool))
          (k (get k-constant pool))
          (new-no (+ no amount-after-fee))
          (new-yes (/ k new-no))
          (shares-out (- yes new-yes))
          (total (+ yes no))
          (new-total (+ new-yes new-no))
          (new-yes-price (/ (* new-no PRECISION) new-total))
        )
        (ok {
          shares-out: shares-out,
          fee: fee,
          price-impact-bps: (/ (* (- new-yes-price (/ (* no PRECISION) total)) u10000) (/ (* no PRECISION) total)),
          new-yes-price: new-yes-price
        })
      )
    (err ERR-POOL-NOT-FOUND)
  )
)

(define-read-only (quote-buy-no (market-id uint) (amount-in uint))
  (match (map-get? pools market-id)
    pool
      (let (
          (fee (/ (* amount-in BUY-FEE-BPS) u10000))
          (amount-after-fee (- amount-in fee))
          (yes (get yes-pool pool))
          (no (get no-pool pool))
          (k (get k-constant pool))
          (new-yes (+ yes amount-after-fee))
          (new-no (/ k new-yes))
          (shares-out (- no new-no))
          (total (+ yes no))
          (new-total (+ new-yes new-no))
          (new-no-price (/ (* new-yes PRECISION) new-total))
        )
        (ok {
          shares-out: shares-out,
          fee: fee,
          price-impact-bps: u0,
          new-no-price: new-no-price
        })
      )
    (err ERR-POOL-NOT-FOUND)
  )
)

;; ============================================================
;; PRIVATE HELPERS
;; ============================================================
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; ============================================================
;; PUBLIC: POOL MANAGEMENT
;; ============================================================

(define-public (initialize-pool
    (market-id uint)
    (initial-yes uint)
    (initial-no uint)
    (sbtc-contract <sip010-trait>))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (asserts! (is-none (map-get? pools market-id)) ERR-POOL-EXISTS)
    (asserts! (>= initial-yes MIN-POOL-SIZE) ERR-INVALID-PARAMS)
    (asserts! (>= initial-no MIN-POOL-SIZE) ERR-INVALID-PARAMS)
    ;; Transfer initial liquidity from admin into the contract
    (try! (contract-call? sbtc-contract transfer
      (+ initial-yes initial-no)
      tx-sender
      (as-contract tx-sender)
      none))
    (map-set pools market-id {
      yes-pool: initial-yes,
      no-pool: initial-no,
      k-constant: (* initial-yes initial-no),
      total-volume: u0,
      total-fees: u0,
      resolved: false,
      outcome: none,
      sbtc-contract: (contract-of sbtc-contract)
    })
    (ok true)
  )
)

;; ============================================================
;; PUBLIC: TRADING
;; ============================================================

(define-public (buy-yes-shares
    (market-id uint)
    (amount-in uint)
    (min-shares-out uint)
    (sbtc-contract <sip010-trait>))
  (begin
    (asserts! (> amount-in u0) ERR-ZERO-AMOUNT)
    (let (
        (pool (unwrap! (map-get? pools market-id) ERR-POOL-NOT-FOUND))
        (fee (/ (* amount-in BUY-FEE-BPS) u10000))
        (amount-after-fee (- amount-in fee))
        (yes (get yes-pool pool))
        (no (get no-pool pool))
        (k (get k-constant pool))
        (new-no (+ no amount-after-fee))
        (new-yes (/ k new-no))
        (shares-out (- yes new-yes))
        (current-position
          (default-to
            { yes-shares: u0, no-shares: u0, cost-basis: u0, claimed: false }
            (map-get? positions { market-id: market-id, trader: tx-sender })))
      )
      (asserts! (not (get resolved pool)) ERR-NOT-RESOLVED)
      (asserts! (> shares-out u0) ERR-INVALID-PARAMS)
      (asserts! (>= shares-out min-shares-out) ERR-SLIPPAGE)
      ;; Pull sBTC from trader into the contract
      (try! (contract-call? sbtc-contract transfer
        amount-in tx-sender (as-contract tx-sender) none))
      ;; Update pool reserves (k-constant stays the same)
      (map-set pools market-id (merge pool {
        yes-pool: new-yes,
        no-pool: new-no,
        total-volume: (+ (get total-volume pool) amount-in),
        total-fees: (+ (get total-fees pool) fee)
      }))
      ;; Record trader's position
      (map-set positions { market-id: market-id, trader: tx-sender }
        (merge current-position {
          yes-shares: (+ (get yes-shares current-position) shares-out),
          cost-basis: (+ (get cost-basis current-position) amount-in)
        })
      )
      ;; Send fee to fee recipient
      (as-contract
        (try! (contract-call? sbtc-contract transfer
          fee tx-sender (var-get fee-recipient) none)))
      (ok {
        shares-out: shares-out,
        fee: fee,
        new-yes-price: (/ (* new-no PRECISION) (+ new-yes new-no))
      })
    )
  )
)

(define-public (buy-no-shares
    (market-id uint)
    (amount-in uint)
    (min-shares-out uint)
    (sbtc-contract <sip010-trait>))
  (begin
    (asserts! (> amount-in u0) ERR-ZERO-AMOUNT)
    (let (
        (pool (unwrap! (map-get? pools market-id) ERR-POOL-NOT-FOUND))
        (fee (/ (* amount-in BUY-FEE-BPS) u10000))
        (amount-after-fee (- amount-in fee))
        (yes (get yes-pool pool))
        (no (get no-pool pool))
        (k (get k-constant pool))
        (new-yes (+ yes amount-after-fee))
        (new-no (/ k new-yes))
        (shares-out (- no new-no))
        (current-position
          (default-to
            { yes-shares: u0, no-shares: u0, cost-basis: u0, claimed: false }
            (map-get? positions { market-id: market-id, trader: tx-sender })))
      )
      (asserts! (not (get resolved pool)) ERR-NOT-RESOLVED)
      (asserts! (> shares-out u0) ERR-INVALID-PARAMS)
      (asserts! (>= shares-out min-shares-out) ERR-SLIPPAGE)
      (try! (contract-call? sbtc-contract transfer
        amount-in tx-sender (as-contract tx-sender) none))
      (map-set pools market-id (merge pool {
        yes-pool: new-yes,
        no-pool: new-no,
        total-volume: (+ (get total-volume pool) amount-in),
        total-fees: (+ (get total-fees pool) fee)
      }))
      (map-set positions { market-id: market-id, trader: tx-sender }
        (merge current-position {
          no-shares: (+ (get no-shares current-position) shares-out),
          cost-basis: (+ (get cost-basis current-position) amount-in)
        })
      )
      (as-contract
        (try! (contract-call? sbtc-contract transfer
          fee tx-sender (var-get fee-recipient) none)))
      (ok {
        shares-out: shares-out,
        fee: fee,
        new-no-price: (/ (* new-yes PRECISION) (+ new-yes new-no))
      })
    )
  )
)

(define-public (sell-yes-shares
    (market-id uint)
    (shares-in uint)
    (min-amount-out uint)
    (sbtc-contract <sip010-trait>))
  (begin
    (asserts! (> shares-in u0) ERR-ZERO-AMOUNT)
    (let (
        (pool (unwrap! (map-get? pools market-id) ERR-POOL-NOT-FOUND))
        (position (unwrap!
          (map-get? positions { market-id: market-id, trader: tx-sender })
          ERR-NOT-FOUND))
        (yes (get yes-pool pool))
        (no (get no-pool pool))
        (k (get k-constant pool))
        ;; Selling YES means YES pool grows, NO pool shrinks
        (new-yes (+ yes shares-in))
        (new-no (/ k new-yes))
        (raw-out (- no new-no))
        (fee (/ (* raw-out SELL-FEE-BPS) u10000))
        (amount-out (- raw-out fee))
      )
      (asserts! (not (get resolved pool)) ERR-NOT-RESOLVED)
      (asserts! (>= (get yes-shares position) shares-in) ERR-INSUFFICIENT-FUNDS)
      (asserts! (>= amount-out min-amount-out) ERR-SLIPPAGE)
      (map-set pools market-id (merge pool {
        yes-pool: new-yes,
        no-pool: new-no,
        total-fees: (+ (get total-fees pool) fee)
      }))
      (map-set positions { market-id: market-id, trader: tx-sender }
        (merge position {
          yes-shares: (- (get yes-shares position) shares-in)
        })
      )
      ;; Send payout and fee from contract
      (as-contract
        (try! (contract-call? sbtc-contract transfer
          amount-out tx-sender tx-sender none)))
      (as-contract
        (try! (contract-call? sbtc-contract transfer
          fee tx-sender (var-get fee-recipient) none)))
      (ok { amount-out: amount-out, fee: fee })
    )
  )
)

(define-public (sell-no-shares
    (market-id uint)
    (shares-in uint)
    (min-amount-out uint)
    (sbtc-contract <sip010-trait>))
  (begin
    (asserts! (> shares-in u0) ERR-ZERO-AMOUNT)
    (let (
        (pool (unwrap! (map-get? pools market-id) ERR-POOL-NOT-FOUND))
        (position (unwrap!
          (map-get? positions { market-id: market-id, trader: tx-sender })
          ERR-NOT-FOUND))
        (yes (get yes-pool pool))
        (no (get no-pool pool))
        (k (get k-constant pool))
        ;; Selling NO means NO pool grows, YES pool shrinks
        (new-no (+ no shares-in))
        (new-yes (/ k new-no))
        (raw-out (- yes new-yes))
        (fee (/ (* raw-out SELL-FEE-BPS) u10000))
        (amount-out (- raw-out fee))
      )
      (asserts! (not (get resolved pool)) ERR-NOT-RESOLVED)
      (asserts! (>= (get no-shares position) shares-in) ERR-INSUFFICIENT-FUNDS)
      (asserts! (>= amount-out min-amount-out) ERR-SLIPPAGE)
      (map-set pools market-id (merge pool {
        yes-pool: new-yes,
        no-pool: new-no,
        total-fees: (+ (get total-fees pool) fee)
      }))
      (map-set positions { market-id: market-id, trader: tx-sender }
        (merge position {
          no-shares: (- (get no-shares position) shares-in)
        })
      )
      (as-contract
        (try! (contract-call? sbtc-contract transfer
          amount-out tx-sender tx-sender none)))
      (as-contract
        (try! (contract-call? sbtc-contract transfer
          fee tx-sender (var-get fee-recipient) none)))
      (ok { amount-out: amount-out, fee: fee })
    )
  )
)

(define-public (claim-winnings
    (market-id uint)
    (sbtc-contract <sip010-trait>))
  (let (
      (pool (unwrap! (map-get? pools market-id) ERR-POOL-NOT-FOUND))
      (position (unwrap!
        (map-get? positions { market-id: market-id, trader: tx-sender })
        ERR-NOT-FOUND))
      (outcome (unwrap! (get outcome pool) ERR-NOT-RESOLVED))
    )
    (asserts! (get resolved pool) ERR-NOT-RESOLVED)
    (asserts! (not (get claimed position)) ERR-ALREADY-CLAIMED)
    (let (
        (winning-shares
          (if outcome (get yes-shares position) (get no-shares position)))
        (total-winning-pool
          (if outcome (get yes-pool pool) (get no-pool pool)))
        (total-pool
          (+ (get yes-pool pool) (get no-pool pool)))
        (raw-winnings
          (if (> total-winning-pool u0)
            (/ (* winning-shares total-pool) total-winning-pool)
            u0))
        (fee (/ (* raw-winnings CLAIM-FEE-BPS) u10000))
        (winnings (- raw-winnings fee))
      )
      ;; Must have winning shares
      (asserts! (> winning-shares u0) ERR-WRONG-OUTCOME)
      ;; Mark claimed before transfer (checks-effects-interactions)
      (map-set positions { market-id: market-id, trader: tx-sender }
        (merge position { claimed: true })
      )
      (as-contract
        (try! (contract-call? sbtc-contract transfer
          winnings tx-sender tx-sender none)))
      (as-contract
        (try! (contract-call? sbtc-contract transfer
          fee tx-sender (var-get fee-recipient) none)))
      (ok { winnings: winnings, fee: fee })
    )
  )
)

;; Called by oracle-registry.clar after finalize-resolution
(define-public (resolve (market-id uint) (outcome bool))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (let ((pool (unwrap! (map-get? pools market-id) ERR-POOL-NOT-FOUND)))
      (asserts! (not (get resolved pool)) ERR-ALREADY-CLAIMED)
      (map-set pools market-id (merge pool {
        resolved: true,
        outcome: (some outcome)
      }))
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

(define-public (set-fee-recipient (new-recipient principal))
  (begin
    (asserts! (is-admin) ERR-NOT-ADMIN)
    (var-set fee-recipient new-recipient)
    (ok true)
  )
)
