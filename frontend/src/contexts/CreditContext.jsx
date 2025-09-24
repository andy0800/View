// src/contexts/CreditContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api';
import { microToKwd } from '../utils/currencyUtils';

const CreditContext = createContext();

// Export the context for direct usage
export { CreditContext };

export const useCredit = () => {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredit must be used within a CreditProvider');
  }
  return context;
};

export const CreditProvider = ({ children }) => {
  const [credit, setCredit] = useState(0);
  const [creditMicro, setCreditMicro] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { user, isAuthenticated } = useAuth();

  // Fetch credit balance from backend
  const fetchCredit = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/api/wallet');
      
      if (response.data.success) {
        const { balance, balanceMicro } = response.data;
        setCredit(balance || 0);
        setCreditMicro(balanceMicro || 0);
        setLastUpdated(new Date());
        console.log('✅ Credit balance fetched:', { balance, balanceMicro });
      } else {
        throw new Error(response.data.message || 'Failed to fetch credit balance');
      }
    } catch (err) {
      console.error('❌ Error fetching credit:', err);
      setError(err.message || 'Failed to fetch credit balance');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Add credit (for rewards)
  const addCredit = (amount) => {
    // amount is already in KWD from the reward response
    const numAmount = parseFloat(amount) || 0;
    setCredit(prev => parseFloat(prev) + numAmount);
    
    // Also update micro units if we have the conversion rate
    if (numAmount > 0) {
      // Convert KWD to micro units (approximate)
      const microAmount = Math.round(numAmount * 1_000_000);
      setCreditMicro(prev => prev + microAmount);
    }
    
    setLastUpdated(new Date());
  };

  // Add credit in micro units
  const addCreditMicro = (amountMicro) => {
    const numAmountMicro = parseInt(amountMicro) || 0;
    setCreditMicro(prev => prev + numAmountMicro);
    
    // Convert to KWD for display
    const kwdAmount = microToKwd(numAmountMicro);
    setCredit(prev => parseFloat(prev) + kwdAmount);
    
    setLastUpdated(new Date());
  };

  // Deduct credit (for purchases)
  const deductCredit = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    setCredit(prev => Math.max(0, parseFloat(prev) - numAmount));
    
    // Also update micro units if we have the conversion rate
    if (numAmount > 0) {
      // Convert KWD to micro units (approximate)
      const microAmount = Math.round(numAmount * 1_000_000);
      setCreditMicro(prev => Math.max(0, prev - microAmount));
    }
    
    setLastUpdated(new Date());
  };

  // Deduct credit in micro units
  const deductCreditMicro = (amountMicro) => {
    const numAmountMicro = parseInt(amountMicro) || 0;
    setCreditMicro(prev => Math.max(0, prev - numAmountMicro));
    
    // Convert to KWD for display
    const kwdAmount = microToKwd(numAmountMicro);
    setCredit(prev => Math.max(0, parseFloat(prev) - kwdAmount));
    
    setLastUpdated(new Date());
  };

  // Set credit directly (for admin/testing purposes)
  const setCreditDirect = (amount, amountMicro = null) => {
    const numAmount = parseFloat(amount) || 0;
    setCredit(numAmount);
    
    if (amountMicro !== null) {
      setCreditMicro(parseInt(amountMicro) || 0);
    }
    
    setLastUpdated(new Date());
  };

  // Refresh credit from backend
  const refreshCredit = async () => {
    await fetchCredit();
  };

  // Get credit in different formats
  const getCreditKWD = () => credit;
  const getCreditMicro = () => creditMicro;
  const getCreditFormatted = () => `${(Number(credit) || 0).toFixed(3)} KWD`;
  const getCreditFormattedMicro = () => `${(Number(creditMicro) || 0).toLocaleString()} micro units`;

  // Check if user has sufficient credit
  const hasSufficientCredit = (requiredAmount) => {
    const numRequired = parseFloat(requiredAmount) || 0;
    return credit >= numRequired;
  };

  // Check if user has sufficient credit in micro units
  const hasSufficientCreditMicro = (requiredAmountMicro) => {
    const numRequired = parseInt(requiredAmountMicro) || 0;
    return creditMicro >= numRequired;
  };

  // Get credit statistics
  const getCreditStats = () => ({
    balanceKWD: credit,
    balanceMicro: creditMicro,
    lastUpdated,
    loading,
    error
  });

  // Effect to fetch credit when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchCredit();
    } else {
      // Reset credit when user logs out
      setCredit(0);
      setCreditMicro(0);
      setLoading(false);
      setError(null);
      setLastUpdated(null);
    }
  }, [isAuthenticated, user, fetchCredit]);

  // Auto-refresh credit every 30 seconds when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      fetchCredit();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchCredit]);

  const value = {
    // State
    credit,
    creditMicro,
    loading,
    error,
    lastUpdated,
    
    // Actions
    addCredit,
    addCreditMicro,
    deductCredit,
    deductCreditMicro,
    setCreditDirect,
    refreshCredit,
    
    // Getters
    getCreditKWD,
    getCreditMicro,
    getCreditFormatted,
    getCreditFormattedMicro,
    
    // Utilities
    hasSufficientCredit,
    hasSufficientCreditMicro,
    getCreditStats
  };

  return (
    <CreditContext.Provider value={value}>
      {children}
    </CreditContext.Provider>
  );
};