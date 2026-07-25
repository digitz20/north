import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import NorthCrestLogo from './NorthCrestLogo';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'
      }}
    >
      <NorthCrestLogo variant="full" color="#0066FF" />
      <CircularProgress size={40} sx={{ color: '#0066FF' }} />
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default Loading;
