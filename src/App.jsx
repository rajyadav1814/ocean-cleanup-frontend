import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <AppRouter />
      </WalletProvider>
    </AuthProvider>
  );
}
