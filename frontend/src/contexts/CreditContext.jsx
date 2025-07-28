import React, { createContext, useState, useEffect } from 'react';
import { getCredit } from '../api/viewer';

export const CreditContext = createContext();

export function CreditProvider({ children }) {
  const [credit, setCredit] = useState(0);

  useEffect(() => {
    getCredit()
      .then(data => setCredit(data.balance))
      .catch(err => console.error('Failed to fetch credit', err));
  }, []);

  const addCredit = amount => setCredit(prev => prev + amount);

  return (
    <CreditContext.Provider value={{ credit, addCredit, setCredit }}>
      {children}
    </CreditContext.Provider>
  );
}