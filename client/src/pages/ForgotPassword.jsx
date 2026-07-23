import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { forgotPassword } from '../store/slices/authSlice';
import { motion } from 'framer-motion';
import PremiumButton from '../components/PremiumButton';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    if (!email) {
      setLocalError('Please enter your email address');
      return;
    }

    try {
      const result = await dispatch(forgotPassword(email)).unwrap();
      const otpId = result?.data?.otpId;
      if (otpId) {
        navigate('/reset-password', { state: { otpId, email } });
      } else {
        setSuccess(result?.message || 'If an account exists, a password reset link has been sent.');
      }
    } catch (err) {
      setLocalError(err || 'Something went wrong. Please try again.');
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
          maxWidth: 480, 
          width: '100%', 
          textAlign: 'center',
          borderRadius: 3,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(15,39,68,0.08)',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Forgot Password?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Enter the email associated with your account and we&apos;ll send you a link to reset your password.
          </Typography>

          {localError && <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>{localError}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} autoComplete="on">
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              sx={{ mb: 3 }}
            />
            <PremiumButton variant="primary" fullWidth type="submit">
              Send Reset Link
            </PremiumButton>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Remember your password?{' '}
              <Link to="/login" style={{ color: '#0066FF', textDecoration: 'none', fontWeight: 600 }}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ForgotPassword;
