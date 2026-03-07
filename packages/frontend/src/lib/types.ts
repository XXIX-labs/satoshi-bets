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
  question: string
  trader: string
  yesShares: number
  noShares: number
  costBasis: number
  currentValue: number
  claimed: boolean
  isResolved: boolean
  outcome?: boolean
}

export interface PythPrice {
  price: number
  confidence: number
  publishTime: number
  feedId: string
}

export interface AiResearchBrief {
  marketId: number
  question: string
  bullishCase: string
  bearishCase: string
  keyFactors: string[]
  summary: string
  probabilityEstimate: number
  sources: string[]
  generatedAt: string
  cachedUntil: string
}

export interface AiMarketProposal {
  id: string
  question: string
  description: string
  category: number
  confidence: number
  initialProbability: number
  oracleType: string
  resolutionCriteria: string
}

export interface PortfolioSummary {
  totalCostBasis: number
  totalCurrentValue: number
  claimableAmount: number
  openPositions: number
  resolvedPositions: number
}

export interface PortfolioData {
  address: string
  positions: MarketPosition[]
  summary: PortfolioSummary
}
