import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, formatUnits, parseUnits } from 'ethers';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  usdcBalance: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToPolygon: () => Promise<void>;
  signPolymarketTrade: (tokenId: string, price: number, size: number, side: 'BUY' | 'SELL') => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const POLYGON_CHAIN_ID = '0x89'; // 137 in decimal
const POLYGON_RPC = 'https://polygon-rpc.com';
const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // USDC on Polygon

const USDC_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState('0');

  const isConnected = !!address;

  // Check if already connected
  useEffect(() => {
    checkConnection();
  }, []);

  // Update balance when address changes
  useEffect(() => {
    if (address) {
      updateBalance();
    }
  }, [address]);

  const checkConnection = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) {
        setAddress(accounts[0].address);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const updateBalance = async () => {
    if (!address) return;

    try {
      const provider = new BrowserProvider(window.ethereum!);
      const usdcContract = new Contract(USDC_ADDRESS, USDC_ABI, provider);
      const balance = await usdcContract.balanceOf(address);
      const decimals = await usdcContract.decimals();
      setUsdcBalance(formatUnits(balance, decimals));
    } catch (error) {
      console.error('Failed to fetch USDC balance:', error);
      setUsdcBalance('0');
    }
  };

  const connect = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to use this feature');
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      setAddress(accounts[0]);

      // Switch to Polygon if not already
      await switchToPolygon();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setUsdcBalance('0');
  };

  const switchToPolygon = async () => {
    if (typeof window.ethereum === 'undefined') return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
    } catch (error: any) {
      // Chain not added, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: POLYGON_CHAIN_ID,
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: [POLYGON_RPC],
                blockExplorerUrls: ['https://polygonscan.com/'],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Polygon network:', addError);
          throw addError;
        }
      } else {
        console.error('Failed to switch to Polygon:', error);
        throw error;
      }
    }
  };

  const signPolymarketTrade = async (
    tokenId: string,
    price: number,
    size: number,
    side: 'BUY' | 'SELL'
  ): Promise<string> => {
    if (!address) throw new Error('Wallet not connected');

    try {
      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();

      // Create trade message for signing
      const message = JSON.stringify({
        tokenId,
        price,
        size,
        side,
        timestamp: Date.now(),
      });

      // Sign the message
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Failed to sign trade:', error);
      throw error;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isConnecting,
        usdcBalance,
        connect,
        disconnect,
        switchToPolygon,
        signPolymarketTrade,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
