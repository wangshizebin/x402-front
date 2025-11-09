import axios from "axios";
import type { AxiosInstance } from "axios";
import type { WalletClient } from "viem";
import { withPaymentInterceptor } from "x402-axios";

const API_BASE_URL = "https://x402.taolimarket.com"
// const API_BASE_URL = ""http://localhost:3001";

// Base axios instance without payment interceptor
const baseApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// This will be dynamically set based on wallet connection
let apiClient: AxiosInstance = baseApiClient;

// Update the API client with a wallet
export function updateApiClient(walletClient: WalletClient | null) {
  if (walletClient && walletClient.account) {
    // Create axios instance with x402 payment interceptor
    apiClient = withPaymentInterceptor(baseApiClient, walletClient as any);
    
    // Add wallet address to default headers
    apiClient.defaults.headers.common['x-wallet-address'] = walletClient.account.address;
    
    console.log("💳 API client updated with wallet:", walletClient.account.address);
  } else {
    // No wallet connected - reset to base client
    apiClient = baseApiClient;
    delete apiClient.defaults.headers.common['x-wallet-address'];
    console.log("⚠️ API client reset - no wallet connected");
  }
}

// API endpoints
export const api = {
  // Free endpoints
  getHealth: async () => {
    const response = await apiClient.get("/api/health");
    return response.data;
  },

  getPaymentInfo: async () => {
    const response = await apiClient.get("/api/payment-info");
    return response.data;
  },

  getImage: async (walletAddress?: string) => {
    const config = walletAddress 
      ? { headers: { 'x-wallet-address': walletAddress } }
      : {};
    const response = await apiClient.get("/api/image", config);
    return response.data;
  },

  // Paid endpoints
  purchaseImage: async () => {
    console.log("🖼️ Purchasing image access...");
    const response = await apiClient.post("/api/pay/image");
    console.log("✅ Image access granted:", response.data);
    return response.data;
  },
};

// Types for API responses
export interface PaymentInfo {
  price: string;
  description: string;
  endpoint: string;
}

export interface ImageResponse {
  success?: boolean;
  paid?: boolean;
  imageUrl?: string;
  error?: string;
  paymentEndpoint?: string;
  price?: string;
  startTime?: string;
  remainingSeconds?: number;
  totalDuration?: number;
  expired?: boolean;
} 