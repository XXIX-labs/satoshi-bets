import { useState } from 'react'
import { openContractCall, ContractCallOptions } from '@stacks/connect'
import { Cl } from '@stacks/transactions'
import { ShareInput } from './ShareInput.js'
import { PriceImpact } from './PriceImpact.js'
import { Button } from '../ui/Button.js'
import { useWalletStore } from '../../stores/walletStore.js'
import { useUiStore } from '../../stores/uiStore.js'
import { CONTRACTS, STACKS_NETWORK } from '../../config/stacks.js'
import { queryClient } from '../../lib/queryClient.js'
import type { Market, MarketPool } from '../../lib/types.js'

interface TradingPanelProps {
  market: Market
  pool: MarketPool | null
}

export function TradingPanel({ market, pool }: TradingPanelProps) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const address = useWalletStore((s) => s.address)
  const { openWalletModal, addToast } = useUiStore()

  const amountNum = parseFloat(amount) || 0
  const amountSats = Math.floor(amountNum * 1e8)  // sBTC has 8 decimals

  // Simple quote calculation using CPMM formula client-side
  const quote = pool && amountSats > 0 ? (() => {
    const fee = Math.floor(amountSats * 200 / 10000)
    const afterFee = amountSats - fee
    const yes = pool.yesPool
    const no = pool.noPool
    const k = pool.kConstant
    if (side === 'YES') {
      const newNo = no + afterFee
      const newYes = Math.floor(k / newNo)
      const sharesOut = yes - newYes
      const newTotal = newYes + newNo
      return { sharesOut: Math.max(0, sharesOut), fee, newYesPrice: Math.floor(newNo * 1e6 / newTotal), priceImpactBps: 0 }
    } else {
      const newYes = yes + afterFee
      const newNo = Math.floor(k / newYes)
      const sharesOut = no - newNo
      const newTotal = newYes + newNo
      return { sharesOut: Math.max(0, sharesOut), fee, newYesPrice: Math.floor(newNo * 1e6 / newTotal), priceImpactBps: 0 }
    }
  })() : null

  const handleTrade = async () => {
    if (!address) { openWalletModal(); return }
    if (!pool || amountSats <= 0) return

    setSubmitting(true)
    try {
      const functionName = side === 'YES' ? 'buy-yes-shares' : 'buy-no-shares'
      const [sbtcAddr, sbtcName] = CONTRACTS.sbtc.split('.')

      const options: ContractCallOptions = {
        contractAddress: CONTRACTS.marketAmm.address,
        contractName: CONTRACTS.marketAmm.name,
        functionName,
        functionArgs: [
          Cl.uint(market.id),
          Cl.uint(amountSats),
          Cl.uint(0), // min-shares-out (no slippage protection in PoC)
          Cl.contractPrincipal(sbtcAddr, sbtcName),
        ],
        network: STACKS_NETWORK as 'testnet' | 'mainnet',
        onFinish: (data) => {
          addToast({ type: 'success', message: `Trade submitted! TX: ${data.txId.slice(0, 12)}...` })
          queryClient.invalidateQueries({ queryKey: ['market', market.id] })
          setAmount('')
          setSubmitting(false)
        },
        onCancel: () => {
          addToast({ type: 'info', message: 'Trade cancelled' })
          setSubmitting(false)
        },
      }
      await openContractCall(options)
    } catch (err) {
      addToast({ type: 'error', message: (err as Error).message })
      setSubmitting(false)
    }
  }

  const isDisabled = market.status !== 'active' || !pool

  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-surface p-5">
      <h3 className="font-semibold text-white">Trade</h3>

      {market.status === 'resolved' && (
        <div className="rounded-xl bg-white/5 p-3 text-center text-sm text-white/60">
          Market resolved: <span className="font-semibold text-orange-400">{market.outcome ? 'YES' : 'NO'}</span>
        </div>
      )}

      <ShareInput
        value={amount}
        onChange={setAmount}
        side={side}
        onSideChange={setSide}
        disabled={isDisabled}
      />

      {quote && <PriceImpact quote={quote} loading={false} side={side} />}

      <Button
        onClick={handleTrade}
        loading={submitting}
        disabled={isDisabled || amountSats <= 0}
        className="w-full"
        size="lg"
      >
        {!address ? 'Connect Wallet to Trade'
          : amountSats <= 0 ? 'Enter an amount'
          : `Buy ${side}`}
      </Button>

      <p className="text-center text-xs text-white/30">
        2% buy fee · 1% sell fee · Powered by CPMM AMM
      </p>
    </div>
  )
}
