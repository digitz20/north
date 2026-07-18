import React from 'react';
import { Box, Typography, Paper, Button, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Transfer = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ 
      position: 'relative', 
      overflow: 'hidden', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)', 
      minHeight: '100vh', 
      p: { xs: 2, md: 0 } 
    }}>
      {/* Premium background effects */}
      <Box sx={{ 
        position: 'fixed', 
        top: '-5%', 
        right: '-10%', 
        width: '500px', 
        height: '500px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(0,200,150,0.1) 0%, rgba(0,200,150,0) 70%)', 
        filter: 'blur(60px)', 
        pointerEvents: 'none', 
        zIndex: 0 
      }} />
      <Box sx={{ 
        position: 'fixed', 
        bottom: '-10%', 
        left: '-5%', 
        width: '600px', 
        height: '600px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(0,102,255,0.08) 0%, rgba(0,102,255,0) 70%)', 
        filter: 'blur(70px)', 
        pointerEvents: 'none', 
        zIndex: 0 
      }} />
      
      <Box sx={{ position: 'relative', zIndex: 1, pt: 4, px: { xs: 2, md: 4 } }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            mb: 4, 
            gutterBottom: true 
          }}
        >
          Transfer
        </Typography>
        
        <Grid container spacing={4}>
          {/* Local Transfer Card */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Paper 
                sx={{ 
                  p: 5, 
                  height: '100%', 
                  borderRadius: 5, 
                  background: 'rgba(255,255,255,0.75)', 
                  backdropFilter: 'blur(30px)', 
                  border: '1px solid rgba(15,39,68,0.08)', 
                  boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease' 
                }}
                onClick={() => navigate('/transfer/local')}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h1" sx={{ mb: 3 }}>🏠</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#0f2744' }}>
                    Local Transfer
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Send money to any local bank account securely with our fast and reliable transfer system.
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', 
                      textTransform: 'none', 
                      fontWeight: 600, 
                      px: 4, 
                      py: 1.5 
                    }}
                  >
                    Start Local Transfer
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
          
          {/* International Transfer Card */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Paper 
                sx={{ 
                  p: 5, 
                  height: '100%', 
                  borderRadius: 5, 
                  background: 'rgba(255,255,255,0.75)', 
                  backdropFilter: 'blur(30px)', 
                  border: '1px solid rgba(15,39,68,0.08)', 
                  boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)', 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease' 
                }}
                onClick={() => navigate('/transfer/international')}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h1" sx={{ mb: 3 }}>🌍</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#0f2744' }}>
                    International Transfer
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Send funds globally with multiple transfer methods and competitive exchange rates.
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #00c896 0%, #33d8b0 100%)', 
                      textTransform: 'none', 
                      fontWeight: 600, 
                      px: 4, 
                      py: 1.5 
                    }}
                  >
                    Start International Transfer
                  </Button>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
        
        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Paper sx={{ 
            mt: 5, 
            p: 3, 
            borderRadius: 5, 
            background: 'rgba(0,102,255,0.05)', 
            border: '1px solid rgba(0,102,255,0.1)', 
            textAlign: 'center' 
          }}>
            <Typography variant="body2" color="text.secondary">
              🔒 Secure Transaction - All transfers are encrypted and processed securely. Never share your PIN with anyone.
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Transfer;