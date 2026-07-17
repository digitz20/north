import React from 'react';
import { Box, Typography, Paper, Grid, Avatar, Button, Divider, Chip } from '@mui/material';
import { useSelector } from 'react-redux';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);

  const userDetails = {
    name: user?.name || 'John Doe',
    email: user?.email || 'john@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, New York, NY 10001',
    memberSince: 'January 2025',
    accountStatus: 'Verified',
    customerId: 'NCB-123456789'
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Profile</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: 48 }}
            >
              JD
            </Avatar>
            <Typography variant="h5">{userDetails.name}</Typography>
            <Chip label={userDetails.accountStatus} color="success" sx={{ mt: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Customer ID: {userDetails.customerId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member since: {userDetails.memberSince}
            </Typography>
            <Button variant="outlined" sx={{ mt: 3 }}>Edit Profile</Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>Contact Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Email</Typography>
                <Typography variant="body1">{userDetails.email}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{userDetails.phone}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">{userDetails.address}</Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>Account Summary</Typography>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="body2">Total Accounts</Typography>
                  <Typography variant="h4">3</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="body2">Total Balance</Typography>
                  <Typography variant="h4">$24,500</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;