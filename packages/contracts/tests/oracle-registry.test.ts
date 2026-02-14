import { describe, it, expect, beforeEach } from 'vitest'
import { Cl } from '@stacks/transactions'
import { initSimnet } from '@hirosystems/clarinet-sdk'
import type { Simnet } from '@hirosystems/clarinet-sdk'

describe('oracle-registry', () => {
  let simnet: Simnet
  let deployer: string
  let alice: string
  let bob: string

  const MARKET_ID = 1

  const SBTC = (d: string) => Cl.contractPrincipal(d, 'sbtc-token')

  beforeEach(async () => {
    simnet = await initSimnet()
    const accounts = simnet.getAccounts()
    deployer = accounts.get('deployer')!
    alice = accounts.get('wallet_1')!
    bob = accounts.get('wallet_2')!

    // Create a market in factory
    simnet.callPublicFn(
      'market-factory', 'create-market',
      [
        Cl.stringAscii('Will BTC exceed $150,000?'),
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
  // register-oracle
  // ============================================================
  describe('register-oracle', () => {
    it('admin can register an oracle', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(alice), Cl.uint(2), Cl.stringAscii('Satoshi AI Oracle')],
        deployer
      )
      expect(result.result).toBeOk(Cl.bool(true))
    })

    it('registered oracle is listed as active', () => {
      simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(alice), Cl.uint(2), Cl.stringAscii('Satoshi AI Oracle')],
        deployer
      )
      const isOracle = simnet.callReadOnlyFn(
        'oracle-registry', 'is-oracle',
        [Cl.principal(alice)],
        deployer
      )
      expect(isOracle.result).toBeOk(Cl.bool(true))
    })

    it('non-admin cannot register an oracle', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(bob), Cl.uint(2), Cl.stringAscii('Fake Oracle')],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(100)) // ERR-NOT-ADMIN
    })

    it('returns ERR-INVALID-PARAMS for invalid oracle type 0', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(alice), Cl.uint(0), Cl.stringAscii('Oracle')],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })

    it('returns ERR-INVALID-PARAMS for invalid oracle type > 3', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(alice), Cl.uint(4), Cl.stringAscii('Oracle')],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })

    it('accepts all 3 valid oracle types', () => {
      for (let type = 1; type <= 3; type++) {
        const accounts = simnet.getAccounts()
        const oraclePrincipal = [...accounts.values()][type]
        const result = simnet.callPublicFn(
          'oracle-registry', 'register-oracle',
          [Cl.principal(oraclePrincipal), Cl.uint(type), Cl.stringAscii(`Oracle ${type}`)],
          deployer
        )
        expect(result.result).toBeOk(Cl.bool(true))
      }
    })
  })

  // ============================================================
  // remove-oracle
  // ============================================================
  describe('remove-oracle', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(alice), Cl.uint(2), Cl.stringAscii('AI Oracle')],
        deployer
      )
    })

    it('admin can deactivate an oracle', () => {
      simnet.callPublicFn('oracle-registry', 'remove-oracle', [Cl.principal(alice)], deployer)
      const isOracle = simnet.callReadOnlyFn('oracle-registry', 'is-oracle', [Cl.principal(alice)], deployer)
      expect(isOracle.result).toBeOk(Cl.bool(false))
    })

    it('deactivated oracle cannot submit resolutions', () => {
      simnet.callPublicFn('oracle-registry', 'remove-oracle', [Cl.principal(alice)], deployer)
      const result = simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [
          Cl.uint(MARKET_ID),
          Cl.bool(true),
          Cl.uint(9500),
          Cl.stringAscii('https://evidence.example.com'),
          Cl.none(),
        ],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(108)) // ERR-NOT-ORACLE
    })
  })

  // ============================================================
  // submit-resolution
  // ============================================================
  describe('submit-resolution', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(deployer), Cl.uint(2), Cl.stringAscii('Admin AI Oracle')],
        deployer
      )
    })

    it('registered oracle can submit a resolution', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [
          Cl.uint(MARKET_ID),
          Cl.bool(true),
          Cl.uint(9700),
          Cl.stringAscii('https://pyth.network/btc-price'),
          Cl.none(),
        ],
        deployer
      )
      expect(result.result).toBeOk(Cl.bool(true))
    })

    it('resolution is stored with correct data', () => {
      simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [
          Cl.uint(MARKET_ID),
          Cl.bool(true),
          Cl.uint(9700),
          Cl.stringAscii('https://pyth.network/btc-price'),
          Cl.none(),
        ],
        deployer
      )
      const resolution = simnet.callReadOnlyFn(
        'oracle-registry', 'get-resolution', [Cl.uint(MARKET_ID)], deployer
      )
      const resData = (resolution.result as any).value.value.data
      expect(resData.outcome).toEqual(Cl.bool(true))
      expect(resData.confidence).toEqual(Cl.uint(9700))
      expect(resData.status).toEqual(Cl.uint(1)) // RESOLUTION-STATUS-PENDING
    })

    it('unregistered oracle cannot submit', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [Cl.uint(MARKET_ID), Cl.bool(true), Cl.uint(9700), Cl.stringAscii('https://evidence.com'), Cl.none()],
        bob
      )
      expect(result.result).toBeErr(Cl.uint(108)) // ERR-NOT-ORACLE
    })

    it('cannot submit resolution twice for same market', () => {
      simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [Cl.uint(MARKET_ID), Cl.bool(true), Cl.uint(9700), Cl.stringAscii('https://evidence.com'), Cl.none()],
        deployer
      )
      const result = simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [Cl.uint(MARKET_ID), Cl.bool(false), Cl.uint(8000), Cl.stringAscii('https://evidence2.com'), Cl.none()],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(104)) // ERR-ALREADY-SUBMITTED
    })

    it('returns ERR-INVALID-PARAMS for confidence > 10000', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [Cl.uint(MARKET_ID), Cl.bool(true), Cl.uint(10001), Cl.stringAscii('https://evidence.com'), Cl.none()],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })
  })

  // ============================================================
  // dispute-resolution
  // ============================================================
  describe('dispute-resolution', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(deployer), Cl.uint(2), Cl.stringAscii('AI Oracle')],
        deployer
      )
      simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [Cl.uint(MARKET_ID), Cl.bool(true), Cl.uint(9700), Cl.stringAscii('https://evidence.com'), Cl.none()],
        deployer
      )
    })

    it('anyone can dispute with sufficient stake during dispute window', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'dispute-resolution',
        [Cl.uint(MARKET_ID), SBTC(deployer), Cl.uint(1_000_000)],
        alice
      )
      expect(result.result).toBeOk(Cl.bool(true))
    })

    it('returns ERR-INSUFFICIENT-STAKE if stake below minimum', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'dispute-resolution',
        [Cl.uint(MARKET_ID), SBTC(deployer), Cl.uint(100)], // too low
        alice
      )
      expect(result.result).toBeErr(Cl.uint(107))
    })

    it('dispute status changes to DISPUTED (u2) after dispute', () => {
      simnet.callPublicFn(
        'oracle-registry', 'dispute-resolution',
        [Cl.uint(MARKET_ID), SBTC(deployer), Cl.uint(1_000_000)],
        alice
      )
      const resolution = simnet.callReadOnlyFn(
        'oracle-registry', 'get-resolution', [Cl.uint(MARKET_ID)], deployer
      )
      const status = (resolution.result as any).value.value.data.status
      expect(status).toEqual(Cl.uint(2)) // RESOLUTION-STATUS-DISPUTED
    })

    it('cannot dispute after dispute window closes', () => {
      // Advance blocks past dispute window
      simnet.mineEmptyBurnBlocks(150)
      const result = simnet.callPublicFn(
        'oracle-registry', 'dispute-resolution',
        [Cl.uint(MARKET_ID), SBTC(deployer), Cl.uint(1_000_000)],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(106)) // ERR-DISPUTE-WINDOW-CLOSED
    })
  })

  // ============================================================
  // override-resolution
  // ============================================================
  describe('override-resolution', () => {
    beforeEach(() => {
      simnet.callPublicFn(
        'oracle-registry', 'register-oracle',
        [Cl.principal(deployer), Cl.uint(2), Cl.stringAscii('AI Oracle')],
        deployer
      )
      simnet.callPublicFn(
        'oracle-registry', 'submit-resolution',
        [Cl.uint(MARKET_ID), Cl.bool(true), Cl.uint(9700), Cl.stringAscii('https://evidence.com'), Cl.none()],
        deployer
      )
      // Initialize AMM pool so resolve() doesn't fail
      simnet.callPublicFn(
        'market-amm', 'initialize-pool',
        [Cl.uint(MARKET_ID), Cl.uint(10_000_000), Cl.uint(10_000_000), SBTC(deployer)],
        deployer
      )
    })

    it('admin can override a pending resolution', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'override-resolution',
        [Cl.uint(MARKET_ID), Cl.bool(false)], // flip to NO
        deployer
      )
      expect(result.result).toBeOk(Cl.bool(true))
    })

    it('non-admin cannot override', () => {
      const result = simnet.callPublicFn(
        'oracle-registry', 'override-resolution',
        [Cl.uint(MARKET_ID), Cl.bool(false)],
        alice
      )
      expect(result.result).toBeErr(Cl.uint(100))
    })
  })
})
