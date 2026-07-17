import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError, resendVerificationEmail } from '../store/slices/authSlice';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Divider
} from '@mui/material';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    address: ''
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);

  const handleResendVerification = async () => {
    if (!formData.email) {
      return;
    }
    setResendLoading(true);
    setResendSuccess('');
    try {
      await dispatch(resendVerificationEmail(formData.email)).unwrap();
      setResendSuccess('Verification email has been resent! Please check your inbox.');
    } catch (err) {
      // Error is handled by redux
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    return () => {
      dispatch(clearError());
    };
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Password validation
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    
    // Validate form fields
    const { confirmPassword, ...registerData } = formData;
    dispatch(register(registerData)).then((result) => {
      // If registration is successful, navigate to verify email page
      if (result.payload?.otpId) {
        navigate('/verify-email', { state: { otpId: result.payload.otpId } });
      }
    }).catch(() => {
      // Error handled by redux
    });
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const passwordIsValid = formData.password.length >= 8;

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2, textAlign: 'center', fontWeight: 600 }}>
        Open Your Account
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
        Join NorthCrest Bank and start managing your finances with confidence
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="firstName"
            label="First Name"
            id="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="lastName"
            label="Last Name"
            id="lastName"
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="email"
            label="Email Address"
            id="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="phone"
            label="Phone Number"
            id="phone"
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="dateOfBirth"
            label="Date of Birth"
            type="date"
            id="dateOfBirth"
            InputLabelProps={{ shrink: true }}
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="address"
            label="Street Address"
            id="address"
            autoComplete="street-address"
            value={formData.address}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            error={!passwordIsValid && formData.password.length > 0}
            helperText={!passwordIsValid && formData.password.length > 0 ? "Password must be at least 8 characters" : ""}
            value={formData.password}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            error={!passwordsMatch && formData.confirmPassword.length > 0}
            helperText={!passwordsMatch && formData.confirmPassword.length > 0 ? "Passwords do not match" : ""}
            value={formData.confirmPassword}
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading || !passwordsMatch || !passwordIsValid}
        sx={{ mt: 3, mb: 2, py: 1.5, fontSize: '1rem' }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
      </Button>

      {/* Post-registration verification message */}
      {registrationSuccess && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your account has been created successfully! A verification email has been sent to your email address. Please verify your email to log in.
          </Alert>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Haven't received your verification email?{' '}
            <Button
              size="small"
              onClick={handleResendVerification}
              disabled={resendLoading}
              sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
            >
              {resendLoading ? <CircularProgress size={16} /> : 'Resend it'}
            </Button>
          </Typography>
          {resendSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {resendSuccess}
            </Alert>
          )}
        </Box>
      )}
      
      <Box sx={{ textAlign: 'center' }}>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Typography variant="body2" color="primary">
            Already have an account? Sign in
          </Typography>
        </Link>
      </Box>
      
      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.secondary">FDIC Insured</Typography>
      </Divider>
      
      <Typography variant="caption" display="block" sx={{ textAlign: 'center', color: 'text.secondary' }}>
        By creating an account, you agree to our Terms of Service and Privacy Policy.
        Your information is secure and protected.
      </Typography>
    </Box>
  );
};

export default Register;