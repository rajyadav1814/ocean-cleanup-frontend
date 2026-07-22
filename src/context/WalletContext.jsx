import { createContext, useContext, useMemo, useState } from 'react';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const value = useMemo(() => ({ wallet, setWallet }), [wallet]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  return useContext(WalletContext);
}
