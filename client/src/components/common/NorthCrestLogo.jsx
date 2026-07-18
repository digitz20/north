import React from 'react';
import { Box, Typography } from '@mui/material';
import { AccountBalance } from '@mui/icons-material';

const NorthCrestLogo = ({ variant = 'full', color = '#C1D72F' }) => {
  const isFull = variant === 'full';
  
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        justifyContent: 'center'
      }}
    >
      <AccountBalance
        sx={{
          fontSize: isFull ? 40 : 28,
          color: color === 'primary' ? '#C1D72F' : color
        }}
      />
      {isFull && (
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: color === 'primary' ? '#000000' : 'white', // Black text for primary color context (dashboard)
              lineHeight: 1.2
            }}
          >
            NorthCrest Bank
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: color === 'primary' ? '#2d2d2d' : '#e2e8f0', // Dark gray subtitle for better readability
              display: 'block'
            }}
          >
            of USA
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default NorthCrestLogo;