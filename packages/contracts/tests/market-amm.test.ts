import { describe, it, expect, beforeEach } from 'vitest'
import { Cl } from '@stacks/transactions'
import { initSimnet } from '@hirosystems/clarinet-sdk'
import type { Simnet } from '@hirosystems/clarinet-sdk'

// sBTC mock contract principal (from simnet accounts)
const SBTC = (deployer: string) =>
  Cl.contractPrincipal(deployer, 'sbtc-token')

describe('market-amm', () => {
  let simnet: Simnet
  let deployer: string
  let alice: string
  let bob: string

  const MARKET_ID = 1
  const INITIAL_YES = 10_000_000  // 0.1 sBTC
  const INITIAL_NO = 10_000_000   // 0.1 sBTC (50/50 starting price)

  beforeEach(async () => {
    simnet = await initSimnet()
    const accounts = simnet.getAccounts()
    deployer = accounts.get('deployer')!
    alice = accounts.get('wallet_1')!
    bob = accounts.get('wallet_2')!

    // Create a market in the factory first
    simnet.callPublicFn(
      'market-factory',
      'create-market',
      [
        Cl.stringAscii('Will BTC exceed $150,000 by June 2026?'),
        Cl.stringAscii('Resolves YES if BTC/USD exceeds $150,000.'),
        Cl.uint(1),
        Cl.uint(simnet.blockHeight + 500),
        Cl.bool(false),
        Cl.stringAscii(''),
      ],
      deployer
    )
  })

  // ============================================================
  // initialize-pool
  // ============================================================
  describe('initialize-pool', () => {
    it('admin can initialize a pool with equal reserves', () => {
      const result = simnet.callPublicFn(
        'market-amm',
        'initialize-pool',
        [
          Cl.uint(MARKET_ID),
          Cl.uint(INITIAL_YES),
          Cl.uint(INITIAL_NO),
          SBTC(deployer),
        ],
        deployer
      )
      expect(result.result).toBeOk(Cl.bool(true))
    })

    it('pool has correct k-constant after initialization', () => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
      const pool = simnet.callReadOnlyFn('market-amm', 'get-pool', [Cl.uint(MARKET_ID)], deployer)
      const poolData = (pool.result as any).value.value.data
      expect(poolData['yes-pool']).toEqual(Cl.uint(INITIAL_YES))
      expect(poolData['no-pool']).toEqual(Cl.uint(INITIAL_NO))
      expect(poolData['k-constant']).toEqual(Cl.uint(INITIAL_YES * INITIAL_NO))
    })

    it('YES price is 50% (500000) when pools are equal', () => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
      const price = simnet.callReadOnlyFn('market-amm', 'get-yes-price', [Cl.uint(MARKET_ID)], deployer)
      expect(price.result).toBeOk(Cl.uint(500000))
    })

    it('NO price is 50% (500000) when pools are equal', () => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
      const price = simnet.callReadOnlyFn('market-amm', 'get-no-price', [Cl.uint(MARKET_ID)], deployer)
      expect(price.result).toBeOk(Cl.uint(500000))
    })

    it('returns ERR-POOL-EXISTS (u109) if pool already initialized', () => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
      const result = simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(109))
    })

    it('returns ERR-NOT-ADMIN (u100) for non-admin', () => {
      const result = simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(100))
    })

    it('returns ERR-INVALID-PARAMS (u102) if initial pool below MIN-POOL-SIZE', () => {
      const result = simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(100), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })
  })

  // ============================================================
  // buy-yes-shares
  // ============================================================
  describe('buy-yes-shares', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
    })

    it('buying YES shares succeeds and returns shares-out > 0', () => {
      const result = simnet.callPublicFn(
        'market-amm', 'buy-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(1_000_000), Cl.uint(0), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeOk()
      const data = (result.result as any).value.data
      expect(Number(data['shares-out'].value)).toBeGreaterThan(0)
    })

    it('buying YES shifts YES price upward', () => {
      const before = simnet.callReadOnlyFn('market-amm', 'get-yes-price', [Cl.uint(MARKET_ID)], deployer)
      const priceBeforeNum = Number((before.result as any).value.value)

      simnet.callPublicFn(
        'market-amm', 'buy-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(2_000_000), Cl.uint(0), SBTC(deployer)],
        alice
      )

      const after = simnet.callReadOnlyFn('market-amm', 'get-yes-price', [Cl.uint(MARKET_ID)], deployer)
      const priceAfterNum = Number((after.result as any).value.value)
      expect(priceAfterNum).toBeGreaterThan(priceBeforeNum)
    })

    it('fee is 2% of amount-in', () => {
      const amountIn = 1_000_000
      const result = simnet.callPublicFn(
        'market-amm', 'buy-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(amountIn), Cl.uint(0), SBTC(deployer)],
        alice
      )
      const fee = Number((result.result as any).value.data.fee.value)
      expect(fee).toBe(Math.floor(amountIn * 200 / 10000)) // 2%
    })

    it('returns ERR-SLIPPAGE (u105) when output below min-shares-out', () => {
      const result = simnet.callPublicFn(
        'market-amm', 'buy-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(1_000_000), Cl.uint(999_999_999), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(105))
    })

    it('returns ERR-ZERO-AMOUNT (u111) for zero input', () => {
      const result = simnet.callPublicFn(
        'market-amm', 'buy-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(0), Cl.uint(0), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(111))
    })

    it('records position after buy', () => {
      simnet.callPublicFn(
        'market-amm', 'buy-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(1_000_000), Cl.uint(0), SBTC(deployer)],
        alice
      )
      const position = simnet.callReadOnlyFn(
        'market-amm', 'get-position',
        [Cl.uint(MARKET_ID), Cl.principal(alice)],
        alice
      )
      const posData = (position.result as any).value.value.data
      expect(Number(posData['yes-shares'].value)).toBeGreaterThan(0)
      expect(Number(posData['cost-basis'].value)).toBe(1_000_000)
    })
  })

  // ============================================================
  // buy-no-shares
  // ============================================================
  describe('buy-no-shares', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
    })

    it('buying NO shares shifts NO price upward', () => {
      const before = simnet.callReadOnlyFn('market-amm', 'get-no-price', [Cl.uint(MARKET_ID)], deployer)
      const priceBeforeNum = Number((before.result as any).value.value)

      simnet.callPublicFn(
        'market-amm', 'buy-no-shares',
        [Cl.uint(MARKET_ID), Cl.uint(2_000_000), Cl.uint(0), SBTC(deployer)],
        bob
      )

      const after = simnet.callReadOnlyFn('market-amm', 'get-no-price', [Cl.uint(MARKET_ID)], deployer)
      const priceAfterNum = Number((after.result as any).value.value)
      expect(priceAfterNum).toBeGreaterThan(priceBeforeNum)
    })
  })

  // ============================================================
  // sell-yes-shares
  // ============================================================
  describe('sell-yes-shares', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
      // Alice buys some YES shares first
      simnet.callPublicFn(
        'market-amm', 'buy-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(2_000_000), Cl.uint(0), SBTC(deployer)],
        alice
      )
    })

    it('alice can sell her YES shares', () => {
      const position = simnet.callReadOnlyFn(
        'market-amm', 'get-position', [Cl.uint(MARKET_ID), Cl.principal(alice)], alice
      )
      const yesShares = Number((position.result as any).value.value.data['yes-shares'].value)

      const result = simnet.callPublicFn(
        'market-amm', 'sell-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(yesShares), Cl.uint(0), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeOk()
      const data = (result.result as any).value.data
      expect(Number(data['amount-out'].value)).toBeGreaterThan(0)
    })

    it('returns ERR-INSUFFICIENT-FUNDS (u103) if selling more than owned', () => {
      const result = simnet.callPublicFn(
        'market-amm', 'sell-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(999_999_999), Cl.uint(0), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(103))
    })
  })

  // ============================================================
  // claim-winnings
  // ============================================================
  describe('claim-winnings', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
      simnet.callPublicFn(
        'market-amm', 'buy-yes-shares',
        [Cl.uint(MARKET_ID), Cl.uint(5_000_000), Cl.uint(0), SBTC(deployer)],
        alice
      )
      simnet.callPublicFn(
        'market-amm', 'buy-no-shares',
        [Cl.uint(MARKET_ID), Cl.uint(3_000_000), Cl.uint(0), SBTC(deployer)],
        bob
      )
    })

    it('returns ERR-NOT-RESOLVED (u106) before market is resolved', () => {
      const result = simnet.callPublicFn(
        'market-amm', 'claim-winnings',
        [Cl.uint(MARKET_ID), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(106))
    })

    it('YES winner can claim winnings after YES resolution', () => {
      simnet.callPublicFn(
        'market-amm', 'resolve',
        [Cl.uint(MARKET_ID), Cl.bool(true)],
        deployer
      )
      const result = simnet.callPublicFn(
        'market-amm', 'claim-winnings',
        [Cl.uint(MARKET_ID), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeOk()
      const winnings = Number((result.result as any).value.data.winnings.value)
      expect(winnings).toBeGreaterThan(0)
    })

    it('NO loser cannot claim after YES resolution', () => {
      simnet.callPublicFn(
        'market-amm', 'resolve',
        [Cl.uint(MARKET_ID), Cl.bool(true)],
        deployer
      )
      const result = simnet.callPublicFn(
        'market-amm', 'claim-winnings',
        [Cl.uint(MARKET_ID), SBTC(deployer)],
        bob
      )
      expect(result.result).toBeErr(Cl.uint(108)) // ERR-WRONG-OUTCOME
    })

    it('returns ERR-ALREADY-CLAIMED (u107) on double claim', () => {
      simnet.callPublicFn('market-amm', 'resolve', [Cl.uint(MARKET_ID), Cl.bool(true)], deployer)
      simnet.callPublicFn('market-amm', 'claim-winnings', [Cl.uint(MARKET_ID), SBTC(deployer)], alice)
      const result = simnet.callPublicFn(
        'market-amm', 'claim-winnings',
        [Cl.uint(MARKET_ID), SBTC(deployer)],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(107))
    })
  })

  // ============================================================
  // quote read-only functions
  // ============================================================
  describe('quote-buy-yes', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(INITIAL_YES), Cl.uint(INITIAL_NO), SBTC(deployer)],
        deployer
      )
    })

    it('returns non-zero shares-out for valid input', () => {
      const result = simnet.callReadOnlyFn(
        'market-amm', 'quote-buy-yes',
        [Cl.uint(MARKET_ID), Cl.uint(1_000_000)],
        alice
      )
      expect(result.result).toBeOk()
      const sharesOut = Number((result.result as any).value.data['shares-out'].value)
      expect(sharesOut).toBeGreaterThan(0)
    })
  })
})
