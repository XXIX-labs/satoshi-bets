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
  const amountSats = Math.floor(amountNum * 1e8)

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
          Cl.uint(0),
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
    <div className="rounded-lg border border-border bg-s0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-display text-sm font-bold text-t1">TRADE</span>
        <span className="font-mono text-[10px] text-t4 tracking-wider">
          CPMM · x·y=k
        </span>
      </div>

      <div className="p-4 space-y-4">
        {market.status === 'resolved' && (
          <div className="rounded-md border border-orange/20 bg-orange/5 px-4 py-3 text-center">
            <span className="font-mono text-xs text-t2">RESOLVED → </span>
            <span className="font-mono text-xs font-bold text-orange">
              {market.outcome ? 'YES' : 'NO'}
            </span>
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
          variant={side === 'YES' ? 'yes' : 'no'}
          className="w-full"
          size="lg"
        >
          {!address
            ? 'CONNECT WALLET'
            : amountSats <= 0
            ? 'ENTER AMOUNT'
            : `BUY ${side}`}
        </Button>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-center gap-3">
        <span className="font-mono text-[9px] text-t4 tracking-wider">2% BUY FEE</span>
        <span className="text-t4/30 text-[9px]">·</span>
        <span className="font-mono text-[9px] text-t4 tracking-wider">1% SELL FEE</span>
        <span className="text-t4/30 text-[9px]">·</span>
        <span className="font-mono text-[9px] text-t4 tracking-wider">1% CLAIM FEE</span>
      </div>
    </div>
  )
}
