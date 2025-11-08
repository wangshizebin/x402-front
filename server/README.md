# x402 Server Example

This server demonstrates x402 payment integration with multiple pricing tiers.

## Setup

1. Create a `.env` file:
```env
# Required
FACILITATOR_URL=https://x402.org/facilitator
NETWORK=base-sepolia
ADDRESS=0x_YOUR_WALLET_ADDRESS_HERE
PORT=3001

# Environment (development or production)
NODE_ENV=development

# CORS Configuration (required in production)
# For production, set your frontend domain(s), comma-separated:
# CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
# In development, localhost origins are allowed by default
```

2. Install dependencies:
```bash
npm install
```

3. Run the server:
```bash
npm run dev
```

## Endpoints

### Free Endpoints
- `GET /api/health` - Server health check
- `GET /api/pricing` - Get pricing information
- `GET /api/session/:sessionId` - Check session status

### Paid Endpoints
- `POST /api/premium/content` - Access premium content ($0.10)
- `POST /api/premium/action` - Perform premium action ($1.00)
- `POST /api/premium/subscribe` - Monthly subscription ($5.00) 