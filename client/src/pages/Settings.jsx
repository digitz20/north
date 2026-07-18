import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel, Divider, Alert, MenuItem, InputAdornment, CircularProgress } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getCurrentUser } from '../store/slices/authSlice';
import { motion } from 'framer-motion';

// Same country codes list
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

const Settings = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    countryCode: '+1'
  });
  
  const [settings, setSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications ?? true,
    smsAlerts: user?.settings?.smsAlerts ?? true,
    twoFactorAuth: user?.settings?.twoFactorAuth ?? false,
    monthlyStatements: user?.settings?.monthlyStatements ?? true,
    darkMode: user?.settings?.darkMode ?? false
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    } else {
      // Populate form data with real user information
      const userPhone = user.phone || '';
      const phoneMatch = userPhone.match(/^(\+\d+)\s*(.*)$/);
      
      setFormData({
        email: user.email || '',
        phone: phoneMatch ? phoneMatch[2] : userPhone.replace(/^\+\d+\s*/, ''),
        countryCode: phoneMatch ? phoneMatch[1] : (user.phone ? user.phone.split(' ')[0] : '+1')
      });
      
      if (user.settings) {
        setSettings({
          emailNotifications: user.settings.emailNotifications ?? true,
          smsAlerts: user.settings.smsAlerts ?? true,
          twoFactorAuth: user.settings.twoFactorAuth ?? false,
          monthlyStatements: user.settings.monthlyStatements ?? true,
          darkMode: user.settings.darkMode ?? false
        });
      }
    }
  }, [dispatch, user, location.pathname]);

  const handleToggle = (setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      minHeight: '100vh',
      p: { xs: 2, md: 0 }
    }}>
      {/* Premium ambient background effects */}
      <Box sx={{
        position: 'fixed',
        top: '-5%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,150,0.1) 0%, rgba(0,200,150,0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'fixed',
        bottom: '-10%',
        left: '-5%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,102,255,0.08) 0%, rgba(0,102,255,0) 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700, 
          background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1,
          gutterBottom: true
        }}>Settings</Typography>

        {saved && <Alert severity="success" sx={{ mb: 3 }}>Settings saved successfully!</Alert>}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper sx={{ 
            p: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(15,39,68,0.08)',
            boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)'
          }}>
            <Typography variant="h6" gutterBottom>Account Settings</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email Address"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TextField
                      select
                      name="countryCode"
                      value={formData.countryCode}
                      onChange={handleInputChange}
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
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>Notifications</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={settings.emailNotifications} onChange={() => handleToggle('emailNotifications')} />}
              label="Email Notifications"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={settings.smsAlerts} onChange={() => handleToggle('smsAlerts')} />}
              label="SMS Alerts"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={settings.monthlyStatements} onChange={() => handleToggle('monthlyStatements')} />}
              label="Receive Monthly Statements"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>Security</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={settings.twoFactorAuth} onChange={() => handleToggle('twoFactorAuth')} />}
              label="Two-Factor Authentication"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>Preferences</Typography>
        <Grid item xs={12}>
          <FormControlLabel
            control={<Switch checked={settings.darkMode} onChange={() => handleToggle('darkMode')} />}
            label="Dark Mode"
          />
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Button variant="contained" size="large" onClick={handleSave}>Save Changes</Button>
        </Box>
        </Paper>
      </motion.div>
    </Box>
  </Box>
  );
};

export default Settings;