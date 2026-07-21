import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NorthCrestLogo from '../components/common/NorthCrestLogo';
import { Box } from '@mui/material';

export const useNavigationWithSplash = () => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWithSplash = (path) => {
    setIsNavigating(true);
    
    setTimeout(() => {
      navigate(path);
      setIsNavigating(false);
    }, 80);
  };

  const NavigationSplash = () => {
    if (!isNavigating) return null;
    
    return (
      <Box 
        sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <NorthCrestLogo />
      </Box>
    );
  };

  return { navigateWithSplash, NavigationSplash };
};

export default useNavigationWithSplash;
