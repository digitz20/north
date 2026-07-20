import { createTheme } from '@mui/material/styles';

const premiumTheme = createTheme({
  palette: {
    mode: 'light',
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
      default: '#F8FAFC',
      paper: '#FFFFFF',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      disabled: '#94A3B8',
    },
    divider: 'rgba(15, 39, 68, 0.08)',
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
  shadows: [
    'none',
    '0 1px 3px rgba(15, 39, 68, 0.04), 0 1px 2px rgba(15, 39, 68, 0.02)',
    '0 4px 12px rgba(15, 39, 68, 0.06), 0 2px 4px rgba(15, 39, 68, 0.04)',
    '0 8px 24px rgba(15, 39, 68, 0.08), 0 4px 8px rgba(15, 39, 68, 0.04)',
    '0 12px 36px rgba(15, 39, 68, 0.1), 0 6px 12px rgba(15, 39, 68, 0.06)',
    '0 20px 48px rgba(15, 39, 68, 0.12), 0 10px 20px rgba(15, 39, 68, 0.08)',
    '0 28px 60px rgba(15, 39, 68, 0.14), 0 14px 28px rgba(15, 39, 68, 0.1)',
    '0 36px 72px rgba(15, 39, 68, 0.16), 0 18px 36px rgba(15, 39, 68, 0.12)',
    '0 44px 84px rgba(15, 39, 68, 0.18), 0 22px 44px rgba(15, 39, 68, 0.14)',
    '0 52px 96px rgba(15, 39, 68, 0.2), 0 26px 52px rgba(15, 39, 68, 0.16)',
    '0 60px 108px rgba(15, 39, 68, 0.22), 0 30px 60px rgba(15, 39, 68, 0.18)',
    '0 68px 120px rgba(15, 39, 68, 0.24), 0 34px 68px rgba(15, 39, 68, 0.2)',
    '0 76px 132px rgba(15, 39, 68, 0.26), 0 38px 76px rgba(15, 39, 68, 0.22)',
    '0 84px 144px rgba(15, 39, 68, 0.28), 0 42px 84px rgba(15, 39, 68, 0.24)',
    '0 92px 156px rgba(15, 39, 68, 0.3), 0 46px 92px rgba(15, 39, 68, 0.26)',
    '0 100px 168px rgba(15, 39, 68, 0.32), 0 50px 100px rgba(15, 39, 68, 0.28)',
    '0 108px 180px rgba(15, 39, 68, 0.34), 0 54px 108px rgba(15, 39, 68, 0.3)',
    '0 116px 192px rgba(15, 39, 68, 0.36), 0 58px 116px rgba(15, 39, 68, 0.32)',
    '0 124px 204px rgba(15, 39, 68, 0.38), 0 62px 124px rgba(15, 39, 68, 0.34)',
    '0 132px 216px rgba(15, 39, 68, 0.4), 0 66px 132px rgba(15, 39, 68, 0.36)',
    '0 140px 228px rgba(15, 39, 68, 0.42), 0 70px 140px rgba(15, 39, 68, 0.38)',
    '0 148px 240px rgba(15, 39, 68, 0.44), 0 74px 148px rgba(15, 39, 68, 0.4)',
    '0 156px 252px rgba(15, 39, 68, 0.46), 0 78px 156px rgba(15, 39, 68, 0.42)',
    '0 164px 264px rgba(15, 39, 68, 0.48), 0 82px 164px rgba(15, 39, 68, 0.44)',
    '0 172px 276px rgba(15, 39, 68, 0.5), 0 86px 172px rgba(15, 39, 68, 0.46)',
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
          boxShadow: '0 4px 14px rgba(0, 102, 255, 0.25)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 25px rgba(0, 102, 255, 0.35)',
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
          border: '1px solid rgba(15, 39, 68, 0.06)',
          boxShadow: '0 4px 20px rgba(15, 39, 68, 0.06)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(15, 39, 68, 0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: 'none',
        },
        outlined: {
          border: '1px solid rgba(15, 39, 68, 0.08)',
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
              borderColor: 'rgba(15, 39, 68, 0.12)',
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
          borderRight: '1px solid rgba(15, 39, 68, 0.06)',
        },
      },
    },
  },
});

export default premiumTheme;
