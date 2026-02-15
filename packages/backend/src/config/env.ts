import { z } from 'zod'

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Stacks network
  STACKS_NETWORK: z.enum(['testnet', 'mainnet', 'devnet']).default('testnet'),
  STACKS_API_URL: z.string().default('https://api.testnet.hiro.so'),
  DEPLOYER_MNEMONIC: z.string().min(1),
  DEPLOYER_ADDRESS: z.string().optional(),

  // Deployed contract addresses (format: ST1XXX.contract-name)
  MARKET_FACTORY_ADDRESS: z.string().min(1),
  MARKET_AMM_ADDRESS: z.string().min(1),
  ORACLE_REGISTRY_ADDRESS: z.string().min(1),
  SBTC_CONTRACT_ADDRESS: z.string().default('ST000000000000000000002AMW42H.sbtc-token'),

  // AI (Anthropic)
  ANTHROPIC_API_KEY: z.string().min(1),

  // External APIs
  COINGECKO_API_KEY: z.string().optional(),
  NEWS_API_KEY: z.string().default(''),
  TWITTER_BEARER_TOKEN: z.string().optional(),

  // Pyth Network
  PYTH_HERMES_URL: z.string().default('https://hermes.pyth.network'),
  PYTH_BTC_USD_FEED_ID: z.string().default(
    '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
  ),
  USE_MOCK_PYTH: z.coerce.boolean().default(false),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Admin
  ADMIN_API_KEY: z.string().min(16),

  // Market Maker
  MARKET_MAKER_MNEMONIC: z.string().optional(),
  MARKET_MAKER_SEED_AMOUNT: z.coerce.number().default(10_000_000), // 0.1 sBTC

  // Feature flags
  ENABLE_AI_JOBS: z.coerce.boolean().default(true),
})

function parseEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error('❌ Invalid environment variables:')
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`)
    })
    process.exit(1)
  }
  return result.data
}

export const env = parseEnv()
export type Env = z.infer<typeof envSchema>
