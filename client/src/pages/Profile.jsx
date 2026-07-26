import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Paper, Grid, Avatar, Button, Divider, Chip, CircularProgress, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Camera } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, changePassword, setupTransactionPin, changeTransactionPin, forgotTransactionPin } from '../store/slices/authSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import CountUp from 'react-countup';
import api from '../services/api';
import { motion } from 'framer-motion';
import PremiumCard from '../components/PremiumCard';
import PremiumButton from '../components/PremiumButton';
import NorthCrestLogo from '../components/common/NorthCrestLogo';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [showForgotPin, setShowForgotPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSsn, setForgotSsn] = useState('');
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
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err || 'Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTogglePasswordForm = () => {
    setShowPasswordForm((prev) => !prev);
    setPasswordError('');
    setPasswordSuccess('');
    if (showPasswordForm) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSetupPin = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!newPin || !confirmNewPin) {
      setPinError('Please enter and confirm your PIN');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinError('PINs do not match');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }

    try {
      setPinLoading(true);
      await dispatch(setupTransactionPin({ pin: newPin, confirmPin: confirmNewPin })).unwrap();
      setPinSuccess('Transaction PIN setup successfully!');
      setShowPinForm(false);
      setNewPin('');
      setConfirmNewPin('');
      dispatch(getCurrentUser());
      setTimeout(() => setPinSuccess(''), 3000);
    } catch (err) {
      setPinError(err || 'Failed to setup PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!currentPin || !newPin || !confirmNewPin) {
      setPinError('All fields are required');
      return;
    }
    if (newPin !== confirmNewPin) {
      setPinError('New PINs do not match');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }

    try {
      setPinLoading(true);
      await dispatch(changeTransactionPin({ currentPin, newPin, confirmNewPin })).unwrap();
      setPinSuccess('Transaction PIN changed successfully!');
      setShowPinForm(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      setTimeout(() => setPinSuccess(''), 3000);
    } catch (err) {
      setPinError(err || 'Failed to change PIN');
    } finally {
      setPinLoading(false);
    }
  };

  const handleForgotPin = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!forgotEmail || !forgotSsn) {
      setPinError('Please provide your email and last 4 digits of SSN');
      return;
    }

    try {
      setPinLoading(true);
      await dispatch(forgotTransactionPin({ email: forgotEmail, ssnLastFour: forgotSsn })).unwrap();
      setPinSuccess('A PIN reset link has been sent to your email. Please check your inbox and click the link to set a new PIN.');
      setShowForgotPin(false);
      setForgotEmail('');
      setForgotSsn('');
      dispatch(getCurrentUser());
      setTimeout(() => setPinSuccess(''), 5000);
    } catch (err) {
      setPinError(err || 'Failed to reset PIN. Please verify your information.');
    } finally {
      setPinLoading(false);
    }
  };

  if (authLoading || accountsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', flexDirection: 'column', gap: 2 }}>
        <NorthCrestLogo variant="full" color="#0066FF" />
        <CircularProgress sx={{ color: '#0066FF' }} />
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
      minHeight: '100vh',
      p: { xs: 2, md: 0 },
      background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'
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
            color: '#0066FF',
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
                {!showPasswordForm ? (
                  <Button variant="outlined" onClick={handleTogglePasswordForm} sx={{ mt: 1 }}>
                    Change Password
                  </Button>
                ) : (
                  <Box component="form" onSubmit={handleChangePassword}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Old Password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
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
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <PremiumButton variant="primary" type="submit" disabled={passwordLoading}>
                            {passwordLoading ? <CircularProgress size={20} color="inherit" /> : 'Continue'}
                          </PremiumButton>
                          <Button variant="text" onClick={handleTogglePasswordForm} disabled={passwordLoading}>
                            Cancel
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                    {passwordError && <Alert severity="error" sx={{ mt: 2 }}>{passwordError}</Alert>}
                    {passwordSuccess && <Alert severity="success" sx={{ mt: 2 }}>{passwordSuccess}</Alert>}
                  </Box>
                )}

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Transaction PIN</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your 4-digit PIN is required for all financial transactions
                </Typography>
                
                {!showPinForm ? (
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button variant="outlined" onClick={() => setShowPinForm(true)}>
                      {user?.transactionPin ? 'Change PIN' : 'Setup PIN'}
                    </Button>
                    {user?.transactionPin && (
                      <Button variant="text" color="error" onClick={() => setShowForgotPin(true)}>
                        Forgot PIN?
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box component="form" onSubmit={user?.transactionPin ? handleChangePin : handleSetupPin}>
                    <Grid container spacing={2}>
                      {user?.transactionPin && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Current PIN"
                            value={currentPin}
                            onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            inputProps={{ maxLength: 4, pattern: '\\d*' }}
                            type="password"
                            size="small"
                            required
                          />
                        </Grid>
                      )}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={user?.transactionPin ? 'New PIN' : 'Create 4-Digit PIN'}
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          inputProps={{ maxLength: 4, pattern: '\\d*' }}
                          type="password"
                          size="small"
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm PIN"
                          value={confirmNewPin}
                          onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          inputProps={{ maxLength: 4, pattern: '\\d*' }}
                          type="password"
                          size="small"
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                          <PremiumButton variant="primary" type="submit" disabled={pinLoading}>
                            {pinLoading ? <CircularProgress size={20} color="inherit" /> : (user?.transactionPin ? 'Update PIN' : 'Setup PIN')}
                          </PremiumButton>
                          <Button variant="text" onClick={() => {
                            setShowPinForm(false);
                            setCurrentPin('');
                            setNewPin('');
                            setConfirmNewPin('');
                            setPinError('');
                          }} disabled={pinLoading}>
                            Cancel
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                    {pinError && <Alert severity="error" sx={{ mt: 2 }}>{pinError}</Alert>}
                    {pinSuccess && <Alert severity="success" sx={{ mt: 2 }}>{pinSuccess}</Alert>}
                  </Box>
                )}

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Account Summary</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 3, bgcolor: 'primary.light', color: 'white', borderRadius: 5 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Accounts</Typography>
                      <Typography variant="h4">{totalAccounts}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 3, bgcolor: 'secondary.main', color: 'white', borderRadius: 5 }}>
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

      {/* Forgot PIN Dialog */}
      <Dialog open={showForgotPin} onClose={() => setShowForgotPin(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', color: 'white' }}>
          Reset Transaction PIN
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Verify your identity by providing the last 4 digits of your SSN. A secure reset link will be sent to your email, where you can set a new transaction PIN.
          </Typography>
          <Box component="form" onSubmit={handleForgotPin}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Last 4 Digits of SSN"
                  value={forgotSsn}
                  onChange={(e) => setForgotSsn(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputProps={{ maxLength: 4, pattern: '\\d*' }}
                  required
                  size="small"
                  type="password"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <PremiumButton variant="primary" type="submit" disabled={pinLoading}>
                    {pinLoading ? <CircularProgress size={20} color="inherit" /> : 'Reset PIN'}
                  </PremiumButton>
                  <Button variant="text" onClick={() => {
                    setShowForgotPin(false);
                    setForgotEmail('');
                    setForgotSsn('');
                    setPinError('');
                  }} disabled={pinLoading}>
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
            {pinError && <Alert severity="error" sx={{ mt: 2 }}>{pinError}</Alert>}
            {pinSuccess && <Alert severity="success" sx={{ mt: 2 }}>{pinSuccess}</Alert>}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Profile;
