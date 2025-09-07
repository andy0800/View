import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export function LanguageThemeSync() {
  const { currentLanguage } = useLanguage();
  const { updateTheme } = useTheme();

  // Update theme when language changes
  useEffect(() => {
    updateTheme(currentLanguage);
  }, [currentLanguage, updateTheme]);

  return null; // This component doesn't render anything
}
