import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Typography, Paper, TextField, Button, Grid,
  Chip, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowBack, Lock as LockIcon, GetApp } from '@mui/icons-material';
import { createTransfer } from '../store/slices/transactionSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import { getCurrentUser } from '../store/slices/authSlice';
import api from '../services/api';
import PremiumCard from '../components/PremiumCard';
import PremiumButton from '../components/PremiumButton';
import PinVerifyModal from '../components/PinVerifyModal';

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
    routingNumber: '',
    transferType: 'online-banking',
    description: ''
  });

  useEffect(() => {
    if (accounts && accounts.length > 0 && !formData.fromAccount) {
      setFormData(prev => ({ ...prev, fromAccount: accounts[0]._id }));
    }
  }, [accounts, formData.fromAccount]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [myBeneficiaries, setMyBeneficiaries] = useState([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTransferData, setPendingTransferData] = useState(null);
  const [pinVerified, setPinVerified] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    const fetchMyBeneficiaries = async () => {
      if (!user) return;
      setBeneficiariesLoading(true);
      try {
        const response = await api.get('/beneficiaries');
        const beneficiaries = response.data?.data?.beneficiaries || [];
        if (isMounted) {
          setMyBeneficiaries(Array.isArray(beneficiaries) ? beneficiaries : []);
        }
      } catch (err) {
        console.error('Failed to load beneficiaries:', err);
        if (isMounted) setMyBeneficiaries([]);
      } finally {
        if (isMounted) setBeneficiariesLoading(false);
      }
    };
    fetchMyBeneficiaries();
    return () => { isMounted = false; };
  }, [user]);

  const handleBeneficiarySelect = (selected) => {
    if (!selected) return;
    setFormData((prev) => ({
      ...prev,
      beneficiaryName: selected.name || '',
      beneficiaryAccountNumber: selected.accountNumber || '',
      bankName: selected.bankName || '',
      routingNumber: selected.routingNumber || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTransferResult(null);

    if (!formData.fromAccount) {
      setError('Please select a source account');
      setLoading(false);
      return;
    }

    const transferData = {
      sourceAccountId: formData.fromAccount,
      recipientDetails: {
        name: formData.beneficiaryName,
        accountNumber: formData.beneficiaryAccountNumber,
        bankName: formData.bankName
      },
      amount: parseFloat(formData.amount),
      transferType: 'domestic',
      description: formData.description
    };

    if (user?.transactionPin && !pinVerified) {
      setPendingTransferData(transferData);
      setShowPinModal(true);
      setLoading(false);
      return;
    }

    try {
      const result = await dispatch(createTransfer(transferData)).unwrap();
      setTransferResult(result);
    } catch (err) {
      setError(err.message || err || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePinVerified = async () => {
    setPinVerified(true);
    setShowPinModal(false);
    setLoading(true);

    if (!pendingTransferData) return;

    try {
      const result = await dispatch(createTransfer(pendingTransferData)).unwrap();
      setTransferResult(result);
      setPendingTransferData(null);
    } catch (err) {
      setError(err.message || err || 'Transfer failed');
      setPinVerified(false);
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

  const downloadPaymentSlip = () => {
    if (!transferResult) return;
    const receipt = {
      transactionId: transferResult._id,
      date: new Date().toLocaleString(),
      amount: formData.amount,
      type: transferTypes.find(t => t.value === formData.transferType)?.label || formData.transferType,
      recipient: formData.beneficiaryName,
      accountNumber: formData.beneficiaryAccountNumber,
      bankName: formData.bankName,
      status: transferResult.status === 'completed' ? 'Completed' : 'Pending Approval'
    };

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Payment Slip - NorthCrest Bank</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .receipt { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 420px; width: 100%; text-align: center; }
    .logo { font-size: 20px; font-weight: 800; color: #0066FF; letter-spacing: 1px; margin-bottom: 4px; }
    .subtitle { font-size: 12px; color: #64748b; margin-bottom: 24px; }
    .divider { border: none; border-top: 2px dashed #e2e8f0; margin: 16px 0; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .label { color: #64748b; }
    .value { font-weight: 600; color: #0f2744; }
    .amount { font-size: 28px; font-weight: 800; color: #0066FF; margin: 16px 0; }
    .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-top: 8px; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .footer { margin-top: 24px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="logo">NORTHCREST BANK OF USA</div>
    <div class="subtitle">Payment Slip</div>
    <hr class="divider">
    <div class="row"><span class="label">Transaction ID</span><span class="value">${receipt.transactionId}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${receipt.date}</span></div>
    <hr class="divider">
    <div class="amount">$${parseFloat(receipt.amount).toLocaleString()}</div>
    <hr class="divider">
    <div class="row"><span class="label">Transfer Type</span><span class="value">${receipt.type}</span></div>
    <div class="row"><span class="label">Recipient</span><span class="value">${receipt.recipient}</span></div>
    <div class="row"><span class="label">Account Number</span><span class="value">${receipt.accountNumber}</span></div>
    <div class="row"><span class="label">Bank Name</span><span class="value">${receipt.bankName}</span></div>
    <div class="row"><span class="label">Status</span><span class="value">${receipt.status}</span></div>
    <hr class="divider">
    <div class="status ${receipt.status === 'Completed' ? 'status-completed' : 'status-pending'}">${receipt.status}</div>
    <div class="footer">Keep this slip for your records.</div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-slip-${receipt.transactionId || 'transfer'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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

            {transferResult && (
              <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  NORTHCREST BANK OF USA
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Payment Slip
                </Typography>
                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, p: 3, mb: 3, textAlign: 'left' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{transferResult._id}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" color="text.secondary">Date</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date().toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" color="text.secondary">Amount</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0066FF' }}>${parseFloat(formData.amount).toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" color="text.secondary">Transfer Type</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{transferTypes.find(t => t.value === formData.transferType)?.label || formData.transferType}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" color="text.secondary">Recipient</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.beneficiaryName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" color="text.secondary">Account Number</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.beneficiaryAccountNumber}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography variant="body2" color="text.secondary">Bank Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formData.bankName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: transferResult.status === 'completed' ? '#00C896' : '#f59e0b' }}>
                      {transferResult.status === 'completed' ? 'Completed' : 'Pending Approval'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}
            {transferResult && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<GetApp />}
                  onClick={downloadPaymentSlip}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                  }}
                >
                  Download Payment Slip
                </Button>
              </Box>
            )}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

             {!showPreview ? (
               <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true); }}>
                 <Grid container spacing={3}>
                   {/* From Account */}
                   <Grid item xs={12}>
                     <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>From Account</Typography>
                     <TextField
                       select
                       fullWidth
                       label="Select Source Account"
                       value={formData.fromAccount}
                       onChange={(e) => setFormData({ ...formData, fromAccount: e.target.value })}
                       error={!!error && !formData.fromAccount}
                       helperText={!formData.fromAccount ? 'Please select a source account' : ''}
                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                     >
                       {accounts?.map((account) => (
                         <MenuItem key={account._id} value={account._id}>
                           {account.nickname} - ${account.balance.toLocaleString()}
                         </MenuItem>
                       ))}
                     </TextField>
                   </Grid>

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
                    <FormControl fullWidth>
                      <InputLabel id="beneficiary-select-label">Select Beneficiary</InputLabel>
                      <Select
                        labelId="beneficiary-select-label"
                        value={selectedBeneficiary}
                        label="Select Beneficiary"
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedBeneficiary(id);
                          const found = Array.isArray(myBeneficiaries) ? myBeneficiaries.find((b) => b._id === id) : null;
                          if (found) {
                            setFormData((prev) => ({
                              ...prev,
                              beneficiaryName: found.name || '',
                              beneficiaryAccountNumber: found.accountNumber || '',
                              bankName: found.bankName || '',
                              routingNumber: found.routingNumber || ''
                            }));
                          }
                        }}
                      >
                        <MenuItem value=""><em>-- New Recipient --</em></MenuItem>
                        {Array.isArray(myBeneficiaries) && myBeneficiaries.map((b) => (
                          <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Account Holder Name"
                      name="beneficiaryName"
                      value={formData.beneficiaryName}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Account Number"
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Routing Number"
                      name="routingNumber"
                      value={formData.routingNumber}
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

      <PinVerifyModal
        open={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingTransferData(null);
        }}
        onVerified={handlePinVerified}
        title="Confirm Transaction"
        description="Enter your 4-digit PIN to authorize this transfer"
      />
    </Box>
  );
};

export default LocalTransfer;
