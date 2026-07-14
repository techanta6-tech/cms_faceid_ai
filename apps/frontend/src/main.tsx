import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SocketProvider } from './context/SocketContext.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { BrowserRouter, HashRouter } from 'react-router-dom';

const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');
const Router = isElectron ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <SocketProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </SocketProvider>
    </Router>
  </StrictMode>,
);
