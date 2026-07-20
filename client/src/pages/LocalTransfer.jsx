import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Typography, Paper, TextField, Button, Grid,
  Chip, Alert, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { createTransfer } from '../store/slices/transactionSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import { getCurrentUser } from '../store/slices/authSlice';
import PremiumCard from '../components/PremiumCard';
import PremiumButton from '../components/PremiumButton';

const LocalTransfer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const [formData, setFormData] = useState({
    fromAccount: '',
    amount: '',
    beneficiaryName: '',
    beneficiaryAccountNumber: '',
    bankName: '',
    transferType: 'online-banking',
    description: '',
    transactionPin: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
    dispatch(fetchAccounts());
  }, [dispatch, user, location.pathname]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuickAmount = (amount) => {
    setFormData({ ...formData, amount: amount.toString() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');
    setLoading(true);

    try {
      await dispatch(createTransfer({
        fromAccount: formData.fromAccount,
        toAccount: formData.beneficiaryAccountNumber,
        toAccountHolder: formData.beneficiaryName,
        amount: parseFloat(formData.amount),
        description: formData.description,
        transferType: formData.transferType
      })).unwrap();
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const transferTypes = [
    { value: 'online-banking', label: 'Online Banking' },
    { value: 'joint-account', label: 'Joint Account' },
    { value: 'checking', label: 'Checking' },
    { value: 'savings-account', label: 'Savings Account' }
  ];

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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <PremiumButton 
            variant="ghost"
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/transfer')}
          >
            Back
          </PremiumButton>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0,
            ml: 2
          }}>
            Dashboard / Local Transfer
          </Typography>
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <PremiumCard sx={{ 
            maxWidth: 900,
            mx: 'auto'
          }}>
            {/* Available Balance Card */}
            <Box sx={{ mb: 4, p: 3, borderRadius: 3, background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', color: 'white' }}>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 1 }}>Available Balance</Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>${totalBalance.toLocaleString()}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>Available for transfer</Typography>
            </Box>

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Transfer completed successfully! Redirecting to dashboard...
              </Alert>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {!showPreview ? (
              <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true); }}>
                <Grid container spacing={3}>
                  {/* Transfer Amount */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Transfer Amount</Typography>
                    <TextField
                      fullWidth
                      label="Enter Amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      type="number"
                      required
                      placeholder="$0.00"
                      InputProps={{
                        startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                      }}
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {[100, 500, 1000].map((amount) => (
                        <Chip 
                          key={amount}
                          label={`$${amount}`} 
                          onClick={() => handleQuickAmount(amount)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                      <Chip 
                        label="All" 
                        onClick={() => handleQuickAmount(totalBalance)}
                        sx={{ cursor: 'pointer' }}
                      />
                    </Box>
                  </Grid>

                  {/* Beneficiary Details */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>Beneficiary Details</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Beneficiary Account Name"
                      name="beneficiaryName"
                      value={formData.beneficiaryName}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Beneficiary Account Number"
                      name="beneficiaryAccountNumber"
                      value={formData.beneficiaryAccountNumber}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Bank Name"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      required
                    />
                  </Grid>

                  {/* Transfer Type */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>Transfer Type</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      {transferTypes.map((type) => (
                        <Chip
                          key={type.value}
                          label={type.label}
                          variant={formData.transferType === type.value ? 'filled' : 'outlined'}
                          onClick={() => setFormData({ ...formData, transferType: type.value })}
                          sx={{ 
                            p: 2, 
                            fontSize: '1rem',
                            justifyContent: 'center',
                            bgcolor: formData.transferType === type.value ? 'primary.main' : 'transparent',
                            color: formData.transferType === type.value ? 'white' : 'inherit'
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Additional Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, mt: 2 }}>Additional Information</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Description/Memo"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      multiline
                      rows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Transaction PIN"
                      name="transactionPin"
                      type="password"
                      value={formData.transactionPin}
                      onChange={handleChange}
                      required
                      helperText="This is your transaction PIN, not your login password"
                    />
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <PremiumButton variant="ghost" onClick={() => navigate('/transfer')}>
                        Back to Transfer
                      </PremiumButton>
                      <PremiumButton 
                        type="submit"
                        variant="primary"
                      >
                        Preview Transfer
                      </PremiumButton>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            ) : (
              /* Preview Section */
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Transfer Preview</Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Amount</Typography>
                    <Typography variant="h6">${parseFloat(formData.amount).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Beneficiary</Typography>
                    <Typography variant="h6">{formData.beneficiaryName}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Account Number</Typography>
                    <Typography variant="body1">{formData.beneficiaryAccountNumber}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Bank</Typography>
                    <Typography variant="body1">{formData.bankName}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Transfer Type</Typography>
                    <Typography variant="body1">{transferTypes.find(t => t.value === formData.transferType)?.label}</Typography>
                  </Grid>
                  {formData.description && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">Description</Typography>
                      <Typography variant="body1">{formData.description}</Typography>
                    </Grid>
                  )}
                </Grid>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                  <PremiumButton variant="ghost" onClick={() => setShowPreview(false)}>
                    Back to Edit
                  </PremiumButton>
                  <PremiumButton 
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Confirm & Send Transfer'}
                  </PremiumButton>
                </Box>
              </Box>
            )}

            {/* Security Notice */}
            <Paper sx={{ 
              mt: 4,
              p: 3, 
              borderRadius: 2,
              background: 'rgba(0,102,255,0.05)',
              border: '1px solid rgba(0,102,255,0.1)',
              textAlign: 'center'
            }}>
              <Typography variant="body2" color="text.secondary">
                Secure Transaction - All transfers are encrypted and processed securely. Your financial information is never stored on our servers.
              </Typography>
            </Paper>
          </PremiumCard>
        </motion.div>
      </Box>
    </Box>
  );
};

export default LocalTransfer;
