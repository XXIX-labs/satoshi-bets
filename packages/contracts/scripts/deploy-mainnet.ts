/**
 * Mainnet deployment script for Satoshi Bets contracts
 * Deploys: sip010-ft-trait, market-factory, oracle-registry, market-amm
 *
 * Usage:
 *   npx tsx scripts/deploy-mainnet.ts
 *
 * Required env vars (from root .env):
 *   Private_Key  - deployer private key (hex, with or without 01 suffix)
 *   Address      - deployer STX address (SP...)
 */

import {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  ClarityVersion,
} from '@stacks/transactions'
import { STACKS_MAINNET } from '@stacks/network'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Load env from repo root
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../../../.env') })

const PRIVATE_KEY = process.env.Private_Key?.trim()
const ADDRESS = process.env.Address?.trim()

if (!PRIVATE_KEY || !ADDRESS) {
  console.error('Missing Private_Key or Address in .env')
  process.exit(1)
}

const network = STACKS_MAINNET
const contractsDir = join(__dirname, '../contracts')

// Deploy order matters: trait first, then factory, then oracle, then AMM
const CONTRACTS = [
  { name: 'sip010-ft-trait', file: 'sip010-ft-trait.clar', clarityVersion: 2 as const },
  { name: 'market-factory', file: 'market-factory.clar', clarityVersion: 3 as const },
  { name: 'oracle-registry', file: 'oracle-registry.clar', clarityVersion: 3 as const },
  { name: 'market-amm', file: 'market-amm.clar', clarityVersion: 3 as const },
]

async function deployContract(
  name: string,
  source: string,
  clarityVersion: 2 | 3,
  nonce: number
) {
  console.log(`\nDeploying ${name} (Clarity v${clarityVersion})...`)
  console.log(`  Deployer: ${ADDRESS}`)
  console.log(`  Contract: ${ADDRESS}.${name}`)

  const txOptions = {
    contractName: name,
    codeBody: source,
    senderKey: PRIVATE_KEY!,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    clarityVersion: clarityVersion === 3 ? ClarityVersion.Clarity3 : ClarityVersion.Clarity2,
    nonce: BigInt(nonce),
    fee: BigInt(200000), // 0.2 STX fee — adjust if needed
  }

  const transaction = await makeContractDeploy(txOptions)
  console.log(`  TX ID: 0x${transaction.txid()}`)

  const result = await broadcastTransaction({ transaction, network })

  if ('error' in result) {
    console.error(`  FAILED: ${result.error}`)
    if ('reason' in result) console.error(`  Reason: ${result.reason}`)
    return null
  }

  console.log(`  Broadcast OK: 0x${result.txid}`)
  console.log(`  Explorer: https://explorer.hiro.so/txid/0x${result.txid}?chain=mainnet`)
  return result.txid
}

async function getNonce(): Promise<number> {
  const res = await fetch(
    `https://api.hiro.so/extended/v1/address/${ADDRESS}/nonces`
  )
  const data = await res.json()
  return data.possible_next_nonce
}

async function main() {
  console.log('=== Satoshi Bets Mainnet Deployment ===')
  console.log(`Deployer: ${ADDRESS}`)
  console.log(`Network:  Stacks Mainnet`)
  console.log('')

  // Check balance
  const balRes = await fetch(
    `https://api.hiro.so/extended/v1/address/${ADDRESS}/stx`
  )
  const balData = await balRes.json()
  const balSTX = parseInt(balData.balance) / 1_000_000
  console.log(`STX Balance: ${balSTX.toFixed(2)} STX`)

  if (balSTX < 1) {
    console.error('Insufficient STX for deployment. Need at least 1 STX for fees.')
    process.exit(1)
  }

  let nonce = await getNonce()
  console.log(`Starting nonce: ${nonce}`)

  const results: { name: string; txid: string | null }[] = []

  for (const contract of CONTRACTS) {
    const source = readFileSync(join(contractsDir, contract.file), 'utf-8')
    const txid = await deployContract(contract.name, source, contract.clarityVersion, nonce)
    results.push({ name: contract.name, txid })

    if (!txid) {
      console.error(`\nDeployment halted at ${contract.name}. Fix the error and retry.`)
      break
    }

    nonce++

    // Wait between deployments to avoid mempool issues
    if (contract !== CONTRACTS[CONTRACTS.length - 1]) {
      console.log('  Waiting 5s before next deployment...')
      await new Promise((r) => setTimeout(r, 5000))
    }
  }

  console.log('\n=== Deployment Summary ===')
  for (const r of results) {
    const status = r.txid ? `OK (0x${r.txid})` : 'FAILED'
    console.log(`  ${r.name}: ${status}`)
  }

  if (results.every((r) => r.txid)) {
    console.log('\nAll contracts deployed! Update your .env with:')
    console.log(`  MARKET_FACTORY_ADDRESS=${ADDRESS}.market-factory`)
    console.log(`  MARKET_AMM_ADDRESS=${ADDRESS}.market-amm`)
    console.log(`  ORACLE_REGISTRY_ADDRESS=${ADDRESS}.oracle-registry`)
    console.log(`\nMonitor at: https://explorer.hiro.so/address/${ADDRESS}?chain=mainnet`)
  }
}

main().catch((err) => {
  console.error('Deployment failed:', err)
  process.exit(1)
})
