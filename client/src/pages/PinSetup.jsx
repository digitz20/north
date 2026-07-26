import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { setupTransactionPin, getPinStatus } from '../store/slices/authSlice';
import NorthCrestLogo from '../components/common/NorthCrestLogo';

const PinSetup = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading } = useSelector((state) => state.auth);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && !user.pinSetupRequired) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || !confirmPin) {
      setError('Please enter and confirm your PIN');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    try {
      await dispatch(setupTransactionPin({ pin, confirmPin })).unwrap();
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1500);
    } catch (err) {
      setError(err || 'Failed to setup PIN');
    }
  };

  if (loading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: 2 }}>
        <NorthCrestLogo variant="full" color="#0066FF" />
        <CircularProgress sx={{ color: '#0066FF' }} />
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
              Setup Transaction PIN
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Create a 4-digit PIN to secure your transactions
            </Typography>
          </Box>

          {success ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              PIN setup successful! Redirecting...
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Create 4-Digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputProps={{ maxLength: 4, pattern: '\\d*' }}
                type="password"
                required
                sx={{ mb: 3 }}
                autoFocus
              />

              <TextField
                fullWidth
                label="Confirm PIN"
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
                disabled={loading || pin.length !== 4 || confirmPin.length !== 4}
                sx={{ 
                  py: 1.5,
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Setup PIN'}
              </Button>
            </form>
          )}

          <Box sx={{ mt: 4, p: 2, bgcolor: 'rgba(0,102,255,0.05)', borderRadius: 2, border: '1px solid rgba(0,102,255,0.1)' }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Why do I need a PIN?</strong><br />
              Your transaction PIN adds an extra layer of security for all financial transactions including transfers, investments, and deposits.
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default PinSetup;
