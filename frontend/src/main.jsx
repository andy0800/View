// frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import { AppProvider } from './contexts/AppProvider.jsx';
import './i18n.js';
import './styles/rtlStyles.css';
import './styles/arabicStyles.css';
import './styles/fontOptimizations.css';
import GlobalStyles from './styles/globalStyles.jsx';
import './styles/mobileOptimizations.css';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  // Removed React.StrictMode to prevent double mounting
  <>
    <CssBaseline enableColorScheme={false} />
    <GlobalStyles />
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </>
);