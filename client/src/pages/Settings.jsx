import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel, Divider, Alert, MenuItem, InputAdornment, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { getCurrentUser, updateSettings } from '../store/slices/authSlice';
import PremiumCard from '../components/PremiumCard';
import PremiumButton from '../components/PremiumButton';
import { Email, Phone, Notifications, Security, ToggleOn, ToggleOff } from '@mui/icons-material';

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
    emailNotifications: true,
    smsAlerts: true,
    twoFactorAuth: false,
    monthlyStatements: true
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    } else {
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
          monthlyStatements: user.settings.monthlyStatements ?? true
        });
      }
    }
  }, [dispatch, user, location.pathname]);

  const handleToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await dispatch(updateSettings({
        phone: `${formData.countryCode} ${formData.phone}`,
        settings
      })).unwrap();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
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
      minHeight: '100vh',
      p: { xs: 2, md: 0 },
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)'
    }}>
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
        zIndex: 0,
        display: { xs: 'none', md: 'block' }
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
        zIndex: 0,
        display: { xs: 'none', md: 'block' }
      }} />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt: 4 }}>
            <Box sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,102,255,0.3)'
            }}>
              <Security sx={{ fontSize: 28, color: 'white' }} />
            </Box>
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              color: '#0066FF',
              mb: 0
            }}>Settings</Typography>
          </Box>
        </motion.div>

        {saved && <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>Settings saved successfully!</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PremiumCard 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 2, 
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Email sx={{ fontSize: 20, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f2744' }}>Account Settings</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Update your account information</Typography>
                </Box>
              </Box>
            }
            sx={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,247,255,0.9) 100%)' }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1, 
                          background: 'rgba(0,102,255,0.1)',
                          color: '#0066FF',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          Locked
                        </Box>
                      </InputAdornment>
                    )
                  }}
                  sx={{ 
                    '& .MuiInputBase-input': { 
                      bgcolor: 'rgba(0,0,0,0.02)',
                      color: '#64748b',
                      fontWeight: 500
                    },
                    '& .MuiInputLabel-root': { color: '#64748b' }
                  }}
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
                        <Phone sx={{ color: '#0066FF', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <TextField
                          select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleInputChange}
                          sx={{ 
                            minWidth: 120, 
                            '& .MuiInputBase-input': { py: 1, fontSize: '0.875rem', fontWeight: 600, color: '#0066FF' },
                            '& .MuiSelect-select': { background: 'rgba(0,102,255,0.05)', borderRadius: 1 }
                          }}
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
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <PremiumCard 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 2, 
                  background: 'linear-gradient(135deg, #FFC857 0%, #ffda77 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Notifications sx={{ fontSize: 20, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f2744' }}>Notifications</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Manage how you receive notifications</Typography>
                </Box>
              </Box>
            }
            sx={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,250,240,0.9) 100%)' }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(0,102,255,0.03)',
                  border: '1px solid rgba(0,102,255,0.08)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Email sx={{ color: '#0066FF', fontSize: 24 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f2744' }}>Email Notifications</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Receive updates via email</Typography>
                    </Box>
                  </Box>
                  <Switch 
                    checked={settings.emailNotifications} 
                    onChange={() => handleToggle('emailNotifications')}
                    sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': { 
                        color: '#0066FF',
                        '&:hover': { backgroundColor: 'rgba(0,102,255,0.08)' }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { 
                        backgroundColor: '#0066FF' 
                      }
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(0,200,150,0.03)',
                  border: '1px solid rgba(0,200,150,0.08)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Phone sx={{ color: '#00C896', fontSize: 24 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f2744' }}>SMS Alerts</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Receive updates via SMS</Typography>
                    </Box>
                  </Box>
                  <Switch 
                    checked={settings.smsAlerts} 
                    onChange={() => handleToggle('smsAlerts')}
                    sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': { 
                        color: '#00C896',
                        '&:hover': { backgroundColor: 'rgba(0,200,150,0.08)' }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { 
                        backgroundColor: '#00C896' 
                      }
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(255,200,87,0.03)',
                  border: '1px solid rgba(255,200,87,0.08)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Notifications sx={{ color: '#FFC857', fontSize: 24 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f2744' }}>Receive Monthly Statements</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Get monthly account statements</Typography>
                    </Box>
                  </Box>
                  <Switch 
                    checked={settings.monthlyStatements} 
                    onChange={() => handleToggle('monthlyStatements')}
                    sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': { 
                        color: '#FFC857',
                        '&:hover': { backgroundColor: 'rgba(255,200,87,0.08)' }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { 
                        backgroundColor: '#FFC857' 
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <PremiumCard 
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 2, 
                  background: 'linear-gradient(135deg, #00C896 0%, #33d8b0 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Security sx={{ fontSize: 20, color: 'white' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f2744' }}>Security</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>Manage your account security settings</Typography>
                </Box>
              </Box>
            }
            sx={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,255,247,0.9) 100%)' }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  p: 2,
                  borderRadius: 2,
                  background: 'rgba(255,107,107,0.03)',
                  border: '1px solid rgba(255,107,107,0.08)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Security sx={{ color: '#FF6B6B', fontSize: 24 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#0f2744' }}>Two-Factor Authentication</Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Add an extra layer of security</Typography>
                    </Box>
                  </Box>
                  <Switch 
                    checked={settings.twoFactorAuth} 
                    onChange={() => handleToggle('twoFactorAuth')}
                    sx={{ 
                      '& .MuiSwitch-switchBase.Mui-checked': { 
                        color: '#FF6B6B',
                        '&:hover': { backgroundColor: 'rgba(255,107,107,0.08)' }
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { 
                        backgroundColor: '#FF6B6B' 
                      }
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </PremiumCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <PremiumButton
              variant="primary"
              size="large"
              onClick={handleSave}
              loading={saving}
            >
              Save Changes
            </PremiumButton>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Settings;
