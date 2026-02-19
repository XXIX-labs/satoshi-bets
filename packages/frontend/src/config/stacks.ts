// Contract addresses and network config — injected at build time via VITE_ vars
export const STACKS_NETWORK = import.meta.env.VITE_STACKS_NETWORK ?? 'testnet'
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1'

export const CONTRACTS = {
  marketFactory: {
    address: import.meta.env.VITE_MARKET_FACTORY_ADDRESS ?? '',
    name: import.meta.env.VITE_MARKET_FACTORY_NAME ?? 'market-factory',
  },
  marketAmm: {
    address: import.meta.env.VITE_MARKET_AMM_ADDRESS ?? '',
    name: import.meta.env.VITE_MARKET_AMM_NAME ?? 'market-amm',
  },
  oracleRegistry: {
    address: import.meta.env.VITE_ORACLE_REGISTRY_ADDRESS ?? '',
    name: import.meta.env.VITE_ORACLE_REGISTRY_NAME ?? 'oracle-registry',
  },
  sbtc: import.meta.env.VITE_SBTC_CONTRACT ?? 'ST000000000000000000002AMW42H.sbtc-token',
} as const

export const APP_DETAILS = {
  name: 'Satoshi Bets',
  icon: `${typeof window !== 'undefined' ? window.location.origin : ''}/favicon.svg`,
} as const
