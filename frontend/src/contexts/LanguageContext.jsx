import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);

  // Initialize language from localStorage or default to English
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'en';
    changeLanguage(savedLanguage);
  }, []);

  // Update document direction and language when language changes
  useEffect(() => {
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [currentLanguage, isRTL]);

  const changeLanguage = useCallback(async (language) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      setIsRTL(language === 'ar');
      localStorage.setItem('language', language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }, [i18n]);

  const toggleLanguage = useCallback(() => {
    const newLanguage = currentLanguage === 'en' ? 'ar' : 'en';
    changeLanguage(newLanguage);
  }, [currentLanguage, changeLanguage]);

  const value = {
    currentLanguage,
    isRTL,
    changeLanguage,
    toggleLanguage
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
