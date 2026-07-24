import { Provider } from 'react-redux';
import store from './store/store';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <WalletProvider>
            <AppRouter />
          </WalletProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
}
