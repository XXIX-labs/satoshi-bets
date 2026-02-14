import { describe, it, expect } from 'vitest'
import { Cl } from '@stacks/transactions'
import { initSimnet } from '@hirosystems/clarinet-sdk'

/**
 * Full Market Lifecycle Integration Test
 *
 * Tests the complete flow:
 * create-market → initialize-pool → buy YES → buy NO →
 * register-oracle → submit-resolution → [dispute window] →
 * finalize-resolution → claim-winnings (winner) → claim fails (loser)
 */
describe('Full Market Lifecycle', () => {
  it('completes the full lifecycle: create → trade → oracle → claim', async () => {
    const simnet = await initSimnet()
    const accounts = simnet.getAccounts()
    const deployer = accounts.get('deployer')!
    const alice = accounts.get('wallet_1')!   // bets YES
    const bob = accounts.get('wallet_2')!     // bets NO
    const charlie = accounts.get('wallet_3')! // observer / potential disputer

    const SBTC = Cl.contractPrincipal(deployer, 'sbtc-token')
    const MARKET_ID = 1

    // ------------------------------------------------------------------
    // Step 1: Create a market
    // ------------------------------------------------------------------
    const createResult = simnet.callPublicFn(
      'market-factory', 'create-market',
      [
        Cl.stringAscii('Will BTC exceed $150,000 by June 30, 2026?'),
        Cl.stringAscii('Resolves YES if BTC/USD price on Pyth exceeds $150,000 before resolution block.'),
        Cl.uint(1), // CATEGORY-CRYPTO
        Cl.uint(simnet.blockHeight + 500),
        Cl.bool(false),
        Cl.stringAscii('ipfs://market-metadata/1'),
      ],
      deployer
    )
    expect(createResult.result).toBeOk(Cl.uint(1))
    console.log('✅ Market created with ID 1')

    // ------------------------------------------------------------------
    // Step 2: Initialize the AMM pool (admin seeds 0.2 sBTC total)
    // ------------------------------------------------------------------
    const initPoolResult = simnet.callPublicFn(
      'market-amm', 'initialize-pool',
      [Cl.uint(MARKET_ID), Cl.uint(10_000_000), Cl.uint(10_000_000), SBTC],
      deployer
    )
    expect(initPoolResult.result).toBeOk(Cl.bool(true))
    console.log('✅ AMM pool initialized: 0.1 YES / 0.1 NO — price = 50%')

    // Verify initial 50/50 price
    const yesPrice = simnet.callReadOnlyFn('market-amm', 'get-yes-price', [Cl.uint(MARKET_ID)], deployer)
    expect(yesPrice.result).toBeOk(Cl.uint(500_000)) // 50%
    console.log('✅ Initial YES price: 50%')

    // ------------------------------------------------------------------
    // Step 3: Alice buys YES shares (0.05 sBTC)
    // ------------------------------------------------------------------
    const aliceBuyYes = simnet.callPublicFn(
      'market-amm', 'buy-yes-shares',
      [Cl.uint(MARKET_ID), Cl.uint(5_000_000), Cl.uint(0), SBTC],
      alice
    )
    expect(aliceBuyYes.result).toBeOk()
    const aliceYesShares = Number((aliceBuyYes.result as any).value.data['shares-out'].value)
    console.log(`✅ Alice bought ${aliceYesShares} YES shares for 0.05 sBTC`)

    // YES price should have risen
    const yesPriceAfterAlice = simnet.callReadOnlyFn('market-amm', 'get-yes-price', [Cl.uint(MARKET_ID)], deployer)
    const yesPriceNum = Number((yesPriceAfterAlice.result as any).value.value)
    expect(yesPriceNum).toBeGreaterThan(500_000) // above 50%
    console.log(`✅ YES price after Alice: ${(yesPriceNum / 1_000_000 * 100).toFixed(1)}%`)

    // ------------------------------------------------------------------
    // Step 4: Bob buys NO shares (0.03 sBTC)
    // ------------------------------------------------------------------
    const bobBuyNo = simnet.callPublicFn(
      'market-amm', 'buy-no-shares',
      [Cl.uint(MARKET_ID), Cl.uint(3_000_000), Cl.uint(0), SBTC],
      bob
    )
    expect(bobBuyNo.result).toBeOk()
    const bobNoShares = Number((bobBuyNo.result as any).value.data['shares-out'].value)
    console.log(`✅ Bob bought ${bobNoShares} NO shares for 0.03 sBTC`)

    // ------------------------------------------------------------------
    // Step 5: Register oracle (deployer as AI oracle)
    // ------------------------------------------------------------------
    const registerOracle = simnet.callPublicFn(
      'oracle-registry', 'register-oracle',
      [Cl.principal(deployer), Cl.uint(2), Cl.stringAscii('Satoshi Bets AI Oracle')],
      deployer
    )
    expect(registerOracle.result).toBeOk(Cl.bool(true))
    console.log('✅ Oracle registered')

    // ------------------------------------------------------------------
    // Step 6: Oracle submits resolution (YES, 97% confidence)
    // ------------------------------------------------------------------
    const submitRes = simnet.callPublicFn(
      'oracle-registry', 'submit-resolution',
      [
        Cl.uint(MARKET_ID),
        Cl.bool(true), // YES outcome
        Cl.uint(9700), // 97% confidence
        Cl.stringAscii('https://pyth.network/price/BTC-USD/history'),
        Cl.none(),
      ],
      deployer
    )
    expect(submitRes.result).toBeOk(Cl.bool(true))
    console.log('✅ Oracle submitted YES resolution with 97% confidence')

    // Verify dispute window is active
    const inWindow = simnet.callReadOnlyFn(
      'oracle-registry', 'is-in-dispute-window', [Cl.uint(MARKET_ID)], deployer
    )
    expect(inWindow.result).toBeOk(Cl.bool(true))
    console.log('✅ Dispute window active (144 blocks)')

    // ------------------------------------------------------------------
    // Step 7: Advance 145 blocks past the dispute window
    // ------------------------------------------------------------------
    simnet.mineEmptyBurnBlocks(145)
    const afterWindow = simnet.callReadOnlyFn(
      'oracle-registry', 'is-in-dispute-window', [Cl.uint(MARKET_ID)], deployer
    )
    expect(afterWindow.result).toBeOk(Cl.bool(false))
    console.log('✅ Dispute window closed')

    // ------------------------------------------------------------------
    // Step 8: Finalize resolution → triggers AMM resolve
    // ------------------------------------------------------------------
    const finalize = simnet.callPublicFn(
      'oracle-registry', 'finalize-resolution',
      [Cl.uint(MARKET_ID), SBTC],
      deployer
    )
    expect(finalize.result).toBeOk(Cl.bool(true))
    console.log('✅ Resolution finalized — AMM marked as resolved YES')

    // Verify pool is marked resolved
    const pool = simnet.callReadOnlyFn('market-amm', 'get-pool', [Cl.uint(MARKET_ID)], deployer)
    const poolData = (pool.result as any).value.value.data
    expect(poolData.resolved).toEqual(Cl.bool(true))
    expect(poolData.outcome).toEqual(Cl.some(Cl.bool(true)))

    // ------------------------------------------------------------------
    // Step 9: Alice (YES winner) claims winnings
    // ------------------------------------------------------------------
    const aliceClaim = simnet.callPublicFn(
      'market-amm', 'claim-winnings',
      [Cl.uint(MARKET_ID), SBTC],
      alice
    )
    expect(aliceClaim.result).toBeOk()
    const aliceWinnings = Number((aliceClaim.result as any).value.data.winnings.value)
    expect(aliceWinnings).toBeGreaterThan(0)
    console.log(`✅ Alice claimed ${aliceWinnings} sBTC in winnings`)

    // ------------------------------------------------------------------
    // Step 10: Alice cannot claim twice
    // ------------------------------------------------------------------
    const aliceClaimAgain = simnet.callPublicFn(
      'market-amm', 'claim-winnings',
      [Cl.uint(MARKET_ID), SBTC],
      alice
    )
    expect(aliceClaimAgain.result).toBeErr(Cl.uint(107)) // ERR-ALREADY-CLAIMED
    console.log('✅ Double-claim correctly rejected')

    // ------------------------------------------------------------------
    // Step 11: Bob (NO loser) cannot claim
    // ------------------------------------------------------------------
    const bobClaim = simnet.callPublicFn(
      'market-amm', 'claim-winnings',
      [Cl.uint(MARKET_ID), SBTC],
      bob
    )
    expect(bobClaim.result).toBeErr(Cl.uint(108)) // ERR-WRONG-OUTCOME
    console.log('✅ Loser claim correctly rejected')

    console.log('\n🎉 Full lifecycle test PASSED')
  })

  it('dispute flow: oracle submitted → user disputes → admin overrides → resolves', async () => {
    const simnet = await initSimnet()
    const accounts = simnet.getAccounts()
    const deployer = accounts.get('deployer')!
    const alice = accounts.get('wallet_1')!  // disputer
    const bob = accounts.get('wallet_2')!    // bets NO

    const SBTC = Cl.contractPrincipal(deployer, 'sbtc-token')
    const MARKET_ID = 1

    // Create market + pool + oracle registration
    simnet.callPublicFn('market-factory', 'create-market', [
      Cl.stringAscii('Will ETH flippening happen in 2026?'),
      Cl.stringAscii('Resolves YES if ETH market cap exceeds BTC market cap.'),
      Cl.uint(5),
      Cl.uint(simnet.blockHeight + 500),
      Cl.bool(true),
      Cl.stringAscii(''),
    ], deployer)

    simnet.callPublicFn('market-amm', 'initialize-pool', [
      Cl.uint(MARKET_ID), Cl.uint(10_000_000), Cl.uint(10_000_000), SBTC
    ], deployer)

    simnet.callPublicFn('market-amm', 'buy-no-shares', [
      Cl.uint(MARKET_ID), Cl.uint(2_000_000), Cl.uint(0), SBTC
    ], bob)

    simnet.callPublicFn('oracle-registry', 'register-oracle', [
      Cl.principal(deployer), Cl.uint(2), Cl.stringAscii('AI Oracle')
    ], deployer)

    // Oracle submits INCORRECT resolution (YES) with only 80% confidence
    simnet.callPublicFn('oracle-registry', 'submit-resolution', [
      Cl.uint(MARKET_ID),
      Cl.bool(true), // wrong outcome
      Cl.uint(8000), // 80% confidence
      Cl.stringAscii('https://evidence.com/1'),
      Cl.none(),
    ], deployer)

    // Alice disputes
    const disputeResult = simnet.callPublicFn(
      'oracle-registry', 'dispute-resolution',
      [Cl.uint(MARKET_ID), SBTC, Cl.uint(1_000_000)],
      alice
    )
    expect(disputeResult.result).toBeOk(Cl.bool(true))

    // Admin overrides to NO (correct outcome)
    const override = simnet.callPublicFn(
      'oracle-registry', 'override-resolution',
      [Cl.uint(MARKET_ID), Cl.bool(false)], // NO wins
      deployer
    )
    expect(override.result).toBeOk(Cl.bool(true))

    // Pool should now be resolved as NO
    const pool = simnet.callReadOnlyFn('market-amm', 'get-pool', [Cl.uint(MARKET_ID)], deployer)
    const outcome = (pool.result as any).value.value.data.outcome
    expect(outcome).toEqual(Cl.some(Cl.bool(false))) // NO outcome

    // Bob (NO bettor) can now claim winnings
    const bobClaim = simnet.callPublicFn(
      'market-amm', 'claim-winnings',
      [Cl.uint(MARKET_ID), SBTC],
      bob
    )
    expect(bobClaim.result).toBeOk()
    const bobWinnings = Number((bobClaim.result as any).value.data.winnings.value)
    expect(bobWinnings).toBeGreaterThan(0)
    console.log(`✅ Dispute flow: Bob (NO winner) claimed ${bobWinnings} sBTC after admin override`)
  })
})
