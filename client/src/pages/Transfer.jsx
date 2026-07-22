import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PremiumCard from '../components/PremiumCard';
import PremiumButton from '../components/PremiumButton';

const Transfer = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ 
      position: 'relative', 
      overflow: 'hidden', 
      background: 'linear-gradient(135deg, #0c1445 0%, #1a237e 25%, #283593 50%, #303f9f 75%, #3949ab 100%)', 
      minHeight: '100vh', 
      p: { xs: 2, md: 0 } 
    }}>
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
        animation: 'float 15s ease-in-out infinite',
        display: { xs: 'none', md: 'block' }
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
          animation: 'float 20s ease-in-out infinite reverse',
          display: { xs: 'none', md: 'block' }
        }} />
       
       <Box sx={{ position: 'relative', zIndex: 1, pt: 4, px: { xs: 2, md: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(90deg, #ffffff 0%, #00c896 30%, #00bfff 70%, #ffc857 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent', 
              mb: 4,
            }}
          >
            Transfer Money
          </Typography>
        </motion.div>
        
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
              <PremiumCard
                onClick={() => navigate('/transfer/local')}
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,247,255,0.9) 100%)',
                  backdropFilter: 'blur(20px) saturate(120%)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 15px 50px -15px rgba(0,102,255,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                  '&:hover': {
                    boxShadow: '0 25px 70px -15px rgba(0,102,255,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h1" sx={{ mb: 3, fontSize: '3rem' }}>🏠</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#0f2744', fontSize: '1.5rem' }}>
                    Local Transfer
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.05rem', lineHeight: 1.7 }}>
                    Send money to any local bank account securely with our fast and reliable transfer system.
                  </Typography>
                  <PremiumButton 
                    variant="primary"
                    size="large"
                    sx={{ px: 6, py: 1.8, fontSize: '1.05rem', borderRadius: '16px' }}
                  >
                    Start Local Transfer
                  </PremiumButton>
                </Box>
              </PremiumCard>
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
              <PremiumCard
                onClick={() => navigate('/transfer/international')}
                sx={{ 
                  height: '100%', 
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,255,247,0.9) 100%)',
                  backdropFilter: 'blur(20px) saturate(120%)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: '0 15px 50px -15px rgba(0,200,150,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset',
                  '&:hover': {
                    boxShadow: '0 25px 70px -15px rgba(0,200,150,0.5), 0 0 0 1px rgba(255,255,255,0.2) inset'
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h1" sx={{ mb: 3, fontSize: '3rem' }}>🌍</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, color: '#0f2744', fontSize: '1.5rem' }}>
                    International Transfer
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 5, fontSize: '1.05rem', lineHeight: 1.7 }}>
                    Send funds globally with multiple transfer methods and competitive exchange rates.
                  </Typography>
                  <PremiumButton 
                    variant="secondary"
                    size="large"
                    sx={{ px: 6, py: 1.8, fontSize: '1.05rem', borderRadius: '16px' }}
                  >
                    Start International Transfer
                  </PremiumButton>
                </Box>
              </PremiumCard>
            </motion.div>
          </Grid>
        </Grid>
        
        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <PremiumCard sx={{ 
            mt: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(0,102,255,0.15) 0%, rgba(0,191,255,0.1) 100%)',
            border: '1px solid rgba(0,102,255,0.3)', 
          }}>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, fontSize: '1.05rem' }}>
              Secure Transaction - All transfers are encrypted and processed securely. Never share your PIN with anyone.
            </Typography>
          </PremiumCard>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Transfer;
