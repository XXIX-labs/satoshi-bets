# Satoshi Bets

**AI-native binary prediction markets on Bitcoin via Stacks L2**

Trade YES/NO on real-world outcomes using sBTC. Markets are autonomously generated, seeded, and resolved by Claude AI. All trades settle with Bitcoin finality through Stacks Nakamoto.

---

## Architecture

```
satoshi-bets/
├── packages/
│   ├── contracts/    # Clarity smart contracts (Clarinet)
│   ├── backend/      # Node.js + TypeScript API + AI modules
│   └── frontend/     # React 18 + Vite + Stacks.js
├── .env.example
└── turbo.json
```

### Smart Contracts (Clarity 3)

| Contract | Purpose |
|----------|---------|
| `market-factory.clar` | Creates and manages binary YES/NO markets |
| `market-amm.clar` | CPMM AMM for share trading (x·y=k, 2% buy / 1% sell fee) |
| `oracle-registry.clar` | Oracle auth, dispute window (144 blocks), finalization |

### AI Modules (Claude claude-sonnet-4-6)

| Module | Schedule | Description |
|--------|----------|-------------|
| Market Generator | Every 4h | Generates 3 market proposals from CoinGecko + NewsAPI signals |
| Research Assistant | On-demand | YES/NO analysis brief, 15min cache |
| Oracle Agent | Every 1h | Evaluates expired markets, auto-submits at ≥95% confidence |
| Market Maker | On market creation | Seeds 0.1 sBTC initial liquidity per pool |

---

## Quick Start

### Prerequisites

- Node.js 22+
- pnpm 9+
- [Clarinet](https://github.com/hirosystems/clarinet) (for contract dev)
- Redis (local or Railway)

### 1. Clone & Install

```bash
git clone https://github.com/xxix-labs/satoshi-bets
cd satoshi-bets
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example packages/backend/.env
cp .env.example packages/frontend/.env
# Edit both .env files with your keys
```

Required keys:
- `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com)
- `NEWS_API_KEY` — from [newsapi.org](https://newsapi.org)
- `DEPLOYER_MNEMONIC` — Stacks testnet wallet mnemonic
- `ADMIN_API_KEY` — 32+ char random string for admin endpoints

### 3. Run Locally

```bash
# Start all services in parallel
pnpm dev
```

Or individually:

```bash
# Backend (port 3001)
cd packages/backend && pnpm dev

# Frontend (port 5173)
cd packages/frontend && pnpm dev
```

### 4. Contract Development

```bash
cd packages/contracts

# Check contracts
clarinet check

# Run tests
pnpm test

# Start devnet (local Stacks blockchain)
clarinet devnet start
```

---

## Deployment

### Contracts (Stacks Testnet)

```bash
cd packages/contracts

# Generate deployment plan
clarinet deployments generate --testnet

# Apply (deploys in order: market-factory → oracle-registry → market-amm)
clarinet deployments apply --testnet
```

After deploying, update the contract addresses in both `.env` files.

### Backend (Railway)

1. Create a new Railway project
2. Link your GitHub repo, set root directory to `packages/backend`
3. Add Redis plugin
4. Set all environment variables from `.env.example`
5. Deploy — Railway uses the included `Dockerfile`

Healthcheck: `GET /api/v1/health`

### Frontend (Vercel)

1. Import repo to Vercel
2. Set root directory: `packages/frontend`
3. Build command: `pnpm build`
4. Set all `VITE_*` environment variables

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Service health + Redis/Stacks status |
| GET | `/api/v1/markets` | List markets (`?category=1&status=active&sort=volume`) |
| GET | `/api/v1/markets/:id` | Market detail + AMM pool state |
| GET | `/api/v1/markets/:id/price-history` | YES probability over time |
| POST | `/api/v1/research` | AI research brief (`{ marketId }`) |
| GET | `/api/v1/portfolio/:address` | Positions + P&L for address |
| GET | `/api/v1/price/btc` | Live BTC/USD from Pyth (10s cache) |
| GET | `/api/v1/oracle/:marketId` | Oracle resolution status |
| POST | `/api/v1/admin/generate-markets` | Trigger AI market generation |
| GET | `/api/v1/admin/pending-markets` | AI proposals awaiting approval |
| POST | `/api/v1/admin/approve-market` | Approve + deploy market on-chain |
| GET | `/api/v1/admin/oracle-queue` | Markets pending oracle resolution |

Admin endpoints require `X-API-Key: <ADMIN_API_KEY>` header.

---

## Environment Variables

See [`.env.example`](.env.example) for the complete list with documentation.

---

## Tech Stack

**Contracts:** Clarity 3, Clarinet 3.5, `@hirosystems/clarinet-sdk`, Vitest

**Backend:** Node.js 22, TypeScript 5.7, Express 4, Zod, Pino, ioredis, node-cron, `@anthropic-ai/sdk`, `@stacks/transactions`

**Frontend:** React 18, Vite 5, TypeScript 5.7, TailwindCSS 3, `@stacks/connect`, TanStack Query v5, Zustand v5, Recharts 2

**Infrastructure:** Railway (backend), Vercel (frontend), Stacks testnet (contracts), Pyth Hermes (oracle)

---

## License

MIT — XXIX Labs 2026
