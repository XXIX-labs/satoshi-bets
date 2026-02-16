import { Cl } from '@stacks/transactions'
import { readContract, callContract } from './contractClient.js'
import { CONTRACTS } from '../../config/stacks.js'
import type { OracleResolution, ResolutionStatus } from '../../types/index.js'

const { address, name } = CONTRACTS.oracleRegistry

function mapResolutionStatus(status: number): ResolutionStatus {
  switch (status) {
    case 1: return 'pending'
    case 2: return 'disputed'
    case 3: return 'finalized'
    case 4: return 'overridden'
    default: return 'pending'
  }
}

export async function getResolution(marketId: number): Promise<OracleResolution | null> {
  const result = await readContract(address, name, 'get-resolution', [Cl.uint(marketId)]) as { value: unknown }
  if (!result.value) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = (result.value as any).value
  return {
    marketId,
    oracle: d.oracle.value,
    outcome: d.outcome.value,
    confidence: Number(d.confidence.value),
    evidenceUri: d['evidence-uri'].value,
    submittedAt: Number(d['submitted-at'].value),
    status: mapResolutionStatus(Number(d.status.value)),
    disputeDeadline: Number(d['dispute-deadline'].value),
    disputer: d.disputer.value?.value,
    disputeStake: Number(d['dispute-stake'].value),
  }
}

export async function submitResolution(
  marketId: number,
  outcome: boolean,
  confidence: number,
  evidenceUri: string
): Promise<string> {
  return callContract(address, name, 'submit-resolution', [
    Cl.uint(marketId),
    Cl.bool(outcome),
    Cl.uint(confidence),
    Cl.stringAscii(evidenceUri.slice(0, 256)),
    Cl.none(),
  ])
}

export async function finalizeResolution(marketId: number): Promise<string> {
  const { address: sbtcAddr, name: sbtcName } = CONTRACTS.sbtc
  return callContract(address, name, 'finalize-resolution', [
    Cl.uint(marketId),
    Cl.contractPrincipal(sbtcAddr, sbtcName),
  ])
}

export async function isOracle(principal: string): Promise<boolean> {
  const result = await readContract(address, name, 'is-oracle', [Cl.principal(principal)]) as { value: boolean }
  return result.value
}
