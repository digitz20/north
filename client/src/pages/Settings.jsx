import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel, Divider, Alert } from '@mui/material';

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
            defaultValue="+1 (555) 123-4567"
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