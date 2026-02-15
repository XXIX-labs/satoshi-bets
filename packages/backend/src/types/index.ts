// ============================================================
// Shared TypeScript types for Satoshi Bets backend
// ============================================================

export interface Market {
  id: number
  question: string
  description: string
  category: MarketCategory
  creator: string
  createdAt: number // block height
  resolutionBlock: number
  status: MarketStatus
  outcome?: boolean
  aiGenerated: boolean
  metadataUri: string
}

export type MarketStatus = 'active' | 'paused' | 'resolved' | 'cancelled'
export type MarketCategory = 'crypto' | 'stacks' | 'macro' | 'regulation' | 'tech' | 'global'

export interface MarketPool {
  marketId: number
  yesPool: number
  noPool: number
  kConstant: number
  totalVolume: number
  totalFees: number
  resolved: boolean
  outcome?: boolean
  sbtcContract: string
}

export interface MarketPosition {
  marketId: number
  trader: string
  yesShares: number
  noShares: number
  costBasis: number
  claimed: boolean
}

export interface OracleResolution {
  marketId: number
  oracle: string
  outcome: boolean
  confidence: number // 0-10000 bps
  evidenceUri: string
  submittedAt: number
  status: ResolutionStatus
  disputeDeadline: number
  disputer?: string
  disputeStake: number
}

export type ResolutionStatus = 'pending' | 'disputed' | 'finalized' | 'overridden'

export interface AiMarketProposal {
  id: string
  question: string
  description: string
  category: MarketCategory
  resolutionCriteria: string
  oracleType: 'pyth' | 'ai' | 'manual'
  endDate: string
  initialProbability: number // 0-100
  confidence: number
  sources: string[]
  generatedAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export interface AiResearchBrief {
  marketId: number
  question: string
  yesArguments: ResearchArgument[]
  noArguments: ResearchArgument[]
  sources: string[]
  sentiment: 'bullish' | 'bearish' | 'neutral'
  confidenceScore: number
  generatedAt: string
  cachedUntil: string
}

export interface ResearchArgument {
  title: string
  body: string
  sourceUrl?: string
  weight: number // 1-5 strength
}

export interface PythPrice {
  price: number
  confidence: number
  publishTime: number
  feedId: string
}

export interface PriceHistoryPoint {
  timestamp: number
  blockHeight: number
  yesPrice: number // 0-1,000,000
  noPrice: number
  volume: number
}

export interface PortfolioSummary {
  address: string
  positions: PositionWithMarket[]
  totalInvested: number
  unrealizedPnl: number
  claimableWinnings: number
}

export interface PositionWithMarket extends MarketPosition {
  market: Market
  pool?: MarketPool
  currentValue?: number
  unrealizedPnl?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}
