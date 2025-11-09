import { config } from "dotenv";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { paymentMiddleware, Network, Resource } from "x402-hono";

config();

// Configuration from environment variables
const facilitatorUrl = process.env.FACILITATOR_URL as Resource || "https://x402.org/facilitator";
const payTo = process.env.ADDRESS as `0x${string}`;
const network = (process.env.NETWORK as Network) || "base-sepolia";
const port = parseInt(process.env.PORT || "3001");
const imageUrl = process.env.IMAGE_URL || "https://x402.taolimarket.com/frog.jpg";
const imagePrice = process.env.IMAGE_PRICE || "$0.1";

if (!payTo) {
  console.error("❌ Please set your wallet ADDRESS in the .env file");
  process.exit(1);
}

const app = new Hono();

// Enable CORS for frontend
app.use("/*", cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// Simple in-memory storage for paid users (use Redis/DB in production)
// Store wallet addresses that have paid and their access start time
interface UserAccess {
  startTime: Date;
}

const paidUsers = new Map<string, UserAccess>();
const VIEW_DURATION_MS = 30 * 1000; // 30 seconds

// Configure x402 payment middleware for image payment
app.use(
  paymentMiddleware(
    payTo,
    {
      // Image payment endpoint
      "/api/pay/image": {
        price: imagePrice,
        network,
      },
    },
    {
      url: facilitatorUrl,
    },
  ),
);

// Free endpoint - get payment info
app.get("/api/payment-info", (c) => {
  return c.json({
    price: imagePrice,
    description: "支付以解锁付费图片内容（可查看30秒）",
    endpoint: "/api/pay/image",
  });
});

// Paid endpoint - purchase image access
app.post("/api/pay/image", (c) => {
  // Get wallet address from payment context
  // Note: x402 middleware should provide payment context
  // For now, we'll use a simple approach - in production, verify the payment signature
  const walletAddress = c.req.header("x-wallet-address");
  
  if (walletAddress) {
    const normalizedAddress = walletAddress.toLowerCase();
    // Record the start time when user pays
    paidUsers.set(normalizedAddress, {
      startTime: new Date(),
    });
  }

  return c.json({
    success: true,
    message: "支付成功！已获得图片访问权限，可查看30秒。",
    imageUrl: imageUrl,
    startTime: new Date().toISOString(),
    duration: 30, // seconds
  });
});

// Free endpoint - get image URL (requires payment verification)
app.get("/api/image", (c) => {
  const walletAddress = c.req.header("x-wallet-address");
  
  if (!walletAddress) {
    return c.json({ 
      error: "需要钱包地址",
      paid: false 
    }, 401);
  }

  const normalizedAddress = walletAddress.toLowerCase();
  const userAccess = paidUsers.get(normalizedAddress);
  
  if (!userAccess) {
    return c.json({ 
      error: "需要支付才能访问图片",
      paid: false,
      paymentEndpoint: "/api/pay/image",
      price: imagePrice,
    }, 403);
  }

  // Check if 30 seconds have passed
  const now = new Date();
  const elapsed = now.getTime() - userAccess.startTime.getTime();
  const remaining = Math.max(0, VIEW_DURATION_MS - elapsed);
  const hasExpired = elapsed >= VIEW_DURATION_MS;

  if (hasExpired) {
    // Remove expired access
    paidUsers.delete(normalizedAddress);
    return c.json({ 
      error: "查看时间已过期。请重新支付以查看图片。",
      paid: false,
      expired: true,
      paymentEndpoint: "/api/pay/image",
      price: imagePrice,
    }, 403);
  }

  return c.json({
    success: true,
    paid: true,
    imageUrl: imageUrl,
    startTime: userAccess.startTime.toISOString(),
    remainingSeconds: Math.ceil(remaining / 1000),
    totalDuration: 30,
  });
});

console.log(`
🖼️  x402 Premium Image Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Accepting payments to: ${payTo}
🔗 Network: ${network}
🌐 Port: ${port}
🖼️  Image URL: ${imageUrl}
💵 Price: ${imagePrice}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛠️  Premium image content - payment required
📚 Learn more: https://x402.org
💬 Get help: https://discord.gg/invite/cdp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

serve({
  fetch: app.fetch,
  port,
}); 