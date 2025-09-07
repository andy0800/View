import React from 'react';
import { LanguageProvider } from './LanguageContext';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { CreditProvider } from './CreditContext';
import { RealTimeStatsProvider } from './RealTimeStatsContext';
import { LanguageThemeSync } from '../components/LanguageThemeSync';

export function AppProvider({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <LanguageThemeSync />
        <AuthProvider>
          <CreditProvider>
            <RealTimeStatsProvider>
              {children}
            </RealTimeStatsProvider>
          </CreditProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
