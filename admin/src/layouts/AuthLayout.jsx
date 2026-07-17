import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import logo from '../assets/images/logo.svg';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Box sx={{ mb: 4 }}>
        <img src={logo} alt="NORTHCREST Bank" style={{ height: 32, width: 'auto', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
      </Box>
      <Outlet />
    </Box>
  );
};

export default AuthLayout;