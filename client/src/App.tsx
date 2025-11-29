import React, { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { useWallet } from './contexts/WalletContext';
import { api, updateApiClient, type PaymentInfo, type ImageResponse } from './services/api';
import './App.css';

function App() {
  const { walletClient, address, isConnected } = useWallet();
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPaid, setHasPaid] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Update API client when wallet changes
  useEffect(() => {
    updateApiClient(walletClient);
    if (isConnected && address) {
      checkImageAccess();
    } else {
      setImageUrl(null);
      setHasPaid(false);
    }
  }, [walletClient, isConnected, address]);

  // Load payment info on mount
  useEffect(() => {
    loadPaymentInfo();
  }, []);

  const loadPaymentInfo = async () => {
    try {
      const data = await api.getPaymentInfo();
      setPaymentInfo(data);
    } catch (error) {
      console.error('Failed to load payment info:', error);
    }
  };

  const checkImageAccess = async () => {
    if (!address) return;
    try {
      const response: ImageResponse = await api.getImage(address);
      if (response.paid && response.imageUrl) {
        setImageUrl(response.imageUrl);
        setHasPaid(true);
        setError(null);
        if (response.startTime) {
          setStartTime(new Date(response.startTime));
        }
        if (response.remainingSeconds !== undefined) {
          setRemainingSeconds(response.remainingSeconds);
        }
      } else {
        setHasPaid(false);
        setImageUrl(null);
        setRemainingSeconds(null);
        setStartTime(null);
        if (response.expired) {
          setError('查看时间已过期。请重新支付以查看图片。');
        }
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        const errorData = error.response.data;
        setHasPaid(false);
        setImageUrl(null);
        setRemainingSeconds(null);
        setStartTime(null);
        if (errorData?.expired) {
          setError('查看时间已过期。请重新支付以查看图片。');
        }
      } else {
        console.error('Failed to check image access:', error);
      }
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (!hasPaid || !startTime || remainingSeconds === null) {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = now.getTime() - startTime.getTime();
     
      const remaining = Math.max(0, 30000 - elapsed); // 30 seconds in ms
      const remainingSec = Math.ceil(remaining / 1000);

      if (remainingSec <= 0) {
        setRemainingSeconds(0);
        setHasPaid(false);
        setImageUrl(null);
        setError('查看时间已过期。请重新支付以查看图片。');
        clearInterval(interval);
      } else {
        setRemainingSeconds(remainingSec);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasPaid, startTime, remainingSeconds]);

  const handlePurchaseImage = async () => {
    if (!isConnected) {
      setError('请先连接您的钱包');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await api.purchaseImage();
      if (result.success && result.imageUrl) {
        setImageUrl(result.imageUrl);
        setHasPaid(true);
        setError(null);
        if (result.startTime) {
          setStartTime(new Date(result.startTime));
        }
        if (result.duration) {
          setRemainingSeconds(result.duration);
        }
      }
    } catch (error: any) {
      setError(error.message || '购买图片访问权限失败');
      console.error('Purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <main>
        <section className="image-section">
          <div className="section-header">
            <div className="hero-card">
              <h1>X402 测试网</h1>
              <p className="hero-subtitle">支付 USDC 测试币，体验 30 秒钟即时解锁的付费图片</p>
              <ul className="hero-list">
                <li>⚡️ 通过 HTTP 402 触发支付请求</li>
                <li>🧾 无需账号体系，钱包即身份</li>
                <li>🪙 原生支持加密货币支付</li>
                <li>💰 消费者无需支付 Gas</li>
              </ul>
              <div className="hero-cta">
                <a className="hero-link" href="https://faucet.circle.com/" target="_blank" rel="noreferrer">
                  领取测试币
                </a>
                <span className="hero-note">在 Circle Faucet 中选择 USDC · Network: Base Sepolia</span>
              </div>
            </div>
          </div>
          <div className="wallet-connect-wrapper">
            <WalletConnect />
          </div>
          
          {hasPaid && imageUrl ? (
            <div className="image-container">
              <img 
                src={imageUrl} 
                alt="付费内容"
                className="premium-image"
              />
              {remainingSeconds !== null && remainingSeconds > 0 && (
                <p className="image-access-message">✅ 您已获得此付费内容的访问权限（剩余 {remainingSeconds} 秒）</p>
              )}
            </div>
          ) : (
            <>
              {paymentInfo && (
                <div className="payment-card">
                  <h3>付费图片</h3>
                  <p className="price">{paymentInfo.price}</p>
                  <p className="description">{paymentInfo.description}</p>
                  <button 
                    onClick={handlePurchaseImage}
                    disabled={loading}
                    className="action-btn"
                  >
                    {loading ? '处理支付中...' : `支付 ${paymentInfo.price} 解锁`}
                  </button>
                  {error && (
                    <div className="error-message inline">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <footer>
        <p>© 2025 X402演示案例 by ZeBin · wechat：bkra50</p>
      </footer>
    </div>
  );
}

export default App; 