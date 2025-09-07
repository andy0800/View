import { createTheme } from '@mui/material/styles';

// Font families for different languages with famous bold fonts
const fontFamilies = {
  en: {
    primary: '"Montserrat", "Open Sans", "Roboto", "Helvetica", "Arial", sans-serif',
    secondary: '"Open Sans", "Roboto", "Segoe UI", sans-serif',
    mono: '"Roboto Mono", "Fira Code", "Consolas", monospace',
    display: '"Playfair Display", "Georgia", serif'
  },
  ar: {
    primary: '"Cairo", "Tajawal", "Noto Sans Arabic", "Arial", sans-serif',
    secondary: '"Tajawal", "Cairo", "Segoe UI", sans-serif',
    mono: '"Fira Code", "Consolas", monospace',
    display: '"Amiri", "Noto Naskh Arabic", "Georgia", serif'
  }
};

// Language-specific typography settings with bold weights
const getTypography = (language) => {
  const isArabic = language === 'ar';
  const fonts = fontFamilies[language] || fontFamilies.en;
  
  return {
    fontFamily: fonts.primary,
    
    h1: {
      fontFamily: fonts.display,
      fontWeight: isArabic ? 800 : 900,
      fontSize: isArabic ? '2.5rem' : '3rem',
      lineHeight: isArabic ? 1.3 : 1.1,
      letterSpacing: isArabic ? '0.02em' : '0.01em',
      textTransform: 'uppercase',
    },
    h2: {
      fontFamily: fonts.display,
      fontWeight: isArabic ? 800 : 900,
      fontSize: isArabic ? '2.25rem' : '2.5rem',
      lineHeight: isArabic ? 1.3 : 1.1,
      letterSpacing: isArabic ? '0.02em' : '0.01em',
      textTransform: 'uppercase',
    },
    h3: {
      fontFamily: fonts.primary,
      fontWeight: isArabic ? 700 : 800,
      fontSize: isArabic ? '1.875rem' : '2rem',
      lineHeight: isArabic ? 1.3 : 1.2,
      letterSpacing: isArabic ? '0.02em' : '0.01em',
    },
    h4: {
      fontFamily: fonts.primary,
      fontWeight: isArabic ? 700 : 800,
      fontSize: isArabic ? '1.5rem' : '1.75rem',
      lineHeight: isArabic ? 1.3 : 1.2,
      letterSpacing: isArabic ? '0.02em' : '0.01em',
    },
    h5: {
      fontFamily: fonts.primary,
      fontWeight: isArabic ? 700 : 700,
      fontSize: isArabic ? '1.25rem' : '1.5rem',
      lineHeight: isArabic ? 1.3 : 1.2,
      letterSpacing: isArabic ? '0.02em' : '0.01em',
    },
    h6: {
      fontFamily: fonts.primary,
      fontWeight: isArabic ? 700 : 700,
      fontSize: isArabic ? '1.125rem' : '1.25rem',
      lineHeight: isArabic ? 1.3 : 1.2,
      letterSpacing: isArabic ? '0.02em' : '0.01em',
    },
    body1: {
      fontFamily: fonts.secondary,
      fontSize: isArabic ? '1.0625rem' : '1rem',
      lineHeight: isArabic ? 1.7 : 1.6,
      letterSpacing: isArabic ? '0.01em' : '0.009em',
      fontWeight: 500,
    },
    body2: {
      fontFamily: fonts.secondary,
      fontSize: isArabic ? '0.9375rem' : '0.875rem',
      lineHeight: isArabic ? 1.7 : 1.6,
      letterSpacing: isArabic ? '0.01em' : '0.009em',
      fontWeight: 500,
    },
    button: {
      fontFamily: fonts.primary,
      textTransform: 'uppercase',
      fontWeight: isArabic ? 700 : 700,
      fontSize: isArabic ? '0.875rem' : '0.875rem',
      letterSpacing: isArabic ? '0.05em' : '0.05em',
    },
    caption: {
      fontFamily: fonts.secondary,
      fontSize: isArabic ? '0.8125rem' : '0.75rem',
      lineHeight: isArabic ? 1.5 : 1.4,
      letterSpacing: isArabic ? '0.01em' : '0.009em',
      fontWeight: 600,
    },
    overline: {
      fontFamily: fonts.primary,
      fontSize: isArabic ? '0.75rem' : '0.625rem',
      fontWeight: isArabic ? 700 : 700,
      letterSpacing: isArabic ? '0.15em' : '0.15em',
      textTransform: 'uppercase',
    },
    subtitle1: {
      fontFamily: fonts.secondary,
      fontSize: isArabic ? '1.0625rem' : '1rem',
      lineHeight: isArabic ? 1.7 : 1.6,
      fontWeight: isArabic ? 600 : 600,
      letterSpacing: isArabic ? '0.01em' : '0.009em',
    },
    subtitle2: {
      fontFamily: fonts.secondary,
      fontSize: isArabic ? '0.9375rem' : '0.875rem',
      lineHeight: isArabic ? 1.7 : 1.6,
      fontWeight: isArabic ? 600 : 600,
      letterSpacing: isArabic ? '0.01em' : '0.009em',
    },
  };
};

// Create theme with language support and professional styling
const createLanguageTheme = (language = 'en') => {
  const isArabic = language === 'ar';
  const fonts = fontFamilies[language] || fontFamilies.en;
  
  return createTheme({
    direction: isArabic ? 'rtl' : 'ltr',
    palette: {
      primary: {
        main: '#1a237e', // Deep blue
        light: '#534bae',
        dark: '#000051',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#d32f2f', // Deep red
        light: '#ff6659',
        dark: '#9a0007',
        contrastText: '#ffffff',
      },
      background: {
        default: isArabic ? '#fafafa' : '#f8f9fa',
        paper: '#ffffff',
      },
      text: {
        primary: isArabic ? '#1a1a1a' : '#1a1a1a',
        secondary: isArabic ? '#424242' : '#424242',
      },
      divider: isArabic ? '#e0e0e0' : '#e0e0e0',
      success: {
        main: '#2e7d32',
        light: '#4caf50',
        dark: '#1b5e20',
      },
      warning: {
        main: '#f57c00',
        light: '#ff9800',
        dark: '#e65100',
      },
      error: {
        main: '#d32f2f',
        light: '#ef5350',
        dark: '#c62828',
      },
      info: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
    },
    
    typography: getTypography(language),
    
    components: {
      MuiContainer: {
        styleOverrides: {
          root: {
            paddingLeft: isArabic ? '16px' : '16px',
            paddingRight: isArabic ? '16px' : '16px',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: isArabic ? 24 : 20,
            boxShadow: isArabic 
              ? '0 8px 32px rgba(0,0,0,0.12)' 
              : '0 6px 24px rgba(0,0,0,0.12)',
            fontFamily: fonts.secondary,
            border: '1px solid rgba(0,0,0,0.08)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: isArabic 
                ? '0 16px 48px rgba(0,0,0,0.16)' 
                : '0 12px 40px rgba(0,0,0,0.16)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: isArabic ? 20 : 16,
            padding: isArabic ? '14px 32px' : '12px 28px',
            fontSize: isArabic ? '0.875rem' : '0.875rem',
            fontFamily: fonts.primary,
            fontWeight: isArabic ? 700 : 700,
            letterSpacing: isArabic ? '0.05em' : '0.05em',
            textTransform: 'uppercase',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '2px solid transparent',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: isArabic 
                ? '0 12px 32px rgba(26, 35, 126, 0.4)' 
                : '0 8px 24px rgba(26, 35, 126, 0.4)',
            },
          },
          contained: {
            boxShadow: isArabic 
              ? '0 6px 20px rgba(26, 35, 126, 0.3)' 
              : '0 4px 16px rgba(26, 35, 126, 0.3)',
            '&:hover': {
              boxShadow: isArabic 
                ? '0 12px 32px rgba(26, 35, 126, 0.4)' 
                : '0 8px 24px rgba(26, 35, 126, 0.4)',
            },
          },
          outlined: {
            borderWidth: '2px',
            fontWeight: 700,
            '&:hover': {
              borderWidth: '2px',
              backgroundColor: 'rgba(26, 35, 126, 0.04)',
            },
          },
          text: {
            fontWeight: 700,
            '&:hover': {
              backgroundColor: 'rgba(26, 35, 126, 0.04)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            fontFamily: fonts.secondary,
            '& .MuiOutlinedInput-root': {
              borderRadius: isArabic ? 20 : 16,
              fontSize: isArabic ? '1rem' : '0.875rem',
              fontWeight: 500,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: isArabic ? '#1a237e' : '#1a237e',
                borderWidth: '2px',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1a237e',
                borderWidth: '2px',
              },
            },
            '& .MuiInputLabel-root': {
              fontFamily: fonts.secondary,
              fontSize: isArabic ? '1rem' : '0.875rem',
              fontWeight: 600,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: isArabic ? 24 : 20,
            fontFamily: fonts.secondary,
            fontSize: isArabic ? '0.875rem' : '0.75rem',
            fontWeight: isArabic ? 600 : 600,
            height: isArabic ? '32px' : '28px',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            fontFamily: fonts.primary,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            fontFamily: fonts.primary,
            boxShadow: isArabic 
              ? '0 4px 24px rgba(0,0,0,0.15)' 
              : '0 4px 20px rgba(0,0,0,0.15)',
            background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            fontFamily: fonts.primary,
            backgroundColor: isArabic ? '#fafafa' : '#ffffff',
            borderRight: '1px solid rgba(0,0,0,0.08)',
          },
        },
      },
      MuiListItem: {
        styleOverrides: {
          root: {
            fontFamily: fonts.secondary,
            fontSize: isArabic ? '1rem' : '0.875rem',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: 'rgba(26, 35, 126, 0.04)',
            },
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              fontFamily: fonts.primary,
              fontWeight: isArabic ? 700 : 700,
              fontSize: isArabic ? '0.9375rem' : '0.875rem',
              backgroundColor: 'rgba(26, 35, 126, 0.04)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontFamily: fonts.secondary,
            fontSize: isArabic ? '0.9375rem' : '0.875rem',
            fontWeight: 500,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: isArabic ? 24 : 20,
            fontFamily: fonts.primary,
            boxShadow: '0 16px 48px rgba(0,0,0,0.24)',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: isArabic ? 20 : 16,
            fontFamily: fonts.secondary,
            fontSize: isArabic ? '0.9375rem' : '0.875rem',
            fontWeight: 500,
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiAlert-root': {
              borderRadius: isArabic ? 20 : 16,
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            '& .MuiTabs-indicator': {
              height: '4px',
              borderRadius: '2px',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontFamily: fonts.primary,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: {
            fontFamily: fonts.primary,
            fontWeight: 700,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            fontFamily: fonts.secondary,
            fontWeight: 500,
          },
        },
      },
    },
    
    // Custom spacing for Arabic
    spacing: isArabic ? 8 : 8,
    
    // Enhanced shadows for professional look
    shadows: isArabic ? [
      'none',
      '0 2px 8px rgba(0,0,0,0.08)',
      '0 4px 16px rgba(0,0,0,0.12)',
      '0 8px 24px rgba(0,0,0,0.16)',
      '0 16px 32px rgba(0,0,0,0.20)',
      '0 24px 48px rgba(0,0,0,0.24)'
    ] : Array(25).fill('none'),
  });
};

// Default theme (English)
const theme = createLanguageTheme('en');

// Export both the default theme and the function to create language-specific themes
export { createLanguageTheme };
export default theme;
