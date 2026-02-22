import { useState } from 'react'
import { openContractCall, ContractCallOptions } from '@stacks/connect'
import { Cl } from '@stacks/transactions'
import { Button } from '../ui/Button.js'
import { useWalletStore } from '../../stores/walletStore.js'
import { useUiStore } from '../../stores/uiStore.js'
import { CONTRACTS, STACKS_NETWORK } from '../../config/stacks.js'
import { queryClient } from '../../lib/queryClient.js'
import { formatSbtc } from '../../lib/formatters.js'
import type { MarketPosition } from '../../lib/types.js'

interface ClaimButtonProps {
  position: MarketPosition
  address: string
}

export function ClaimButton({ position, address }: ClaimButtonProps) {
  const [claiming, setClaiming] = useState(false)
  const { addToast } = useUiStore()

  if (position.claimed || !position.isResolved) return null

  const winningShares = position.outcome
    ? position.yesShares
    : position.noShares

  if (winningShares <= 0) return null

  const handleClaim = async () => {
    setClaiming(true)
    try {
      const [sbtcAddr, sbtcName] = CONTRACTS.sbtc.split('.')

      const options: ContractCallOptions = {
        contractAddress: CONTRACTS.marketAmm.address,
        contractName: CONTRACTS.marketAmm.name,
        functionName: 'claim-winnings',
        functionArgs: [
          Cl.uint(position.marketId),
          Cl.contractPrincipal(sbtcAddr, sbtcName),
        ],
        network: STACKS_NETWORK as 'testnet' | 'mainnet',
        onFinish: (data) => {
          addToast({ type: 'success', message: `Winnings claimed! TX: ${data.txId.slice(0, 12)}...` })
          queryClient.invalidateQueries({ queryKey: ['portfolio', address] })
          setClaiming(false)
        },
        onCancel: () => {
          addToast({ type: 'info', message: 'Claim cancelled' })
          setClaiming(false)
        },
      }
      await openContractCall(options)
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message })
      setClaiming(false)
    }
  }

  return (
    <Button
      onClick={handleClaim}
      loading={claiming}
      size="sm"
      className="whitespace-nowrap"
    >
      Claim Winnings
    </Button>
  )
}
