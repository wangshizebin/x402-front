import React from 'react';
import { useWallet } from '../contexts/WalletContext';

export function WalletConnect() {
  const { isConnected, address, isConnecting, error, connectWallet, disconnectWallet } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="wallet-connected">
        <div className="wallet-info">
          <span className="status-indicator">●</span>
          <span className="address">{formatAddress(address)}</span>
          <button onClick={disconnectWallet} className="disconnect-btn">
            断开连接
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="connect-btn"
      >
        {isConnecting ? '连接中...' : '连接钱包'}
      </button>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
} 