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
  IconButton,
  Link as MuiLink,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import NorthCrestLogo from '../components/common/NorthCrestLogo';
import PhoneFrame from '../components/common/PhoneFrame';

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
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [countryCode, setCountryCode] = useState('+1');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);

  const handleResendVerification = async () => {
    if (!formData.email) return;
    setResendLoading(true);
    setResendSuccess('');
    setResendError('');
    try {
      await dispatch(resendVerificationEmail(formData.email)).unwrap();
      setResendSuccess('Verification email has been resent! Please check your inbox.');
    } catch (err) {
      setResendError(err.message || 'Failed to resend verification email');
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
    
    if (formData.password !== formData.confirmPassword) return;
    
    const fullPhone = `${countryCode} ${formData.phone}`;
    const { confirmPassword, phone, street, city, state, zipCode, country, ...restFormData } = formData;
    const address = { street, city, state, zipCode, country };
    const registerData = { ...restFormData, phone: fullPhone, address };
    
    dispatch(register(registerData)).unwrap()
      .then((result) => {
        if (result?.data?.otpId) {
          navigate('/verify-email', { state: { otpId: result.data.otpId } });
        }
      })
      .catch(() => {
        // Error handled by redux
      });
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const hasUppercase = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(formData.password);
  const passwordIsValid = formData.password.length >= 8 && hasUppercase && hasNumber && hasSpecialChar;

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
              Create Your Account
            </Typography>
            <Typography variant="body2" sx={{ color: '#8e8e93' }}>
              Get started with NorthCrest Bank in minutes
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="firstName"
                  label="First Name"
                  id="register-firstName"
                  autoComplete="given-name"
                  placeholder="John"
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
                  id="register-lastName"
                  autoComplete="family-name"
                  placeholder="Doe"
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
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
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
                  id="register-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="555-123-4567"
                  value={formData.phone}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TextField
                          select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          sx={{ minWidth: 130, '& .MuiInputBase-input': { py: 1, fontSize: '0.9rem' } }}
                          variant="standard"
                          size="small"
                          displayEmpty
                          inputProps={{ 'aria-label': 'country code' }}
                        >
                          {countryCodes.map((country, index) => (
                            <MenuItem key={`${country.code}-${index}`} value={country.code}>
                              {country.code} ({country.country})
                            </MenuItem>
                          ))}
                        </TextField>
                      </InputAdornment>
                    ),
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
                  id="register-dateOfBirth"
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="street"
                  label="Street Address"
                  id="register-street"
                  autoComplete="street-address"
                  placeholder="123 Main Street"
                  value={formData.street}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="city"
                  label="City"
                  id="register-city"
                  autoComplete="address-level2"
                  placeholder="New York"
                  value={formData.city}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="state"
                  label="State/Province"
                  id="register-state"
                  autoComplete="address-level1"
                  placeholder="NY"
                  value={formData.state}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="zipCode"
                  label="Zip/Postal Code"
                  id="register-zipCode"
                  autoComplete="postal-code"
                  placeholder="10001"
                  value={formData.zipCode}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="country"
                  label="Country"
                  id="register-country"
                  autoComplete="country"
                  placeholder="United States"
                  value={formData.country}
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
                  id="register-password"
                  autoComplete="new-password"
                  placeholder="Enter a strong password"
                  error={!passwordIsValid && formData.password.length > 0}
                  value={formData.password}
                  onChange={handleChange}
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
                />
                {formData.password.length > 0 && (
                  <Box mt={1.5} display="flex" gap={2} flexWrap="wrap">
                    {[
                      { valid: formData.password.length >= 8, text: '8+ characters' },
                      { valid: hasUppercase, text: 'Uppercase' },
                      { valid: hasNumber, text: 'Number' },
                      { valid: hasSpecialChar, text: 'Special char' },
                    ].map((req, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          background: req.valid ? 'rgba(0, 200, 150, 0.08)' : 'rgba(255, 107, 107, 0.08)',
                        }}
                      >
                        <Box
                          sx={{
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            background: req.valid ? '#00C896' : '#FF6B6B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CheckCircle sx={{ fontSize: 12, color: 'white' }} />
                        </Box>
                        <Typography variant="caption" sx={{ color: req.valid ? '#009B70' : '#E55A5A', fontWeight: 500 }}>
                          {req.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="register-confirmPassword"
                  placeholder="Re-enter your password"
                  error={!passwordsMatch && formData.confirmPassword.length > 0}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: '#8e8e93' }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {!passwordsMatch && formData.confirmPassword.length > 0 && (
                  <Typography variant="caption" sx={{ color: '#E55A5A', mt: 0.5, ml: 1 }}>
                    Passwords do not match
                  </Typography>
                )}
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !passwordsMatch || !passwordIsValid}
              sx={{
                mt: 4,
                mb: 2,
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
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </Box>

          <Box sx={{ mt: 2, p: 2.5, borderRadius: 2, background: 'rgba(0, 102, 255, 0.04)', border: '1px solid rgba(0, 102, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: '#3a3a3c', textAlign: 'center', fontSize: '0.85rem' }}>
              Haven't received your verification email?{' '}
              <Button
                size="small"
                onClick={handleResendVerification}
                disabled={resendLoading || !formData.email}
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

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#8e8e93' }}>
              Already have an account?{' '}
              <MuiLink
                href="/login"
                sx={{
                  color: '#0066FF',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Sign in
              </MuiLink>
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }}>
            <Typography variant="caption" sx={{ color: '#8e8e93', fontWeight: 500, px: 2, fontSize: '0.75rem' }}>
              FDIC INSURED
            </Typography>
          </Divider>

          <Typography variant="caption" display="block" sx={{ textAlign: 'center', color: '#8e8e93', fontSize: '0.75rem' }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy.
            Your information is secure and protected.
          </Typography>
        </PhoneFrame>
      </motion.div>
    </Box>
  );
};

export default Register;
