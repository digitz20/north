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
  Link as MuiLink
} from '@mui/material';
import { Lock, Person, Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import NorthCrestLogo from '../components/common/NorthCrestLogo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  
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
    try {
      await dispatch(resendVerificationEmail(email)).unwrap();
      setResendSuccess('Verification email has been resent! Please check your inbox.');
    } catch (err) {
      // Error handled by redux
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
    <Box sx={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {/* Right side - Login form */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6, md: 8 },
          background: '#F8FAFC',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Box sx={{ mb: 6, textAlign: 'center' }}>
              <Box sx={{ mb: 3, display: { xs: 'block', md: 'none' } }}>
                <NorthCrestLogo />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
                Sign in
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748B' }}>
                Welcome back to NorthCrest Bank
              </Typography>
            </Box>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              </motion.div>
            )}
            
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        background: 'rgba(0, 102, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Person sx={{ color: '#0066FF', fontSize: 20 }} />
                      </Box>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        background: 'rgba(0, 102, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Lock sx={{ color: '#0066FF', fontSize: 20 }} />
                      </Box>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#64748B' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      value="remember" 
                      sx={{
                        color: '#CBD5E1',
                        '&.Mui-checked': { color: '#0066FF' },
                      }}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
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
                  borderRadius: 2,
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

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Don't have an account?{' '}
                <MuiLink
                  href="/register"
                  sx={{
                    color: '#0066FF',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Open an account
                </MuiLink>
              </Typography>
            </Box>

            {/* RESEND VERIFICATION EMAIL BUTTON */}
            <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, background: 'rgba(0, 102, 255, 0.04)', border: '1px solid rgba(0, 102, 255, 0.08)' }}>
              <Typography variant="body2" sx={{ color: '#475569', textAlign: 'center' }}>
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
                <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                  {resendSuccess}
                </Alert>
              )}
            </Box>
            
            <Divider sx={{ my: 4 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, px: 2 }}>
                SECURE BANKING
              </Typography>
            </Divider>
            
            <Typography variant="caption" display="block" sx={{ textAlign: 'center', color: '#94A3B8' }}>
              Protected by 256-bit SSL encryption. Your data is secure.
            </Typography>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
