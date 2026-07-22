import { useWallet as useWalletContext } from '../context/WalletContext';

export function useWallet() {
  return useWalletContext();
}
