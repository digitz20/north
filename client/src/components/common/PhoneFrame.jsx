import React from 'react';
import { Box } from '@mui/material';

const PhoneFrame = ({ children }) => {
  return (
    <Box
      sx={{
        width: { xs: '100%', sm: 390 },
        maxWidth: 390,
        mx: 'auto',
        bgcolor: '#1c1c1e',
        borderRadius: 4,
        p: { xs: 1, sm: 2.5 },
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.08)',
      }}
    >
      <Box
        sx={{
          bgcolor: '#f2f2f7',
          borderRadius: 3.5,
          overflow: 'hidden',
          position: 'relative',
          minHeight: { xs: 600, sm: 720 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 100,
            height: 28,
            bgcolor: '#000000',
            borderRadius: 20,
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />

        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: 3,
            pt: 3.5,
            pb: 2,
            '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {children}
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 1.5,
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 5,
              bgcolor: 'rgba(0, 0, 0, 0.18)',
              borderRadius: 3,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default PhoneFrame;
