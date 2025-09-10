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

ReactDOM.createRoot(document.getElementById('root')).render(
  // Removed React.StrictMode to prevent double mounting
  <>
    <CssBaseline />
    <GlobalStyles />
    <HashRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </HashRouter>
  </>
);