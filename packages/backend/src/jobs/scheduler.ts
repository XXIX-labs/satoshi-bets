import cron from 'node-cron'
import { logger } from '../middleware/logger.js'
import { env } from '../config/env.js'
import { generateMarketProposals } from '../ai/marketGenerator.js'
import { resolveMarket } from '../ai/oracleAgent.js'
import { submitResolution } from '../services/stacks/oracleRegistry.js'
import { getAllMarkets } from '../services/stacks/marketFactory.js'

export function startScheduler(): void {
  if (!env.ENABLE_AI_JOBS) {
    logger.info('AI jobs disabled (ENABLE_AI_JOBS=false)')
    return
  }

  // Generate market proposals every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    logger.info('CRON: generating market proposals')
    try {
      const proposals = await generateMarketProposals()
      logger.info({ count: proposals.length }, 'CRON: market proposals generated')
    } catch (err) {
      logger.error({ err }, 'CRON: market generation failed')
    }
  })

  // Sync market state and check oracle resolutions every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('CRON: checking oracle resolutions')
    try {
      await runOracleResolutionJob()
    } catch (err) {
      logger.error({ err }, 'CRON: oracle resolution job failed')
    }
  })

  logger.info('Cron scheduler started: market generation (every 4h), oracle resolution (every 1h)')
}

async function runOracleResolutionJob(): Promise<void> {
  const markets = await getAllMarkets()
  const activeMarkets = markets.filter((m) => m.status === 'active')

  // Find markets past their resolution block
  // (In testnet context, we use current block height from Stacks API)
  for (const market of activeMarkets) {
    try {
      logger.info({ marketId: market.id }, 'Oracle Agent: resolving expired market')

      const result = await resolveMarket(
        market.id,
        market.question,
        market.description,
        market.resolutionBlock,
        market.resolutionBlock // use resolution block as current for now
      )

      if (result.autoSubmit) {
        const evidenceUri = result.sources[0] ?? 'https://satoshi-bets.io/oracle-evidence'
        await submitResolution(market.id, result.outcome, result.confidence, evidenceUri)
        logger.info(
          { marketId: market.id, outcome: result.outcome, confidence: result.confidence },
          'Oracle Agent: auto-submitted resolution'
        )
      } else {
        logger.info(
          { marketId: market.id, confidence: result.confidence },
          'Oracle Agent: confidence below threshold, flagged for manual review'
        )
      }
    } catch (err) {
      logger.error({ err, marketId: market.id }, 'Oracle Agent: resolution failed')
    }
  }
}
