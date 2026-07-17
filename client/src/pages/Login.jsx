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
  Divider
} from '@mui/material';
import { Lock, Person } from '@mui/icons-material';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleResendVerification = async () => {
    if (!email) {
      return;
    }
    setResendLoading(true);
    setResendSuccess('');
    try {
      await dispatch(resendVerificationEmail(email)).unwrap();
      setResendSuccess('Verification email has been resent! Please check your inbox.');
    } catch (err) {
      // Error is handled by redux
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, redirectTo, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      dispatch(login({ email, password }));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3, textAlign: 'center', fontWeight: 600 }}>
        Sign In to Your Account
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
          startAdornment: <Person color="action" sx={{ mr: 1 }} />
        }}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        InputProps={{
          startAdornment: <Lock color="action" sx={{ mr: 1 }} />
        }}
      />
      
      <FormControlLabel
        control={
          <Checkbox 
            value="remember" 
            color="primary" 
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
        }
        label="Remember me"
        sx={{ mt: 1 }}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
      </Button>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="primary">
            Forgot password?
          </Typography>
        </Link>
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="primary">
            Don't have an account? Sign Up
          </Typography>
        </Link>
      </Box>

      {/* RESEND VERIFICATION EMAIL BUTTON - ALWAYS VISIBLE */}
      <Box sx={{ mt: 3, mb: 3, textAlign: 'center', p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1 }}>
        <Typography variant="body2" color="text.primary">
          Haven't received your verification email?{' '}
          <Button
            size="small"
            onClick={handleResendVerification}
            disabled={resendLoading || !email}
            sx={{ textTransform: 'none', p: 0, minWidth: 'auto', fontWeight: 'bold', color: '#1976d2' }}
          >
            {resendLoading ? <CircularProgress size={16} color="inherit" /> : 'Resend it'}
          </Button>
        </Typography>
        {resendSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {resendSuccess}
          </Alert>
        )}
      </Box>
      
      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">Secure Banking</Typography>
      </Divider>
      
      <Typography variant="caption" display="block" sx={{ textAlign: 'center', color: 'text.secondary' }}>
        This is a secure, encrypted connection. All data is protected.
      </Typography>
    </Box>
  );
};

export default Login;