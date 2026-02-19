// Frontend-side type aliases mirroring backend types
export type MarketStatus = 'active' | 'paused' | 'resolved' | 'cancelled'
export type MarketCategory = 'crypto' | 'stacks' | 'macro' | 'regulation' | 'tech' | 'global'

export interface Market {
  id: number
  question: string
  description: string
  category: MarketCategory
  creator: string
  createdAt: number
  resolutionBlock: number
  status: MarketStatus
  outcome?: boolean
  aiGenerated: boolean
  metadataUri: string
}

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

export interface PythPrice {
  price: number
  confidence: number
  publishTime: number
  feedId: string
}

export interface ResearchArgument {
  title: string
  body: string
  sourceUrl?: string
  weight: number
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
