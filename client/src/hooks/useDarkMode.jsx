import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser } from '../store/slices/authSlice';
import { darkTheme, lightTheme } from '../styles/theme';

const useDarkMode = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : user?.settings?.darkMode || false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (user?.settings?.darkMode !== undefined) {
      setDarkMode(user.settings.darkMode);
    }
  }, [user?.settings?.darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const theme = useMemo(() => {
    return darkMode ? darkTheme : lightTheme;
  }, [darkMode]);

  return { darkMode, theme, toggleDarkMode };
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