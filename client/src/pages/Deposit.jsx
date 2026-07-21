import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, Alert,
  MenuItem, Chip, CircularProgress, Stepper, Step, StepLabel, Card,
  CardContent, Avatar, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions
} from '@mui/material';
import {
  CurrencyBitcoin, QrCode, Email, CheckCircle,
  ContentCopy, Visibility, Close, UploadFile
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getCurrentUser } from '../store/slices/authSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import { processCryptoDeposit } from '../store/slices/transactionSlice';
import api from '../services/api';
import PremiumCard from '../components/PremiumCard';
import PremiumButton from '../components/PremiumButton';

const cryptoOptions = [
  { 
    id: 'btc', 
    name: 'Bitcoin', 
    symbol: 'BTC',
    address: 'bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y',
    network: 'Bitcoin (BTC)'
  },
  { 
    id: 'eth', 
    name: 'Ethereum', 
    symbol: 'ETH',
    address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x87d04fc72ae68086eab7662b2ca27823f8b42eb8',
    network: 'Ethereum (ERC20)'
  },
  { 
    id: 'trx', 
    name: 'TRON', 
    symbol: 'TRX',
    address: 'TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg',
    network: 'TRON (TRX)'
  },
  { 
    id: 'sol', 
    name: 'Solana', 
    symbol: 'SOL',
    address: '36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA',
    network: 'Solana'
  },
  { 
    id: 'bnb', 
    name: 'BNB Chain', 
    symbol: 'BNB',
    address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=0x87d04fc72ae68086eab7662b2ca27823f8b42eb8',
    network: 'BNB Smart Chain'
  },
  { 
    id: 'ltc', 
    name: 'Litecoin', 
    symbol: 'LTC',
    address: 'ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks',
    network: 'Litecoin'
  },
  { 
    id: 'doge', 
    name: 'Dogecoin', 
    symbol: 'DOGE',
    address: 'DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX',
    network: 'Dogecoin'
  }
];

const savedWallets = [
  { id: '1', crypto: 'btc', label: 'My BTC Wallet', address: 'bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y' },
  { id: '2', crypto: 'eth', label: 'My ETH Wallet', address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8' },
  { id: '3', crypto: 'trx', label: 'My TRX Wallet', address: 'TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg' },
  { id: '4', crypto: 'sol', label: 'My SOL Wallet', address: '36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA' },
  { id: '5', crypto: 'bnb', label: 'My BNB Wallet', address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8' },
  { id: '6', crypto: 'ltc', label: 'My LTC Wallet', address: 'ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks' },
  { id: '7', crypto: 'doge', label: 'My DOGE Wallet', address: 'DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX' },
];

const addressValidators = {
  btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
  eth: /^0x[a-fA-F0-9]{40}$/,
  trx: /^T[a-zA-Z0-9]{33}$/,
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  bnb: /^0x[a-fA-F0-9]{40}$/,
  ltc: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,39}$/,
  doge: /^D[5-9A-HJ-NP-Ua-km-z]{33}$/
};

const isValidEthereumAddress = (address) => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
  const isAllLower = address === address.toLowerCase();
  const isAllUpper = address === address.toUpperCase();
  return isAllLower || isAllUpper;
};

const validateCryptoAddress = (cryptoId, address) => {
  const validator = addressValidators[cryptoId];
  if (!validator) return false;
  if (!validator.test(address)) return false;
  if (cryptoId === 'eth' || cryptoId === 'usdt') {
    return isValidEthereumAddress(address);
  }
  return true;
};

const Deposit = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const { loading: transactionLoading, error: transactionError } = useSelector((state) => state.transactions);
  const userWallets = user?.savedWallets?.length > 0 ? user.savedWallets : savedWallets;
  
  const [activeStep, setActiveStep] = useState(0);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [copied, setCopied] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [cryptoForm, setCryptoForm] = useState({
    destinationAccount: '',
    crypto: 'btc',
    transactionHash: '',
    savedWalletAddress: '',
    amount: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
    dispatch(fetchAccounts());
    
    const initializeWallets = async () => {
      if (user && (!user.savedWallets || user.savedWallets.length === 0)) {
        try {
          await api.post('/auth/initialize-saved-wallets');
          dispatch(getCurrentUser());
        } catch (err) {
          console.error('Failed to initialize saved wallets:', err);
        }
      }
    };
    
    initializeWallets();
  }, [dispatch, user, location.pathname]);

  useEffect(() => {
    if (user?.email) {
      setCryptoForm(prev => ({ ...prev, email: user.email }));
    }
   if (accounts.length > 0) {
     setCryptoForm(prev => ({ ...prev, destinationAccount: accounts[0]._id }));
   }
  }, [user, accounts]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, image: 'Please upload a valid image file (JPG, PNG, GIF, WebP)' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size must be less than 5MB' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
        setImagePreview(reader.result);
        setErrors(prev => ({ ...prev, image: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCryptoChange = (cryptoId) => {
    const crypto = cryptoOptions.find(c => c.id === cryptoId);
    setSelectedCrypto(crypto);
    setCryptoForm(prev => ({ ...prev, crypto: cryptoId, savedWalletAddress: '', transactionHash: '' }));
    setErrors({});
  };

  const validateCryptoForm = () => {
    const newErrors = {};
    if (!cryptoForm.destinationAccount) newErrors.destinationAccount = 'Please select a destination account';
    if (!cryptoForm.transactionHash) newErrors.transactionHash = 'Transaction hash is required';
    if (!cryptoForm.amount || parseFloat(cryptoForm.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!uploadedImage) newErrors.image = 'Please upload a screenshot/proof of your transaction';
    
    const isValidTransactionHash = validateCryptoAddress(cryptoForm.crypto, cryptoForm.transactionHash);
    if (cryptoForm.transactionHash && !isValidTransactionHash) {
      newErrors.transactionHash = `Invalid ${cryptoForm.crypto.toUpperCase()} transaction hash/wallet address format. Please check and enter a valid address.`;
    }
    
    const destAccount = accounts.find(a => a.id === cryptoForm.destinationAccount);
    if (destAccount && parseFloat(cryptoForm.amount) > 100000) {
      newErrors.amount = 'Deposit amount exceeds maximum limit of $100,000';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    const isValid = validateCryptoForm();
    if (isValid) {
      setActiveStep(1);
      setOpenConfirmation(true);
    }
  };

  const handleConfirmDeposit = async () => {
    const newErrors = {};
    if (!cryptoForm.destinationAccount) newErrors.destinationAccount = 'Please select a destination account';
    if (!cryptoForm.amount || parseFloat(cryptoForm.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!cryptoForm.crypto) newErrors.crypto = 'Please select a cryptocurrency';
    if (!cryptoForm.transactionHash) newErrors.transactionHash = 'Transaction hash is required';
    if (!uploadedImage) newErrors.image = 'Please upload a screenshot/proof of your transaction';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const depositData = {
      type: 'crypto',
      destinationAccountId: cryptoForm.destinationAccount,
      source: {
        crypto: cryptoForm.crypto,
        transactionHash: cryptoForm.transactionHash,
        network: selectedCrypto.network,
        proofImages: uploadedImage ? [uploadedImage] : []
      },
      amount: parseFloat(cryptoForm.amount),
      email: cryptoForm.email
    };

    try {
      await dispatch(processCryptoDeposit(depositData)).unwrap();
      setTransferComplete(true);
      setActiveStep(2);
    } catch (error) {
      setErrors({ submit: error.message || 'Deposit failed. Please try again.' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || accountsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const steps = ['Enter Deposit Details', 'Confirm Deposit', 'Deposit Complete'];

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
        top: '-15%',
        right: '-10%',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,102,255,0.3) 0%, rgba(0,102,255,0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'float 15s ease-in-out infinite'
      }} />
      <Box sx={{
        position: 'fixed',
        bottom: '-15%',
        left: '-10%',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,191,255,0.25) 0%, rgba(0,191,255,0) 70%)',
        filter: 'blur(90px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'float 20s ease-in-out infinite reverse'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }
      `}</style>

      <Box sx={{ position: 'relative', zIndex: 1, pt: 4, px: { xs: 2, md: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 2,
            color: 'white'
          }}>Deposit Funds</Typography>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Paper sx={{ 
            p: { xs: 3, md: 5 },
            borderRadius: '24px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,245,255,0.9) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 30px 90px -20px rgba(0,102,255,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 60px 120px -30px rgba(0,0,0,0.4)',
            transition: 'all 0.4s ease'
          }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {errors.submit && <Alert severity="error" sx={{ mb: 3 }}>{errors.submit}</Alert>}
            {errors.image && <Alert severity="error" sx={{ mb: 3 }}>{errors.image}</Alert>}

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {activeStep === 0 && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Destination Account"
                      value={cryptoForm.destinationAccount}
                      onChange={(e) => setCryptoForm(prev => ({ ...prev, destinationAccount: e.target.value }))}
                      error={!!errors.destinationAccount}
                      helperText={errors.destinationAccount}
                    >
                       {accounts.map((account) => (
                         <MenuItem key={account._id} value={account._id}>
                           {account.nickname} - ${account.balance.toLocaleString()}
                         </MenuItem>
                       ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Amount (USD)"
                      type="number"
                      value={cryptoForm.amount}
                      onChange={(e) => setCryptoForm(prev => ({ ...prev, amount: e.target.value }))}
                      error={!!errors.amount}
                      helperText={errors.amount}
                      InputProps={{ inputProps: { min: 10, step: 0.01, max: 100000 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Cryptocurrency"
                      value={cryptoForm.crypto}
                      onChange={(e) => handleCryptoChange(e.target.value)}
                    >
                      {cryptoOptions.map((crypto) => (
                        <MenuItem key={crypto.id} value={crypto.id}>
                          {crypto.name} ({crypto.symbol})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
              <TextField
                select
                fullWidth
                label="Your Wallet Address (Source)"
                value={cryptoForm.savedWalletAddress || ''}
                onChange={(e) => setCryptoForm(prev => ({ ...prev, transactionHash: e.target.value, savedWalletAddress: e.target.value }))}
                helperText="Select from your saved crypto wallets or enter a new one below"
              >
                {userWallets.filter(wallet => wallet.crypto === cryptoForm.crypto).map((wallet) => (
                  <MenuItem key={wallet.id} value={wallet.address}>
                    {wallet.label} - {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                  </MenuItem>
                ))}
                {userWallets.filter(wallet => wallet.crypto === cryptoForm.crypto).length === 0 && (
                  <MenuItem value="" disabled>No saved addresses for this cryptocurrency</MenuItem>
                )}
              </TextField>
              {cryptoForm.savedWalletAddress && (
                <Tooltip title="Copy address">
                  <IconButton 
                    color="primary" 
                    onClick={() => {
                      navigator.clipboard.writeText(cryptoForm.savedWalletAddress);
                    }}
                    sx={{ mb: 1 }}
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Transaction Hash / Source Wallet Address"
                      value={cryptoForm.transactionHash}
                      onChange={(e) => setCryptoForm(prev => ({ ...prev, transactionHash: e.target.value, savedWalletAddress: '' }))}
                      error={!!errors.transactionHash}
                      helperText={errors.transactionHash || `Enter your ${selectedCrypto.symbol} transaction hash or source wallet address`}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Notification Email"
                      type="email"
                      value={cryptoForm.email}
                      onChange={(e) => setCryptoForm(prev => ({ ...prev, email: e.target.value }))}
                      InputProps={{
                        endAdornment: <Email color="action" />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<UploadFile />}
                      sx={{ height: '56px', borderStyle: 'dashed' }}
                    >
                      Upload Transaction Proof (Screenshot)
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </Button>
                    {imagePreview && (
                      <Box mt={2}>
                        <img src={imagePreview} alt="Transaction proof" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card sx={{ 
                        p: 4, 
                        borderRadius: '20px',
                        border: '1px solid rgba(0,102,255,0.2)',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,245,255,0.85) 100%)',
                        backdropFilter: 'blur(30px)',
                        boxShadow: '0 20px 60px -15px rgba(0,102,255,0.3)',
                        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        '&:hover': {
                          boxShadow: '0 30px 80px -20px rgba(0,102,255,0.5), 0 0 60px rgba(0,102,255,0.2)'
                        }
                      }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, color: '#0f2744' }}>
                          Send your {selectedCrypto.name} to our official address:
                        </Typography>
                        <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                          >
                            <img src={selectedCrypto.qrCode} alt="QR Code" style={{ width: 130, height: 130, borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} />
                          </motion.div>
                          <Box flexGrow={1}>
                            <Typography variant="body1" sx={{ 
                              fontFamily: 'monospace', 
                              bgcolor: 'rgba(0,0,0,0.05)', 
                              p: 2, 
                              borderRadius: '10px',
                              wordBreak: 'break-all',
                              border: '1px solid rgba(0,0,0,0.1)'
                            }}>
                              {selectedCrypto.address}
                            </Typography>
                            <Typography variant="caption" sx={{ mt: 2, display: 'block', fontSize: '0.95rem', color: '#0066FF', fontWeight: 600 }}>
                              Network: {selectedCrypto.network}
                            </Typography>
                            <Box mt={2}>
                              <Tooltip title={copied ? "Copied!" : "Copy address"}>
                                <motion.div whileHover={{ scale: 1.1 }} style={{ display: 'inline-block' }}>
                                  <IconButton 
                                    onClick={() => copyToClipboard(selectedCrypto.address)} 
                                    size="large"
                                    sx={{ 
                                      bgcolor: 'rgba(0,102,255,0.1)', 
                                      mr: 1,
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(0,102,255,0.2)',
                                        boxShadow: '0 5px 15px rgba(0,102,255,0.3)'
                                      }
                                    }}
                                  >
                                    <ContentCopy />
                                  </IconButton>
                                </motion.div>
                              </Tooltip>
                              <Tooltip title="View QR Code">
                                <motion.div whileHover={{ scale: 1.1 }} style={{ display: 'inline-block' }}>
                                  <IconButton 
                                    onClick={() => window.open(selectedCrypto.qrCode, '_blank')} 
                                    size="large"
                                    sx={{ 
                                      bgcolor: 'rgba(0,102,255,0.1)',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        bgcolor: 'rgba(0,102,255,0.2)',
                                        boxShadow: '0 5px 15px rgba(0,102,255,0.3)'
                                      }
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </motion.div>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Box>
                      </Card>
                    </motion.div>
                  </Grid>
                  <Grid item xs={12}>
                    <PremiumButton variant="primary" size="large" onClick={handleContinue}>
                      Continue to Confirmation
                    </PremiumButton>
                  </Grid>
                </>
              )}
            </Grid>

            {/* Confirmation Dialog */}
            <Dialog 
              open={openConfirmation} 
              onClose={() => setOpenConfirmation(false)} 
              maxWidth="md" 
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(30px)',
                  boxShadow: '0 50px 100px -20px rgba(0,0,0,0.3)'
                }
              }}
            >
              <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                color: 'white',
                fontWeight: 700,
                position: 'relative',
                p: 3
              }}>
                Confirm Crypto Deposit
                <IconButton
                  aria-label="close"
                  onClick={() => setOpenConfirmation(false)}
                  sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
                >
                  <Close />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                {transferComplete ? (
                  <Box textAlign="center" py={4}>
                    <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>Deposit in Progress...</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Please note withdrawal will take sometime to reflect.
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Thank you for choosing NorthCrestBank.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      A confirmation email has been sent to {cryptoForm.email}
                    </Typography>
                    <Box mt={3}>
                      <Typography variant="subtitle1">Transaction will be processed on the {selectedCrypto.network} network</Typography>
                      <img src={selectedCrypto.qrCode} alt="Transaction QR" style={{ width: 150, height: 150, margin: '20px auto' }} />
                    </Box>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>Deposit Details</Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Amount</Typography>
                              <Typography variant="h6">${parseFloat(cryptoForm.amount).toLocaleString()}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Cryptocurrency</Typography>
                              <Typography variant="h6">{selectedCrypto.name} (Deposit)</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Network</Typography>
                              <Typography variant="body1">{selectedCrypto.network}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Transaction Hash</Typography>
                              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{cryptoForm.transactionHash}</Typography>
                            </Grid>
                            {imagePreview && (
                              <Grid item xs={12}>
                                <Typography variant="body2" color="text.secondary">Uploaded Proof</Typography>
                                <img src={imagePreview} alt="Transaction proof" style={{ maxWidth: '300px', maxHeight: '200px', marginTop: '10px' }} />
                              </Grid>
                            )}
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Notification Email</Typography>
                              <Typography variant="body1">{cryptoForm.email}</Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                )}
              </DialogContent>
              {!transferComplete && (
                <DialogActions sx={{ p: 3 }}>
                  <PremiumButton variant="ghost" onClick={() => setOpenConfirmation(false)}>Cancel</PremiumButton>
                  <PremiumButton 
                    variant="primary" 
                    onClick={handleConfirmDeposit}
                    disabled={transactionLoading}
                  >
                    {transactionLoading ? <CircularProgress size={24} /> : 'Confirm & Submit Deposit'}
                  </PremiumButton>
                </DialogActions>
              )}
            </Dialog>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Deposit;
