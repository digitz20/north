import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Box, Container, Paper, IconButton, Tooltip, AppBar, Toolbar } from '@mui/material';
import { ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon, Home as HomeIcon } from '@mui/icons-material';
import NorthCrestLogo from '../components/common/NorthCrestLogo';
import { useNavigationWithSplash } from '../hooks/useNavigationWithSplash';

const AuthLayout = () => {
  const navigate = useNavigate();
  const { navigateWithSplash, NavigationSplash } = useNavigationWithSplash();
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #3182ce 100%)',
      }}
    >
      {/* Add navigation controls to AuthLayout */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Back">
              <IconButton onClick={() => navigate(-1)} sx={{ color: 'white', mr: 1 }}>
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Forward">
              <IconButton onClick={() => navigate(1)} sx={{ color: 'white', mr: 1 }}>
                <ArrowForwardIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Go to main landing page">
               <IconButton onClick={() => navigateWithSplash('/')} sx={{ color: 'white' }}>
                 <HomeIcon />
               </IconButton>
             </Tooltip>
           </Box>
         </Toolbar>
       </AppBar>
       
       {/* Navigation splash screen */}
       <NavigationSplash />
      
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          pt: 8,
          pb: 4
        }}
      >
        <Container maxWidth="sm">
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <NorthCrestLogo />
          </Box>
          <Paper elevation={6} sx={{ p: 4, borderRadius: 2 }}>
            <Outlet />
          </Paper>
          <Box sx={{ mt: 4, textAlign: 'center', color: 'white' }}>
            <p>© 2026 NorthCrest Bank of USA. All rights reserved.</p>
            <p>FDIC Insured | Equal Housing Lender</p>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default AuthLayout;