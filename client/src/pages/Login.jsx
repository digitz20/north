import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError, resendVerificationEmail } from '../store/slices/authSlice';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
  InputAdornment,
  Link as MuiLink,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import NorthCrestLogo from '../components/common/NorthCrestLogo';
import PhoneFrame from '../components/common/PhoneFrame';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedRememberMe && savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleResendVerification = async () => {
    if (!email) return;
    setResendLoading(true);
    setResendSuccess('');
    setResendError('');
    try {
      await dispatch(resendVerificationEmail(email)).unwrap();
      setResendSuccess('Verification email has been resent! Please check your inbox.');
    } catch (err) {
      setResendError(err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, redirectTo, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedPassword', password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
        localStorage.setItem('rememberMe', 'false');
      }
      dispatch(login({ email, password }));
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: '100%'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <PhoneFrame>
          <Box sx={{ mt: 6, textAlign: 'center', mb: 2.5 }}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
              <NorthCrestLogo />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#000000', mb: 0.5 }}>
              Sign In
            </Typography>
            <Typography variant="body2" sx={{ color: '#8e8e93' }}>
              Welcome back to NorthCrest Bank
            </Typography>
          </Box>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.85rem' }}>
                {error}
              </Alert>
            </motion.div>
          )}

          <Box component="form" onSubmit={handleSubmit} autoComplete="on">
            <Box sx={{ bgcolor: '#ffffff', borderRadius: 3, overflow: 'hidden', border: '1px solid #e5e5ea', display: 'flex', flexDirection: 'column', py: 3 }}>
              <TextField
                required
                fullWidth
                id="login-email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  '& .MuiInputBase-root': { bgcolor: 'transparent' },
                  '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                }}
              />
              <Divider sx={{ borderColor: '#e5e5ea', margin: 0 }} />
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#8e8e93' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiInputBase-root': { bgcolor: 'transparent' },
                  mt: 3,
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, px: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    value="remember" 
                    sx={{
                      color: '#c7c7cc',
                      '&.Mui-checked': { color: '#0066FF' },
                      py: 0.5,
                    }}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: '#3a3a3c' }}>
                    Remember me
                  </Typography>
                }
              />
              <MuiLink
                href="/forgot-password"
                variant="body2"
                sx={{
                  color: '#0066FF',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Forgot password?
              </MuiLink>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)',
                  boxShadow: '0 12px 32px rgba(0, 102, 255, 0.45)',
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  opacity: 0.7,
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 3.5, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#8e8e93' }}>
              Don't have an account?{' '}
              <MuiLink
                href="/register"
                sx={{
                  color: '#0066FF',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Open an account
              </MuiLink>
            </Typography>
          </Box>

          <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, background: 'rgba(0, 102, 255, 0.04)', border: '1px solid rgba(0, 102, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: '#3a3a3c', textAlign: 'center', fontSize: '0.85rem' }}>
              Haven't received your verification email?{' '}
              <Button
                size="small"
                onClick={handleResendVerification}
                disabled={resendLoading || !email}
                sx={{
                  textTransform: 'none',
                  p: 0,
                  minWidth: 'auto',
                  fontWeight: 600,
                  color: '#0066FF',
                  '&:hover': { background: 'transparent' },
                }}
              >
                {resendLoading ? <CircularProgress size={16} color="inherit" /> : 'Resend it'}
              </Button>
            </Typography>
            {resendSuccess && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2, fontSize: '0.85rem' }}>
                {resendSuccess}
              </Alert>
            )}
            {resendError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2, fontSize: '0.85rem' }}>
                {resendError}
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="caption" sx={{ color: '#8e8e93', fontWeight: 500, px: 2, fontSize: '0.75rem' }}>
              SECURE BANKING
            </Typography>
          </Divider>

          <Typography variant="caption" display="block" sx={{ textAlign: 'center', color: '#8e8e93', fontSize: '0.75rem' }}>
            Protected by 256-bit SSL encryption. Your data is secure.
          </Typography>
        </PhoneFrame>
      </motion.div>
    </Box>
  );
};

export default Login;
