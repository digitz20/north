import { useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useSelector } from 'react-redux';
import { lightTheme } from '../styles/theme';

const useDarkMode = () => {
  const { user } = useSelector((state) => state.auth);
  
  const theme = useMemo(() => {
    return lightTheme;
  }, []);

  return { darkMode: false, theme, toggleDarkMode: () => {} };
};

export const DynamicThemeProvider = ({ children }) => {
  const { theme } = useDarkMode();
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default useDarkMode;