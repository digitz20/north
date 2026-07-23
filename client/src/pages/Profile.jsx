import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Grid, Avatar, Button, Divider, Chip, CircularProgress, Alert, TextField } from '@mui/material';
import { Camera } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, changePassword } from '../store/slices/authSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import CountUp from 'react-countup';
import api from '../services/api';
import { motion } from 'framer-motion';
import PremiumCard from '../components/PremiumCard';
import PremiumButton from '../components/PremiumButton';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  useEffect(() => {
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

  const createdBlobUrls = useRef([]);

  useEffect(() => {
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

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

      const base64Image = await fileToBase64(file);
      
      const response = await api.put('/auth/profile-picture', { profilePicture: base64Image });

      setUploadSuccess('Profile picture updated successfully!');
      dispatch(getCurrentUser());
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    try {
      setPasswordLoading(true);
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      setPasswordSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err || 'Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
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
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 2,
            mt: 4
          }}>My Profile</Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <PremiumCard sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                  <Avatar
                    sx={{ width: 120, height: 120, mx: 'auto', fontSize: 48, bgcolor: 'primary.main' }}
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
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleUploadClick}
                    disabled={uploading}
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      minWidth: 'auto',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      p: 0
                    }}
                  >
                    {uploading ? <CircularProgress size={20} /> : <Camera sx={{ fontSize: 18 }} />}
                  </Button>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{user.fullName}</Typography>
                <Chip label={user.isVerified ? 'Verified' : 'Unverified'} color={user.isVerified ? 'success' : 'warning'} sx={{ mt: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Customer ID: {user.customerId || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Member since: {formatMemberSince(user.createdAt)}
                </Typography>
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <PremiumButton variant="primary" onClick={handleUploadClick} disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                  </PremiumButton>
                  <PremiumButton variant="outline">Edit Profile</PremiumButton>
                </Box>
                {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
                {uploadSuccess && <Alert severity="success" sx={{ mt: 2 }}>{uploadSuccess}</Alert>}
              </PremiumCard>
            </Grid>

            <Grid item xs={12} md={8}>
              <PremiumCard title="Personal Information">
                <Grid container spacing={3}>
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

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Security</Typography>
                <Box component="form" onSubmit={handleChangePassword}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        size="small"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
                      <PremiumButton variant="primary" type="submit" disabled={passwordLoading}>
                        {passwordLoading ? <CircularProgress size={20} color="inherit" /> : 'Change Password'}
                      </PremiumButton>
                    </Grid>
                  </Grid>
                  {passwordError && <Alert severity="error" sx={{ mt: 2 }}>{passwordError}</Alert>}
                  {passwordSuccess && <Alert severity="success" sx={{ mt: 2 }}>{passwordSuccess}</Alert>}
                </Box>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Account Summary</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Accounts</Typography>
                      <Typography variant="h4">{totalAccounts}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 3, bgcolor: 'secondary.main', color: 'white', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Balance</Typography>
                      <Typography variant="h4">
                        <CountUp
                          start={0}
                          end={totalBalance}
                          duration={2.5}
                          prefix="$"
                          separator=","
                          decimals={2}
                        />
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </PremiumCard>
            </Grid>
          </Grid>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Profile;
