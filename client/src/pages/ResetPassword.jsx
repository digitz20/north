import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { resetPassword } from '../store/slices/authSlice';
import { motion } from 'framer-motion';
import PremiumButton from '../components/PremiumButton';

const ResetPassword = () => {
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const otpId = location.state?.otpId || '';

  useEffect(() => {
    if (!otpId) {
      setLocalError('Invalid or expired reset session. Please request a new reset link.');
    }
  }, [otpId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    if (!otpId) {
      setLocalError('Invalid reset session. Please start again.');
      return;
    }
    if (!otpCode || otpCode.length < 6) {
      setLocalError('Please enter the 6-digit code sent to your email');
      return;
    }
    if (!newPassword) {
      setLocalError('Please enter a new password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await dispatch(resetPassword({ otpId, code: otpCode, newPassword })).unwrap();
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setLocalError(err || 'Failed to reset password. Please try again.');
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
            Reset Password
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Enter the 6-digit code sent to your email and your new password.
          </Typography>

          {localError && <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>{localError}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit} autoComplete="on">
            <TextField
              fullWidth
              label="Verification Code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              sx={{ mb: 2 }}
              inputProps={{ maxLength: 6 }}
            />
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              sx={{ mb: 3 }}
            />
            <PremiumButton variant="primary" fullWidth type="submit">
              Reset Password
            </PremiumButton>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Didn&apos;t receive the code?{' '}
              <Link to="/forgot-password" style={{ color: '#0066FF', textDecoration: 'none', fontWeight: 600 }}>
                Try again
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ResetPassword;
