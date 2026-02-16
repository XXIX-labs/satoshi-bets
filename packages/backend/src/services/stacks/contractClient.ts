import {
  callReadOnlyFunction,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  cvToJSON,
  type ClarityValue,
} from '@stacks/transactions'
import { generateNewAccount, generateWallet } from '@stacks/wallet-sdk'
import { getStacksNetwork } from '../../config/stacks.js'
import { env } from '../../config/env.js'
import { logger } from '../../middleware/logger.js'

export async function readContract(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[]
): Promise<unknown> {
  const network = getStacksNetwork()
  const result = await callReadOnlyFunction({
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    network,
    senderAddress: contractAddress,
  })
  return cvToJSON(result)
}

export async function callContract(
  contractAddress: string,
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[],
  mnemonic = env.DEPLOYER_MNEMONIC
): Promise<string> {
  const network = getStacksNetwork()
  const wallet = await generateWallet({ secretKey: mnemonic, password: '' })
  const account = wallet.accounts[0]

  const txOptions = {
    contractAddress,
    contractName,
    functionName,
    functionArgs,
    senderKey: account.stxPrivateKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
  }

  const tx = await makeContractCall(txOptions)
  const result = await broadcastTransaction({ transaction: tx, network })

  if ('error' in result) {
    logger.error({ error: result }, `Contract call failed: ${functionName}`)
    throw new Error(`Broadcast error: ${result.error}`)
  }

  logger.info({ txid: result.txid, functionName }, 'Contract call broadcasted')
  return result.txid
}
