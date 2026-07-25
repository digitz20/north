import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import NorthCrestLogo from './common/NorthCrestLogo';

const LoadingSpinner = ({ size = 40, fullPage = false, message = 'Loading...' }) => {
  if (fullPage) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
          gap: 3,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'
        }}
      >
        <NorthCrestLogo variant="full" color="#0066FF" />
        <CircularProgress size={size} sx={{ color: '#0066FF' }} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, mt: 1 }}>
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 3
      }}
    >
      <CircularProgress size={size} />
    </Box>
  );
};

export default LoadingSpinner;
