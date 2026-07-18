import React, { useEffect } from 'react';
import { Box, Typography, Paper, Grid, Avatar, Button, Divider, Chip, CircularProgress, Alert } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getCurrentUser } from '../store/slices/authSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import CountUp from 'react-countup';

const Profile = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  
  useEffect(() => {
    // Always refetch fresh data when navigating to profile page
    dispatch(getCurrentUser());
    dispatch(fetchAccounts());
  }, [dispatch, location.pathname]);

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalAccounts = accounts.length;

  const formatMemberSince = (dateString) => {
    if (!dateString) return 'January 2025';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'JD';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (authLoading || accountsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box mt={4}>
        <Alert severity="error">Failed to load profile information</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Profile</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Avatar
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: 48 }}
            >
              {getInitials(user.name)}
            </Avatar>
            <Typography variant="h5">{user.name}</Typography>
            <Chip label={user.isVerified ? 'Verified' : 'Unverified'} color={user.isVerified ? 'success' : 'warning'} sx={{ mt: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Customer ID: {user.customerId || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member since: {formatMemberSince(user.createdAt)}
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
                <Typography variant="body1">{user.email}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Phone</Typography>
                <Typography variant="body1">{user.phone || 'Not provided'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Address</Typography>
                <Typography variant="body1">
                  {typeof user.address === 'string' ? user.address : 
                   user.address?.street ? `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.zipCode}` : 'Not provided'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>Account Summary</Typography>
            <Grid container spacing={3}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="body2">Total Accounts</Typography>
                  <Typography variant="h4">{totalAccounts}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                  <Typography variant="body2">Total Balance</Typography>
                  <Typography variant="h4">
                    <CountUp
                      start={0}
                      end={totalBalance}
                      duration={2}
                      prefix="$"
                      separator=","
                      decimals={2}
                    />
                  </Typography>
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