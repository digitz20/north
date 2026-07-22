import React from 'react';
import { Box, Typography } from '@mui/material';
import { AccountBalance } from '@mui/icons-material';

const NorthCrestLogo = ({ variant = 'full', color = '#C1D72F' }) => {
  const isFull = variant === 'full';
  const textColor = color === 'primary' || color === '#000000' || color === '#000' ? '#000000' : color;
  
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
              color: textColor,
              lineHeight: 1.2
            }}
          >
            NorthCrest Bank
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: textColor === '#000000' ? '#2d2d2d' : '#e2e8f0',
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