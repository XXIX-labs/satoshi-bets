import { describe, it, expect, beforeEach } from 'vitest'
import { Cl } from '@stacks/transactions'
import { initSimnet } from '@hirosystems/clarinet-sdk'
import type { Simnet } from '@hirosystems/clarinet-sdk'

describe('market-factory', () => {
  let simnet: Simnet
  let deployer: string
  let alice: string
  let bob: string

  beforeEach(async () => {
    simnet = await initSimnet()
    const accounts = simnet.getAccounts()
    deployer = accounts.get('deployer')!
    alice = accounts.get('wallet_1')!
    bob = accounts.get('wallet_2')!
  })

  // Helper to create a valid market
  function createValidMarket(caller = deployer, resolutionOffset = 500) {
    return simnet.callPublicFn(
      'market-factory',
      'create-market',
      [
        Cl.stringAscii('Will BTC exceed $150,000 by June 2026?'),
        Cl.stringAscii('Resolves YES if BTC/USD price on Pyth exceeds $150,000 at any point before the resolution block.'),
        Cl.uint(1), // CATEGORY-CRYPTO
        Cl.uint(simnet.blockHeight + resolutionOffset),
        Cl.bool(false),
        Cl.stringAscii(''),
      ],
      caller
    )
  }

  // ============================================================
  // create-market
  // ============================================================
  describe('create-market', () => {
    it('admin can create a market and returns id u1', () => {
      const result = createValidMarket()
      expect(result.result).toBeOk(Cl.uint(1))
    })

    it('market count increments on each creation', () => {
      createValidMarket()
      createValidMarket()
      createValidMarket()
      const count = simnet.callReadOnlyFn('market-factory', 'get-market-count', [], deployer)
      expect(count.result).toBeOk(Cl.uint(3))
    })

    it('created market has correct fields', () => {
      createValidMarket()
      const market = simnet.callReadOnlyFn('market-factory', 'get-market', [Cl.uint(1)], deployer)
      expect(market.result).toBeOk(
        Cl.some(
          Cl.tuple({
            question: Cl.stringAscii('Will BTC exceed $150,000 by June 2026?'),
            description: Cl.stringAscii('Resolves YES if BTC/USD price on Pyth exceeds $150,000 at any point before the resolution block.'),
            category: Cl.uint(1),
            creator: Cl.principal(deployer),
            'created-at': Cl.uint(simnet.blockHeight - 1),
            'resolution-block': Cl.uint(simnet.blockHeight + 499),
            status: Cl.uint(1), // STATUS-ACTIVE
            outcome: Cl.none(),
            'ai-generated': Cl.bool(false),
            'metadata-uri': Cl.stringAscii(''),
          })
        )
      )
    })

    it('returns ERR-UNAUTHORIZED (u104) for non-admin non-creator', () => {
      const result = createValidMarket(bob)
      expect(result.result).toBeErr(Cl.uint(104))
    })

    it('returns ERR-INVALID-PARAMS (u102) for empty question', () => {
      const result = simnet.callPublicFn(
        'market-factory',
        'create-market',
        [
          Cl.stringAscii(''),
          Cl.stringAscii('Description.'),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 500),
          Cl.bool(false),
          Cl.stringAscii(''),
        ],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })

    it('returns ERR-INVALID-PARAMS (u102) for empty description', () => {
      const result = simnet.callPublicFn(
        'market-factory',
        'create-market',
        [
          Cl.stringAscii('Valid question?'),
          Cl.stringAscii(''),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 500),
          Cl.bool(false),
          Cl.stringAscii(''),
        ],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })

    it('returns ERR-INVALID-PARAMS (u102) for invalid category 0', () => {
      const result = simnet.callPublicFn(
        'market-factory',
        'create-market',
        [
          Cl.stringAscii('Valid question?'),
          Cl.stringAscii('Valid description.'),
          Cl.uint(0), // invalid
          Cl.uint(simnet.blockHeight + 500),
          Cl.bool(false),
          Cl.stringAscii(''),
        ],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })

    it('returns ERR-INVALID-PARAMS (u102) for category > 6', () => {
      const result = simnet.callPublicFn(
        'market-factory',
        'create-market',
        [
          Cl.stringAscii('Valid question?'),
          Cl.stringAscii('Valid description.'),
          Cl.uint(7), // invalid
          Cl.uint(simnet.blockHeight + 500),
          Cl.bool(false),
          Cl.stringAscii(''),
        ],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })

    it('returns ERR-INVALID-PARAMS (u102) for resolution block too soon (<144 blocks away)', () => {
      const result = simnet.callPublicFn(
        'market-factory',
        'create-market',
        [
          Cl.stringAscii('Valid question?'),
          Cl.stringAscii('Valid description.'),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 10), // too close
          Cl.bool(false),
          Cl.stringAscii(''),
        ],
        deployer
      )
      expect(result.result).toBeErr(Cl.uint(102))
    })

    it('accepts all 6 valid categories', () => {
      for (let cat = 1; cat <= 6; cat++) {
        const result = simnet.callPublicFn(
          'market-factory',
          'create-market',
          [
            Cl.stringAscii(`Category ${cat} market?`),
            Cl.stringAscii('Description.'),
            Cl.uint(cat),
            Cl.uint(simnet.blockHeight + 500),
            Cl.bool(false),
            Cl.stringAscii(''),
          ],
          deployer
        )
        expect(result.result).toBeOk(Cl.uint(cat))
      }
    })
  })

  // ============================================================
  // pause-market / resume-market
  // ============================================================
  describe('pause-market / resume-market', () => {
    beforeEach(() => {
      createValidMarket()
    })

    it('admin can pause an active market', () => {
      const result = simnet.callPublicFn('market-factory', 'pause-market', [Cl.uint(1)], deployer)
      expect(result.result).toBeOk(Cl.bool(true))
      const market = simnet.callReadOnlyFn('market-factory', 'get-market', [Cl.uint(1)], deployer)
      const status = (market.result as any).value.value.data.status
      expect(status).toEqual(Cl.uint(2)) // STATUS-PAUSED
    })

    it('admin can resume a paused market', () => {
      simnet.callPublicFn('market-factory', 'pause-market', [Cl.uint(1)], deployer)
      const result = simnet.callPublicFn('market-factory', 'resume-market', [Cl.uint(1)], deployer)
      expect(result.result).toBeOk(Cl.bool(true))
      const market = simnet.callReadOnlyFn('market-factory', 'get-market', [Cl.uint(1)], deployer)
      const status = (market.result as any).value.value.data.status
      expect(status).toEqual(Cl.uint(1)) // STATUS-ACTIVE
    })

    it('non-admin cannot pause a market', () => {
      const result = simnet.callPublicFn('market-factory', 'pause-market', [Cl.uint(1)], alice)
      expect(result.result).toBeErr(Cl.uint(100)) // ERR-NOT-ADMIN
    })

    it('cannot pause an already-paused market', () => {
      simnet.callPublicFn('market-factory', 'pause-market', [Cl.uint(1)], deployer)
      const result = simnet.callPublicFn('market-factory', 'pause-market', [Cl.uint(1)], deployer)
      expect(result.result).toBeErr(Cl.uint(102)) // ERR-INVALID-PARAMS
    })

    it('returns ERR-NOT-FOUND for non-existent market', () => {
      const result = simnet.callPublicFn('market-factory', 'pause-market', [Cl.uint(999)], deployer)
      expect(result.result).toBeErr(Cl.uint(101)) // ERR-NOT-FOUND
    })
  })

  // ============================================================
  // add-creator / authorized creator flow
  // ============================================================
  describe('authorized creators', () => {
    it('admin can add a creator', () => {
      const result = simnet.callPublicFn('market-factory', 'add-creator', [Cl.principal(alice)], deployer)
      expect(result.result).toBeOk(Cl.bool(true))
      const isCreator = simnet.callReadOnlyFn('market-factory', 'is-authorized-creator', [Cl.principal(alice)], deployer)
      expect(isCreator.result).toBeOk(Cl.bool(true))
    })

    it('authorized creator can create markets', () => {
      simnet.callPublicFn('market-factory', 'add-creator', [Cl.principal(alice)], deployer)
      const result = createValidMarket(alice)
      expect(result.result).toBeOk(Cl.uint(1))
    })

    it('admin can remove a creator', () => {
      simnet.callPublicFn('market-factory', 'add-creator', [Cl.principal(alice)], deployer)
      simnet.callPublicFn('market-factory', 'remove-creator', [Cl.principal(alice)], deployer)
      const result = createValidMarket(alice)
      expect(result.result).toBeErr(Cl.uint(104)) // ERR-UNAUTHORIZED
    })

    it('non-admin cannot add a creator', () => {
      const result = simnet.callPublicFn('market-factory', 'add-creator', [Cl.principal(bob)], alice)
      expect(result.result).toBeErr(Cl.uint(100)) // ERR-NOT-ADMIN
    })
  })

  // ============================================================
  // set-admin
  // ============================================================
  describe('set-admin', () => {
    it('admin can transfer admin role', () => {
      simnet.callPublicFn('market-factory', 'set-admin', [Cl.principal(alice)], deployer)
      const newAdmin = simnet.callReadOnlyFn('market-factory', 'get-admin', [], deployer)
      expect(newAdmin.result).toBeOk(Cl.principal(alice))
    })

    it('new admin can now pause markets; old admin cannot', () => {
      createValidMarket()
      simnet.callPublicFn('market-factory', 'set-admin', [Cl.principal(alice)], deployer)
      const oldAdminResult = simnet.callPublicFn('market-factory', 'pause-market', [Cl.uint(1)], deployer)
      expect(oldAdminResult.result).toBeErr(Cl.uint(100)) // ERR-NOT-ADMIN
      const newAdminResult = simnet.callPublicFn('market-factory', 'pause-market', [Cl.uint(1)], alice)
      expect(newAdminResult.result).toBeOk(Cl.bool(true))
    })
  })

  // ============================================================
  // cancel-market
  // ============================================================
  describe('cancel-market', () => {
    it('admin can cancel an active market', () => {
      createValidMarket()
      const result = simnet.callPublicFn('market-factory', 'cancel-market', [Cl.uint(1)], deployer)
      expect(result.result).toBeOk(Cl.bool(true))
    })

    it('cannot cancel a non-existent market', () => {
      const result = simnet.callPublicFn('market-factory', 'cancel-market', [Cl.uint(99)], deployer)
      expect(result.result).toBeErr(Cl.uint(101)) // ERR-NOT-FOUND
    })
  })
})
