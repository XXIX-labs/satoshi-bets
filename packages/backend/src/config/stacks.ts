import { StacksTestnet, StacksMainnet, StacksDevnet } from '@stacks/network'
import { env } from './env.js'

export function getStacksNetwork() {
  switch (env.STACKS_NETWORK) {
    case 'mainnet':
      return new StacksMainnet()
    case 'devnet':
      return new StacksDevnet()
    default:
      return new StacksTestnet()
  }
}

export function parseContractAddress(fullAddress: string): { address: string; name: string } {
  const [address, name] = fullAddress.split('.')
  if (!address || !name) {
    throw new Error(`Invalid contract address format: ${fullAddress}`)
  }
  return { address, name }
}

export const CONTRACTS = {
  marketFactory: parseContractAddress(env.MARKET_FACTORY_ADDRESS),
  marketAmm: parseContractAddress(env.MARKET_AMM_ADDRESS),
  oracleRegistry: parseContractAddress(env.ORACLE_REGISTRY_ADDRESS),
  sbtc: parseContractAddress(env.SBTC_CONTRACT_ADDRESS),
}
