import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    primary: {
      main: '#0066FF',
      light: '#4D94FF',
      dark: '#0047B3',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00C896',
      light: '#33D8B0',
      dark: '#009B70',
      contrastText: '#FFFFFF',
    },
    accent: {
      main: '#FFC857',
      light: '#FFD680',
      dark: '#E5B13D',
    },
    error: {
      main: '#FF6B6B',
      light: '#FF8E8E',
      dark: '#E55A5A',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#FB8C00',
    },
    info: {
      main: '#00BFFF',
      light: '#33CCFF',
      dark: '#0099CC',
    },
    success: {
      main: '#00C896',
      light: '#33D8B0',
      dark: '#009B70',
    },
    background: {
      default: mode === 'dark' ? '#0a0e1a' : '#F8FAFC',
      paper: mode === 'dark' ? '#111827' : '#FFFFFF',
      elevated: mode === 'dark' ? '#1f2937' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#f9fafb' : '#0F172A',
      secondary: mode === 'dark' ? '#9ca3af' : '#64748B',
      disabled: mode === 'dark' ? '#6b7280' : '#94A3B8',
    },
    divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 39, 68, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontSize: 'clamp(2rem, 4vw, 3rem)',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
      letterSpacing: '0.01em',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: mode === 'dark' ? [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.3)',
    '0 4px 12px rgba(0, 0, 0, 0.4)',
    '0 8px 24px rgba(0, 0, 0, 0.5)',
    '0 12px 36px rgba(0, 0, 0, 0.6)',
    '0 20px 48px rgba(0, 0, 0, 0.7)',
    '0 28px 60px rgba(0, 0, 0, 0.8)',
    '0 32px 70px rgba(0, 0, 0, 0.85)',
    '0 36px 80px rgba(0, 0, 0, 0.9)',
    '0 40px 90px rgba(0, 0, 0, 0.92)',
    '0 44px 100px rgba(0, 0, 0, 0.94)',
    '0 48px 110px rgba(0, 0, 0, 0.95)',
    '0 52px 120px rgba(0, 0, 0, 0.96)',
    '0 56px 130px rgba(0, 0, 0, 0.97)',
    '0 60px 140px rgba(0, 0, 0, 0.98)',
    '0 64px 150px rgba(0, 0, 0, 0.98)',
    '0 68px 160px rgba(0, 0, 0, 0.99)',
    '0 72px 170px rgba(0, 0, 0, 0.99)',
    '0 76px 180px rgba(0, 0, 0, 0.99)',
    '0 80px 190px rgba(0, 0, 0, 0.99)',
    '0 84px 200px rgba(0, 0, 0, 0.99)',
    '0 88px 210px rgba(0, 0, 0, 0.99)',
    '0 92px 220px rgba(0, 0, 0, 0.99)',
    '0 96px 230px rgba(0, 0, 0, 0.99)',
    '0 100px 240px rgba(0, 0, 0, 0.99)',
  ] : [
    'none',
    '0 1px 3px rgba(15, 39, 68, 0.04), 0 1px 2px rgba(15, 39, 68, 0.02)',
    '0 4px 12px rgba(15, 39, 68, 0.06), 0 2px 4px rgba(15, 39, 68, 0.04)',
    '0 8px 24px rgba(15, 39, 68, 0.08), 0 4px 8px rgba(15, 39, 68, 0.04)',
    '0 12px 36px rgba(15, 39, 68, 0.1), 0 6px 12px rgba(15, 39, 68, 0.06)',
    '0 20px 48px rgba(15, 39, 68, 0.12), 0 10px 20px rgba(15, 39, 68, 0.08)',
    '0 28px 60px rgba(15, 39, 68, 0.14), 0 14px 28px rgba(15, 39, 68, 0.1)',
    '0 32px 70px rgba(15, 39, 68, 0.15), 0 16px 32px rgba(15, 39, 68, 0.11)',
    '0 36px 80px rgba(15, 39, 68, 0.16), 0 18px 36px rgba(15, 39, 68, 0.12)',
    '0 40px 90px rgba(15, 39, 68, 0.17), 0 20px 40px rgba(15, 39, 68, 0.13)',
    '0 44px 100px rgba(15, 39, 68, 0.18), 0 22px 44px rgba(15, 39, 68, 0.14)',
    '0 48px 110px rgba(15, 39, 68, 0.19), 0 24px 48px rgba(15, 39, 68, 0.15)',
    '0 52px 120px rgba(15, 39, 68, 0.20), 0 26px 52px rgba(15, 39, 68, 0.16)',
    '0 56px 130px rgba(15, 39, 68, 0.21), 0 28px 56px rgba(15, 39, 68, 0.17)',
    '0 60px 140px rgba(15, 39, 68, 0.22), 0 30px 60px rgba(15, 39, 68, 0.18)',
    '0 64px 150px rgba(15, 39, 68, 0.23), 0 32px 64px rgba(15, 39, 68, 0.19)',
    '0 68px 160px rgba(15, 39, 68, 0.24), 0 34px 68px rgba(15, 39, 68, 0.20)',
    '0 72px 170px rgba(15, 39, 68, 0.25), 0 36px 72px rgba(15, 39, 68, 0.21)',
    '0 76px 180px rgba(15, 39, 68, 0.26), 0 38px 76px rgba(15, 39, 68, 0.22)',
    '0 80px 190px rgba(15, 39, 68, 0.27), 0 40px 80px rgba(15, 39, 68, 0.23)',
    '0 84px 200px rgba(15, 39, 68, 0.28), 0 42px 84px rgba(15, 39, 68, 0.24)',
    '0 88px 210px rgba(15, 39, 68, 0.29), 0 44px 88px rgba(15, 39, 68, 0.25)',
    '0 92px 220px rgba(15, 39, 68, 0.30), 0 46px 92px rgba(15, 39, 68, 0.26)',
    '0 96px 230px rgba(15, 39, 68, 0.31), 0 48px 96px rgba(15, 39, 68, 0.27)',
    '0 100px 240px rgba(15, 39, 68, 0.32), 0 50px 100px rgba(15, 39, 68, 0.28)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          fontSize: '0.95rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: mode === 'dark' ? '0 4px 14px rgba(0, 102, 255, 0.4)' : '0 4px 14px rgba(0, 102, 255, 0.25)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark' ? '0 8px 25px rgba(0, 102, 255, 0.5)' : '0 8px 25px rgba(0, 102, 255, 0.35)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 39, 68, 0.06)',
          boxShadow: mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(15, 39, 68, 0.06)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          background: mode === 'dark' ? '#1f2937' : '#FFFFFF',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: mode === 'dark' ? '0 12px 40px rgba(0, 0, 0, 0.6)' : '0 12px 40px rgba(15, 39, 68, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
          background: mode === 'dark' ? '#1f2937' : '#FFFFFF',
        },
        outlined: {
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 39, 68, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.3s ease',
            '& fieldset': {
              borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 39, 68, 0.12)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 102, 255, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#0066FF',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 39, 68, 0.06)',
          background: mode === 'dark' ? '#111827' : '#FFFFFF',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: mode === 'dark' ? '#111827' : '#FFFFFF',
          color: mode === 'dark' ? '#f9fafb' : '#0F172A',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            background: mode === 'dark' ? 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)' : 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)',
          },
        },
      },
    },
  },
});

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));

export default { lightTheme, darkTheme, getDesignTokens };
