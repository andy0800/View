import React, { createContext, useContext, useState, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => createLanguageTheme('en')); // Default to English

  const updateTheme = useCallback((language) => {
    const newTheme = createLanguageTheme(language);
    setTheme(newTheme);
  }, []);

  const value = {
    theme,
    updateTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme creation function
function createLanguageTheme(language) {
  const isArabic = language === 'ar';
  
  const fontFamilies = {
    en: {
      primary: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
      secondary: '"Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
      display: '"Playfair Display", "Georgia", "Times New Roman", serif',
      mono: '"Roboto Mono", "Courier New", monospace'
    },
    ar: {
      primary: '"Cairo", "Tajawal", "Arial", sans-serif',
      secondary: '"Tajawal", "Cairo", "Arial", sans-serif',
      display: '"Amiri", "Georgia", "Times New Roman", serif',
      mono: '"Noto Sans Arabic", "Courier New", monospace'
    }
  };

  const fonts = fontFamilies[isArabic ? 'ar' : 'en'];

  return createTheme({
    direction: isArabic ? 'rtl' : 'ltr',
    palette: {
      mode: 'light',
      primary: {
        main: '#1a237e',
        light: '#534bae',
        dark: '#000051',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#4caf50',
        light: '#80e27e',
        dark: '#087f23',
        contrastText: '#ffffff'
      },
      background: {
        default: '#fafafa',
        paper: '#ffffff'
      }
    },
    typography: {
      fontFamily: fonts.primary,
      h1: {
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: '2.5rem',
        lineHeight: 1.2
      },
      h2: {
        fontFamily: fonts.display,
        fontWeight: 600,
        fontSize: '2rem',
        lineHeight: 1.3
      },
      h3: {
        fontFamily: fonts.primary,
        fontWeight: 600,
        fontSize: '1.75rem',
        lineHeight: 1.4
      },
      h4: {
        fontFamily: fonts.primary,
        fontWeight: 600,
        fontSize: '1.5rem',
        lineHeight: 1.4
      },
      h5: {
        fontFamily: fonts.primary,
        fontWeight: 600,
        fontSize: '1.25rem',
        lineHeight: 1.5
      },
      h6: {
        fontFamily: fonts.primary,
        fontWeight: 600,
        fontSize: '1rem',
        lineHeight: 1.5
      },
      body1: {
        fontFamily: fonts.secondary,
        fontSize: '1rem',
        lineHeight: 1.6
      },
      body2: {
        fontFamily: fonts.secondary,
        fontSize: '0.875rem',
        lineHeight: 1.6
      }
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)'
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)'
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8
            }
          }
        }
      }
    },
    shadows: Array(25).fill('none')
  });
}
