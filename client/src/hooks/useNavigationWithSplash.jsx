import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NorthCrestLogo from '../components/common/NorthCrestLogo';
import { Box, keyframes } from '@mui/material';

// Define the fade in and out animation
const splashAnimation = keyframes`
  0% { 
    opacity: 0; 
    transform: scale(0.8);
  }
  15% { 
    opacity: 1; 
    transform: scale(1);
  }
  85% { 
    opacity: 1; 
    transform: scale(1);
  }
  100% { 
    opacity: 0; 
    transform: scale(1.1);
  }
`;

// Custom hook to handle navigation with logo splash screen
export const useNavigationWithSplash = () => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateWithSplash = (path) => {
    setIsNavigating(true);
    
    // Navigate after short splash animation
    setTimeout(() => {
      navigate(path);
      setIsNavigating(false);
    }, 400);
  };

  // Splash screen component to render when navigating
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
          background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #3182ce 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
        }}
      >
        <Box
          sx={{
            animation: `${splashAnimation} 3s ease-in-out forwards`,
          }}
        >
          <NorthCrestLogo />
        </Box>
      </Box>
    );
  };

  return { navigateWithSplash, NavigationSplash };
};