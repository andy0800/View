import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

import { AuthProvider }   from './contexts/AuthContext.jsx'
import { CreditProvider } from './contexts/CreditContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <CreditProvider>     {/* ← PROVIDE CreditContext */}
        <App />
      </CreditProvider>
    </AuthProvider>
  </BrowserRouter>
)