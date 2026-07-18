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
      // Enhanced gradient background with multiple combined colors
      background: 'linear-gradient(135deg, #0c1445 0%, #1a237e 25%, #283593 50%, #303f9f 75%, #3949ab 100%)', 
      minHeight: '100vh', 
      p: { xs: 2, md: 0 } 
    }}>
      {/* Advanced multi-layered background textures and effects */}
      <Box sx={{ 
        position: 'fixed', 
        top: '-10%', 
        right: '-15%', 
        width: '700px', 
        height: '700px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(0,200,150,0.25) 0%, rgba(0,200,150,0) 70%)', 
        filter: 'blur(80px)', 
        pointerEvents: 'none', 
        zIndex: 0,
        animation: 'float 15s ease-in-out infinite'
      }} />
      <Box sx={{ 
        position: 'fixed', 
        bottom: '-15%', 
        left: '-10%', 
        width: '800px', 
        height: '800px', 
        borderRadius: '50%', 
        background: 'radial-gradient(circle, rgba(0,102,255,0.2) 0%, rgba(0,102,255,0) 70%)', 
        filter: 'blur(90px)', 
        pointerEvents: 'none', 
        zIndex: 0,
        animation: 'float 20s ease-in-out infinite reverse'
      }} />
      
      {/* Add floating animation keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }
      `}</style>
      
      <Box sx={{ position: 'relative', zIndex: 1, pt: 4, px: { xs: 2, md: 4 } }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(90deg, #ffffff 0%, #00c896 30%, #00bfff 70%, #ffc857 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent', 
            mb: 4, 
            gutterBottom: true,
            textShadow: '0 0 40px rgba(0,200,150,0.5)',
            fontSize: '2.5rem'
          }}
        >
          Transfer Money
        </Typography>
        
        <Grid container spacing={4}>
          {/* Local Transfer Card */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              <Paper 
                elevation={0}
                sx={{ 
                  p: 6, 
                  height: '100%', 
                  borderRadius: 2, 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,247,255,0.9) 100%)',
                  backdropFilter: 'blur(20px) saturate(120%)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 15px 50px -15px rgba(0,102,255,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(0,102,255,0.05) 0%, rgba(0,191,255,0.03) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'none'
                  },
                  '&:hover::before': {
                    opacity: 1
                  },
                  '&:hover': {
                    boxShadow: '0 25px 70px -15px rgba(0,102,255,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset'
                  }
                }}
                onClick={() => navigate('/transfer/local')}
              >
                <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <Typography variant="h1" sx={{ mb: 3, filter: 'drop-shadow(0 5px 15px rgba(0,102,255,0.3))' }}>🏠</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#0f2744', fontSize: '1.5rem' }}>
                    Local Transfer
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.05rem', lineHeight: 1.7 }}>
                    Send money to any local bank account securely with our fast and reliable transfer system.
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 50%, #00c896 100%)',
                      backgroundSize: '200% 200%',
                      backgroundPosition: '0% 50%',
                      textTransform: 'none', 
                      fontWeight: 700, 
                      px: 6, 
                      py: 1.8,
                      fontSize: '1.05rem',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0,102,255,0.4)',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        backgroundPosition: '100% 50%',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 20px 40px rgba(0,102,255,0.5)'
                      }
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
            >
              <Paper 
                elevation={0}
                sx={{ 
                  p: 6, 
                  height: '100%', 
                  borderRadius: 2, 
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,255,247,0.9) 100%)',
                  backdropFilter: 'blur(20px) saturate(120%)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 15px 50px -15px rgba(0,200,150,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(0,200,150,0.05) 0%, rgba(0,191,255,0.03) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: 'none'
                  },
                  '&:hover::before': {
                    opacity: 1
                  },
                  '&:hover': {
                    boxShadow: '0 25px 70px -15px rgba(0,200,150,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset'
                  }
                }}
                onClick={() => navigate('/transfer/international')}
              >
                <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <Typography variant="h1" sx={{ mb: 3, filter: 'drop-shadow(0 5px 15px rgba(0,200,150,0.3))' }}>🌍</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#0f2744', fontSize: '1.5rem' }}>
                    International Transfer
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.05rem', lineHeight: 1.7 }}>
                    Send funds globally with multiple transfer methods and competitive exchange rates.
                  </Typography>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #00c896 0%, #33d8b0 50%, #00BFFF 100%)',
                      backgroundSize: '200% 200%',
                      backgroundPosition: '0% 50%',
                      textTransform: 'none', 
                      fontWeight: 700, 
                      px: 6, 
                      py: 1.8,
                      fontSize: '1.05rem',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0,200,150,0.4)',
                      transition: 'all 0.4s ease',
                      '&:hover': {
                        backgroundPosition: '100% 50%',
                        transform: 'translateY(-3px)',
                        boxShadow: '0 20px 40px rgba(0,200,150,0.5)'
                      }
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
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Paper sx={{ 
            mt: 6, 
            p: 4, 
            borderRadius: 2, 
            background: 'linear-gradient(135deg, rgba(0,102,255,0.15) 0%, rgba(0,191,255,0.1) 100%)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(0,102,255,0.3)', 
            textAlign: 'center',
            boxShadow: '0 10px 40px -10px rgba(0,102,255,0.3)'
          }}>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '1.05rem' }}>
              🔒 Secure Transaction - All transfers are encrypted and processed securely. Never share your PIN with anyone.
            </Typography>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Transfer;