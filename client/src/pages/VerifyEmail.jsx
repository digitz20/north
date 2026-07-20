import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, TextField } from '@mui/material';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { verifyEmail } from '../store/slices/authSlice';
import { motion } from 'framer-motion';
import PremiumButton from '../components/PremiumButton';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState('');

  useEffect(() => {
    if (location.state?.otpId) {
      setOtpId(location.state.otpId);
    } else {
      const id = searchParams.get('otpId');
      if (id) setOtpId(id);
    }
  }, [searchParams, location]);

  const handleVerifyEmail = async () => {
    if (!otpId || !otpCode) {
      setError('Please enter your verification code');
      return;
    }
    try {
      setLoading(true);
      await dispatch(verifyEmail({ otpId, code: otpCode })).unwrap();
      setVerified(true);
    } catch (err) {
      setError(err.message || 'Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      p: { xs: 2, md: 0 }
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{ 
          p: { xs: 3, md: 5 }, 
          maxWidth: 500, 
          width: '100%', 
          textAlign: 'center',
          borderRadius: 3,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(15,39,68,0.08)',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)'
        }}>
          {verified ? (
            <>
              <Alert severity="success" sx={{ mb: 3 }}>
                Your email has been verified successfully!
              </Alert>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Your account is now fully activated. You can now log in to access all banking features.
              </Typography>
              <PremiumButton variant="primary" onClick={() => navigate('/login')}>
                Go to Login
              </PremiumButton>
            </>
          ) : (
            <>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
                Verify Your Email
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We sent a verification code to your email. Enter the 6-digit code below to verify your account.
              </Typography>
              
              {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
              
              {!otpId ? (
                <>
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    No verification session found. Please register first to receive a verification code.
                  </Alert>
                  <PremiumButton variant="primary" onClick={() => navigate('/register')}>
                    Back to Register
                  </PremiumButton>
                </>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="Verification Code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    sx={{ mb: 3 }}
                    inputProps={{ maxLength: 6 }}
                  />
                  <PremiumButton
                    variant="primary"
                    fullWidth
                    onClick={handleVerifyEmail}
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
                  </PremiumButton>
                </>
              )}
            </>
          )}
        </Paper>
      </motion.div>
    </Box>
  );
};

export default VerifyEmail;
