import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Grid, Avatar, Button, Divider, Chip, CircularProgress, Alert } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getCurrentUser } from '../store/slices/authSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import CountUp from 'react-countup';
import api from '../services/api';
import { motion } from 'framer-motion';

const Profile = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef(null);
  
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

  // Track created blob URLs to prevent memory leaks
  const createdBlobUrls = useRef([]);

  useEffect(() => {
    // Cleanup function to revoke all created blob URLs when component unmounts
    return () => {
      createdBlobUrls.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn('Cleanup: Could not revoke profile photo blob URL:', e);
        }
      });
    };
  }, []);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset status messages
    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      // Convert file to base64 to persist it properly in the database
      // This prevents blob URL ERR_FILE_NOT_FOUND errors when navigating/refreshing
      const reader = new FileReader();
      
      const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

      const base64Image = await fileToBase64(file);
      
      // Send base64 image to our backend API - this persists permanently
      const response = await api.put('/auth/profile-picture', { profilePicture: base64Image });

      setUploadSuccess('Profile picture updated successfully!');
      dispatch(getCurrentUser()); // Refresh user data
    } catch (error) {
      console.error('Profile picture upload error:', error);
      setUploadError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
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
        }}>My Profile</Typography>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ 
                p: 4, 
                textAlign: 'center',
                borderRadius: 5,
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(15,39,68,0.08)',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)'
              }}>
            <Avatar
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: 48, bgcolor: 'primary.main' }}
              src={user?.profilePicture || ''}
            >
              {getInitials(user.fullName)}
            </Avatar>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <Typography variant="h5">{user.fullName}</Typography>
            <Chip label={user.isVerified ? 'Verified' : 'Unverified'} color={user.isVerified ? 'success' : 'warning'} sx={{ mt: 1 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Customer ID: {user.customerId || 'N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member since: {formatMemberSince(user.createdAt)}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleUploadClick}
                disabled={uploading}
                sx={{ mr: 1 }}
              >
                {uploading ? <CircularProgress size={24} /> : 'Upload Photo'}
              </Button>
              <Button variant="outlined" sx={{ mt: 2 }}>Edit Profile</Button>
            </Box>
            {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
            {uploadSuccess && <Alert severity="success" sx={{ mt: 2 }}>{uploadSuccess}</Alert>}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
              <Paper sx={{ 
                p: 4,
                borderRadius: 5,
                background: 'rgba(255,255,255,0.75)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(15,39,68,0.08)',
                boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
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
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <Typography variant="body2">Total Accounts</Typography>
                  <Typography variant="h4">{totalAccounts}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Profile;