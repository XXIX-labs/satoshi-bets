# Mainnet Deployment Guide

## Pre-deployment Checklist

- [ ] Security audit completed and all CRITICAL/HIGH findings addressed
- [ ] All contract tests passing (`cd packages/contracts && pnpm test`)
- [ ] Backend builds cleanly (`cd packages/backend && pnpm build`)
- [ ] Frontend builds cleanly (`cd packages/frontend && pnpm build`)
- [ ] Deployer wallet funded with sufficient STX for contract deployment (~10 STX)
- [ ] sBTC mainnet contract address verified and configured
- [ ] Pyth mainnet feed IDs verified
- [ ] Admin API key generated (32+ random chars)
- [ ] Redis production instance provisioned
- [ ] Domain DNS configured

---

## 1. Smart Contract Deployment

### Order (critical — contracts have dependencies):
1. `sip010-ft-trait` (SIP-010 trait reference)
2. `market-factory` (standalone)
3. `oracle-registry` (calls `market-amm.resolve`)
4. `market-amm` (calls `oracle-registry`, `market-factory`)

### Deploy Steps

```bash
cd packages/contracts

# Set deployer mnemonic (DO NOT paste in terminal history)
export DEPLOYER_MNEMONIC="your twelve word mnemonic phrase here"

# Generate mainnet deployment plan
clarinet deployments generate --mainnet

# Review the generated plan in deployments/default.mainnet-plan.yaml
# Verify contract order and settings

# Deploy (will prompt for confirmation)
clarinet deployments apply --mainnet
```

### Post-Deploy
After deployment, note the deployer address (this becomes the contract address prefix). Update all environment variables:

```bash
# Example: if deployer is SP1234567890ABCDEF
MARKET_FACTORY_ADDRESS=SP1234567890ABCDEF
MARKET_FACTORY_NAME=market-factory
MARKET_AMM_ADDRESS=SP1234567890ABCDEF
MARKET_AMM_NAME=market-amm
ORACLE_REGISTRY_ADDRESS=SP1234567890ABCDEF
ORACLE_REGISTRY_NAME=oracle-registry
```

---

## 2. Backend Deployment (Railway)

### Environment Variables

```bash
# Network
STACKS_NETWORK=mainnet
PORT=3001
NODE_ENV=production

# Contract addresses (from step 1)
MARKET_FACTORY_ADDRESS=<deployer-address>
MARKET_FACTORY_NAME=market-factory
MARKET_AMM_ADDRESS=<deployer-address>
MARKET_AMM_NAME=market-amm
ORACLE_REGISTRY_ADDRESS=<deployer-address>
ORACLE_REGISTRY_NAME=oracle-registry

# Wallet mnemonics
DEPLOYER_MNEMONIC=<mainnet-deployer-mnemonic>
MARKET_MAKER_MNEMONIC=<market-maker-wallet-mnemonic>

# sBTC mainnet contract
SBTC_CONTRACT=SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token

# Oracle
PYTH_HERMES_URL=https://hermes.pyth.network
PYTH_BTC_USD_FEED=0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43
USE_MOCK_PYTH=false

# AI
ANTHROPIC_API_KEY=<your-key>
NEWS_API_KEY=<your-key>

# Infrastructure
REDIS_URL=<railway-redis-url>
ADMIN_API_KEY=<generated-32+-char-key>
```

### Deploy

```bash
# Railway CLI
railway login
railway link
railway up

# Or via GitHub integration:
# 1. Connect repo in Railway dashboard
# 2. Set root directory: packages/backend
# 3. Railway auto-detects Dockerfile
# 4. Set all env vars above
# 5. Enable health check: GET /api/v1/health
```

---

## 3. Frontend Deployment (Vercel)

### Environment Variables

```bash
VITE_API_URL=https://api.satoshibets.xyz/api/v1
VITE_STACKS_NETWORK=mainnet
VITE_MARKET_FACTORY_ADDRESS=<deployer-address>
VITE_MARKET_FACTORY_NAME=market-factory
VITE_MARKET_AMM_ADDRESS=<deployer-address>
VITE_MARKET_AMM_NAME=market-amm
VITE_ORACLE_REGISTRY_ADDRESS=<deployer-address>
VITE_ORACLE_REGISTRY_NAME=oracle-registry
VITE_SBTC_CONTRACT=SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token
```

### Deploy

```bash
# Vercel CLI
cd packages/frontend
vercel --prod

# Or via dashboard:
# 1. Import repo
# 2. Root directory: packages/frontend
# 3. Build command: pnpm build
# 4. Output directory: dist
# 5. Set all VITE_* env vars
```

---

## 4. Post-Deployment Verification

```bash
# 1. Health check
curl https://api.satoshibets.xyz/api/v1/health

# 2. Verify contract deployment
curl https://api.hiro.so/v2/contracts/interface/<deployer-address>/market-factory

# 3. Register oracle (from deployer wallet)
# Call oracle-registry.register-oracle with the backend oracle address

# 4. Add deployer as authorized creator
# Call market-factory.add-creator with the deployer address

# 5. Generate first batch of markets
curl -X POST https://api.satoshibets.xyz/api/v1/admin/generate-markets \
  -H "X-API-Key: <ADMIN_API_KEY>"

# 6. Approve and seed first market
# Use admin dashboard at https://satoshibets.xyz/admin
```

---

## Security Considerations for Mainnet

1. **Mnemonic management**: Use hardware wallet or secure key management. Never store mnemonics in plaintext.
2. **Rate limiting**: Backend has built-in rate limiting. Configure CDN (Cloudflare) for additional DDoS protection.
3. **Admin key rotation**: Rotate `ADMIN_API_KEY` periodically.
4. **Monitoring**: Set up alerts for contract events, backend errors, and oracle failures.
5. **Gradual rollout**: Start with small pool sizes (0.001 sBTC) and increase after stability is confirmed.
6. **Circuit breaker**: Use `market-factory.pause-market` to pause any market with suspicious activity.
