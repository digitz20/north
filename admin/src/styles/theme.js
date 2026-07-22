import { createTheme } from '@mui/material/styles';

const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a1a2e',
      light: '#2d2d44',
      dark: '#0f0f1a',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0066FF',
      light: '#4D94FF',
      dark: '#0047B3',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F1F5F9',
      paper: '#FFFFFF',
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
    h1: { fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, lineHeight: 1.2 },
    h2: { fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: 'clamp(1.25rem, 2vw, 1.75rem)', fontWeight: 700, lineHeight: 1.4 },
    h4: { fontSize: 'clamp(1.1rem, 1.5vw, 1.35rem)', fontWeight: 600, lineHeight: 1.5 },
    h5: { fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    body1: { fontSize: '0.95rem', lineHeight: 1.7 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { fontWeight: 600, letterSpacing: '0.01em' },
  },
  shape: { borderRadius: 10 },
  shadows: [
    'none',
    '0 1px 3px rgba(15, 39, 68, 0.04), 0 1px 2px rgba(15, 39, 68, 0.02)',
    '0 4px 12px rgba(15, 39, 68, 0.06), 0 2px 4px rgba(15, 39, 68, 0.04)',
    '0 8px 24px rgba(15, 39, 68, 0.08), 0 4px 8px rgba(15, 39, 68, 0.04)',
    '0 12px 36px rgba(15, 39, 68, 0.1), 0 6px 12px rgba(15, 39, 68, 0.06)',
    '0 20px 48px rgba(15, 39, 68, 0.12), 0 10px 20px rgba(15, 39, 68, 0.08)',
    '0 25px 50px rgba(15, 39, 68, 0.14), 0 12px 24px rgba(15, 39, 68, 0.1)',
    '0 30px 60px rgba(15, 39, 68, 0.16), 0 14px 28px rgba(15, 39, 68, 0.12)',
    '0 35px 70px rgba(15, 39, 68, 0.18), 0 16px 32px rgba(15, 39, 68, 0.14)',
    '0 40px 80px rgba(15, 39, 68, 0.2), 0 18px 36px rgba(15, 39, 68, 0.16)',
    '0 45px 90px rgba(15, 39, 68, 0.22), 0 20px 40px rgba(15, 39, 68, 0.18)',
    '0 50px 100px rgba(15, 39, 68, 0.24), 0 22px 44px rgba(15, 39, 68, 0.2)',
    '0 55px 110px rgba(15, 39, 68, 0.26), 0 24px 48px rgba(15, 39, 68, 0.22)',
    '0 60px 120px rgba(15, 39, 68, 0.28), 0 26px 52px rgba(15, 39, 68, 0.24)',
    '0 65px 130px rgba(15, 39, 68, 0.3), 0 28px 56px rgba(15, 39, 68, 0.26)',
    '0 70px 140px rgba(15, 39, 68, 0.32), 0 30px 60px rgba(15, 39, 68, 0.28)',
    '0 75px 150px rgba(15, 39, 68, 0.34), 0 32px 64px rgba(15, 39, 68, 0.3)',
    '0 80px 160px rgba(15, 39, 68, 0.36), 0 34px 68px rgba(15, 39, 68, 0.32)',
    '0 85px 170px rgba(15, 39, 68, 0.38), 0 36px 72px rgba(15, 39, 68, 0.34)',
    '0 90px 180px rgba(15, 39, 68, 0.4), 0 38px 76px rgba(15, 39, 68, 0.36)',
    '0 95px 190px rgba(15, 39, 68, 0.42), 0 40px 80px rgba(15, 39, 68, 0.38)',
    '0 100px 200px rgba(15, 39, 68, 0.44), 0 42px 84px rgba(15, 39, 68, 0.4)',
    '0 105px 210px rgba(15, 39, 68, 0.46), 0 44px 88px rgba(15, 39, 68, 0.42)',
    '0 110px 220px rgba(15, 39, 68, 0.48), 0 46px 92px rgba(15, 39, 68, 0.44)',
    '0 115px 230px rgba(15, 39, 68, 0.5), 0 48px 96px rgba(15, 39, 68, 0.46)',
    '0 120px 240px rgba(15, 39, 68, 0.52), 0 50px 100px rgba(15, 39, 68, 0.48)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 20px',
          fontSize: '0.9rem',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 8px rgba(0, 102, 255, 0.2)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 16px rgba(0, 102, 255, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(15, 39, 68, 0.06)',
          boxShadow: '0 2px 12px rgba(15, 39, 68, 0.04)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(15, 39, 68, 0.08)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(15, 39, 68, 0.06)',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          color: '#64748B',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
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

export default adminTheme;
