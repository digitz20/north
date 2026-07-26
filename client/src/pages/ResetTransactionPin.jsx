import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box, Typography, Paper, TextField, Button, Alert, CircularProgress
} from '@mui/material';
import { resetTransactionPin } from '../store/slices/authSlice';
import NorthCrestLogo from '../components/common/NorthCrestLogo';

const ResetTransactionPin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((state) => state.auth);
  const token = searchParams.get('token');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setSubmitError('Invalid or missing reset token. Please request a new PIN reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!token) {
      setSubmitError('Invalid or missing reset token. Please request a new PIN reset.');
      return;
    }

    if (!newPin || !confirmPin) {
      setSubmitError('Please enter and confirm your new PIN');
      return;
    }

    if (newPin !== confirmPin) {
      setSubmitError('PINs do not match');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setSubmitError('PIN must be exactly 4 digits');
      return;
    }

    try {
      await dispatch(resetTransactionPin({ token, newPin, confirmNewPin: confirmPin })).unwrap();
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setSubmitError(err || 'Failed to reset PIN. The link may have expired.');
    }
  };

  if (!token) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)',
        p: 2
      }}>
        <Paper sx={{ 
          maxWidth: 450,
          width: '100%',
          p: 5,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 25px 80px -20px rgba(0,0,0,0.4)',
          textAlign: 'center'
        }}>
          <NorthCrestLogo variant="full" color="#0066FF" />
          <Typography variant="h5" sx={{ mt: 3, mb: 2, color: '#dc2626', fontWeight: 700 }}>
            Invalid Reset Link
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This password reset link is invalid or has expired. Please request a new PIN reset.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/forgot-pin')}
            sx={{ 
              py: 1.5,
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              fontSize: '1rem',
              fontWeight: 600
            }}
          >
            Request New Reset Link
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)',
      p: 2
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Paper sx={{ 
          maxWidth: 450,
          width: '100%',
          p: 5,
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(30px)',
          boxShadow: '0 25px 80px -20px rgba(0,0,0,0.4)'
        }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <NorthCrestLogo variant="full" color="#0066FF" />
            <Typography variant="h4" sx={{ mt: 2, fontWeight: 700, color: '#0f2744' }}>
              Set New Transaction PIN
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Enter your new 4-digit transaction PIN below
            </Typography>
          </Box>

          {submitSuccess ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your transaction PIN has been successfully reset. Redirecting to login...
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              {(submitError || error) && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {submitError || error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="New 4-Digit PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputProps={{ maxLength: 4, pattern: '\\d*' }}
                type="password"
                required
                sx={{ mb: 3 }}
                autoFocus
              />

              <TextField
                fullWidth
                label="Confirm New PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputProps={{ maxLength: 4, pattern: '\\d*' }}
                type="password"
                required
                sx={{ mb: 4 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
                sx={{ 
                  py: 1.5,
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Reset PIN'}
              </Button>
            </form>
          )}

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="text"
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none' }}
            >
              Back to Login
            </Button>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ResetTransactionPin;
