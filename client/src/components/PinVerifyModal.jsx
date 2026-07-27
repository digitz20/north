import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Paper, TextField, Button, Alert, CircularProgress, IconButton
} from '@mui/material';
import { Close as CloseIcon, Lock as LockIcon } from '@mui/icons-material';
import { verifyTransactionPin } from '../store/slices/authSlice';

const PinVerifyModal = ({ open, onClose, onVerified, title = 'Enter Transaction PIN', description = 'Please enter your 4-digit PIN to confirm this transaction' }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (open) {
      setPin('');
      setError('');
      setAttempts(0);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || pin.length !== 4) {
      setError('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      await dispatch(verifyTransactionPin(pin)).unwrap();
      onVerified?.();
      onClose?.();
    } catch (err) {
      setError(err || 'Invalid PIN');
      setAttempts(prev => prev + 1);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose?.();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Paper sx={{ 
              maxWidth: 420,
              width: '90vw',
              p: 4,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.98)',
              boxShadow: '0 25px 80px -20px rgba(0,0,0,0.5)',
              position: 'relative'
            }}>
              <IconButton
                onClick={onClose}
                sx={{ 
                  position: 'absolute', 
                  right: 8, 
                  top: 8,
                  color: '#666'
                }}
              >
                <CloseIcon />
              </IconButton>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ 
                  width: 64, 
                  height: 64, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <LockIcon sx={{ fontSize: 32, color: 'white' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f2744', mb: 1 }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {description}
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                  {attempts >= 3 && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Too many failed attempts may lock your PIN temporarily.
                    </Typography>
                  )}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Transaction PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputProps={{ maxLength: 4, pattern: '\\d*' }}
                  type="password"
                  required
                  sx={{ mb: 3 }}
                  autoFocus
                  error={pin.length === 4 && attempts > 0}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || pin.length !== 4}
                  sx={{ 
                    py: 1.5,
                    background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Confirm PIN'}
                </Button>
              </form>

              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Forgot PIN?{' '}
                  <Button
                    size="small"
                    onClick={() => navigate('/profile')}
                    sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                  >
                    Reset in Profile
                  </Button>
                </Typography>
              </Box>
            </Paper>
          </motion.div>
        </Box>
      )}
    </AnimatePresence>
  );
};

export default PinVerifyModal;
