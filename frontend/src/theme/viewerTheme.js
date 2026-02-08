import { createTheme } from '@mui/material/styles';

const viewerTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#E50914',
      dark: '#B50710',
      light: '#FF3B30'
    },
    secondary: {
      main: '#9BA3AF'
    },
    background: {
      default: '#0B0B0F',
      paper: '#13141B'
    },
    text: {
      primary: '#F4F6FB',
      secondary: '#9BA3AF'
    },
    error: {
      main: '#FF3B30'
    },
    success: {
      main: '#22C55E'
    }
  },
  typography: {
    fontFamily: '"Inter", "Manrope", "Cairo", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  shape: {
    borderRadius: 14
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0B0B0F',
          color: '#F4F6FB'
        },
        "html[dir='rtl'] body": {
          fontFamily: '"Cairo", "Inter", "Manrope", "Roboto", "Helvetica", "Arial", sans-serif'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F1117',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 18,
          paddingBlock: 10
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#151824',
          border: '1px solid rgba(255,255,255,0.06)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10
        }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 999
        }
      }
    }
  }
});

export default viewerTheme;
