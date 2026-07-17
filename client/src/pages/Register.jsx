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
  Divider,
  MenuItem,
  InputAdornment,
  IconButton
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// List of all country codes with +1 (USA) as first/default
const countryCodes = [
  { code: '+1', country: 'United States' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+1', country: 'Canada' },
  { code: '+61', country: 'Australia' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+81', country: 'Japan' },
  { code: '+86', country: 'China' },
  { code: '+91', country: 'India' },
  { code: '+52', country: 'Mexico' },
  { code: '+55', country: 'Brazil' },
  { code: '+39', country: 'Italy' },
  { code: '+34', country: 'Spain' },
  { code: '+46', country: 'Sweden' },
  { code: '+47', country: 'Norway' },
  { code: '+45', country: 'Denmark' },
  { code: '+31', country: 'Netherlands' },
  { code: '+65', country: 'Singapore' },
  { code: '+852', country: 'Hong Kong' },
  { code: '+971', country: 'United Arab Emirates' },
  { code: '+27', country: 'South Africa' },
  { code: '+82', country: 'South Korea' },
  { code: '+64', country: 'New Zealand' },
  { code: '+41', country: 'Switzerland' },
  { code: '+43', country: 'Austria' },
  { code: '+32', country: 'Belgium' },
  { code: '+63', country: 'Philippines' },
  { code: '+66', country: 'Thailand' },
  { code: '+62', country: 'Indonesia' },
  { code: '+94', country: 'Sri Lanka' },
  { code: '+20', country: 'Egypt' },
  { code: '+972', country: 'Israel' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+57', country: 'Colombia' },
  { code: '+54', country: 'Argentina' },
  { code: '+56', country: 'Chile' },
  { code: '+51', country: 'Peru' },
  { code: '+48', country: 'Poland' },
  { code: '+420', country: 'Czech Republic' },
  { code: '+36', country: 'Hungary' },
  { code: '+30', country: 'Greece' },
  { code: '+351', country: 'Portugal' },
  { code: '+7', country: 'Russia' },
  { code: '+90', country: 'Turkey' },
  { code: '+234', country: 'Nigeria' },
  { code: '+254', country: 'Kenya' }
];

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
  const [countryCode, setCountryCode] = useState('+1'); // Default to USA (+1)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    
    // Validate form fields - prepend country code to phone number
    const fullPhone = `${countryCode} ${formData.phone}`;
    const { confirmPassword, phone, ...restFormData } = formData;
    const registerData = { ...restFormData, phone: fullPhone };
    
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TextField
                    select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    sx={{ minWidth: 120, '& .MuiInputBase-input': { py: 1 } }}
                    variant="standard"
                    size="small"
                  >
                    {countryCodes.map((country, index) => (
                      <MenuItem key={`${country.code}-${index}`} value={country.code}>
                        {country.code} ({country.country})
                      </MenuItem>
                    ))}
                  </TextField>
                </InputAdornment>
              )
            }}
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
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            error={!passwordIsValid && formData.password.length > 0}
            helperText={!passwordIsValid && formData.password.length > 0 ? "Password must be at least 8 characters" : ""}
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            error={!passwordsMatch && formData.confirmPassword.length > 0}
            helperText={!passwordsMatch && formData.confirmPassword.length > 0 ? "Passwords do not match" : ""}
            value={formData.confirmPassword}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
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

      {/* RESEND VERIFICATION EMAIL BUTTON - ALWAYS VISIBLE */}
      <Box sx={{ mt: 2, mb: 3, textAlign: 'center', p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 1 }}>
        <Typography variant="body2" color="text.primary">
          Haven't received your verification email?{' '}
          <Button
            size="small"
            onClick={handleResendVerification}
            disabled={resendLoading || !formData.email}
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
      
      {/* Also keep it in the post-registration message just in case */}
      {registrationSuccess && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            Your account has been created successfully! A verification email has been sent to your email address. Please verify your email to log in.
          </Alert>
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