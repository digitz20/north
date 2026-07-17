import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel, Divider, Alert, MenuItem, InputAdornment } from '@mui/material';

// Same country codes list, +1 default
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
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsAlerts: true,
    twoFactorAuth: false,
    monthlyStatements: true,
    darkMode: false
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting]
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Settings</Typography>

      {saved && <Alert severity="success" sx={{ mb: 3 }}>Settings saved successfully!</Alert>}

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>Account Settings</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Email Address"
            defaultValue="user@example.com"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Phone Number"
            defaultValue="(555) 123-4567"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TextField
                    select
                    defaultValue="+1"
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
    </Box>
  );
};

export default Settings;