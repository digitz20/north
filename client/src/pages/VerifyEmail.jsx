import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, TextField } from '@mui/material';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { verifyEmail } from '../store/slices/authSlice';

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
    // Get otpId from location state (passed from register page)
    if (location.state?.otpId) {
      setOtpId(location.state.otpId);
    } else {
      // Fallback if no state - check URL params
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
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Paper sx={{ p: 4, maxWidth: 500, width: '100%', textAlign: 'center' }}>
        {verified ? (
          <>
            <Alert severity="success" sx={{ mb: 3 }}>
              Your email has been verified successfully!
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Your account is now fully activated. You can now log in to access all banking features.
            </Typography>
            <Button variant="contained" onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
              Verify Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We sent a verification code to your email. Enter the 6-digit code below to verify your account.
              <br /><br />
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 'bold' }}
              >
                Open Gmail to check your inbox →
              </a>
            </Typography>
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            {!otpId ? (
              <>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  No verification session found. Please register first to receive a verification code.
                </Alert>
                <Button variant="contained" onClick={() => navigate('/register')}>
                  Back to Register
                </Button>
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
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleVerifyEmail}
                  disabled={loading || otpCode.length !== 6}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify Email'}
                </Button>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyEmail;