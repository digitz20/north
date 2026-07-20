import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowBack, ContentCopy, UploadFile, Email, CheckCircle } from '@mui/icons-material';
import { 
  AccountBalance, CurrencyBitcoin, Payments, 
  Money, Send, Lock
} from '@mui/icons-material';
import { getCurrentUser } from '../store/slices/authSlice';
import { createInternationalTransfer, processCryptoDeposit } from '../store/slices/transactionSlice';

// Supported cryptocurrencies with permanent system addresses
const cryptoOptions = [
  { 
    id: 'btc', 
    name: 'Bitcoin', 
    symbol: 'BTC',
    address: 'bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y',
    network: 'Bitcoin (BTC)'
  },
  { 
    id: 'eth', 
    name: 'Ethereum', 
    symbol: 'ETH',
    address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8',
    network: 'Ethereum (ERC20)'
  },
  { 
    id: 'trx', 
    name: 'TRON', 
    symbol: 'TRX',
    address: 'TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg',
    network: 'TRON (TRX)'
  },
  { 
    id: 'sol', 
    name: 'Solana', 
    symbol: 'SOL',
    address: '36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA',
    network: 'Solana'
  },
  { 
    id: 'bnb', 
    name: 'BNB Chain', 
    symbol: 'BNB',
    address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8',
    network: 'BNB Smart Chain'
  },
  { 
    id: 'ltc', 
    name: 'Litecoin', 
    symbol: 'LTC',
    address: 'ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks',
    network: 'Litecoin'
  },
  { 
    id: 'doge', 
    name: 'Dogecoin', 
    symbol: 'DOGE',
    address: 'DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX',
    network: 'Dogecoin'
  }
];

// Saved wallet addresses that appear in the dropdown - all supported crypto addresses
const savedWallets = [
  { id: '1', crypto: 'btc', label: 'My BTC Wallet', address: 'bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y' },
  { id: '2', crypto: 'eth', label: 'My ETH Wallet', address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8' },
  { id: '3', crypto: 'trx', label: 'My TRX Wallet', address: 'TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg' },
  { id: '4', crypto: 'sol', label: 'My SOL Wallet', address: '36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA' },
  { id: '5', crypto: 'bnb', label: 'My BNB Wallet', address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8' },
  { id: '6', crypto: 'ltc', label: 'My LTC Wallet', address: 'ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks' },
  { id: '7', crypto: 'doge', label: 'My DOGE Wallet', address: 'DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX' },
];

// Permanent transfer methods (never removed - permanent feature)
const transferMethods = [
  { id: 'bank-transfer', name: 'Bank Transfer', icon: '🏦', description: 'SWIFT/SEPA transfer' },
  { id: 'crypto-transfer', name: 'Cryptocurrency', icon: '₿', description: 'Deposit crypto from your wallet' },
  { id: 'wire-transfer', name: 'Wire Transfer', icon: '💻', description: 'Same-day wire transfer' }
];

// Address validation patterns
const addressValidators = {
  btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
  eth: /^0x[a-fA-F0-9]{40}$/,
  trx: /^T[a-zA-Z0-9]{33}$/,
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
  bnb: /^0x[a-fA-F0-9]{40}$/,
  ltc: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,39}$/,
  doge: /^D[5-9A-HJ-NP-Ua-km-z]{33}$/
};

const InternationalTransfer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { loading, error } = useSelector(state => state.transactions);
  
  const userWallets = user?.savedWallets?.length > 0 ? user.savedWallets : savedWallets;
  
  const [selectedMethod, setSelectedMethod] = useState(transferMethods[0]);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [uploadedProofs, setUploadedProofs] = useState([]);
  const [errors, setErrors] = useState({});
  const [transactionId, setTransactionId] = useState('');
  
  // Form state using proper backend field names
  const [transferForm, setTransferForm] = useState({
    method: 'bank-transfer',
    amount: '',
    destinationAccount: '',
    sourceWalletAddress: '',
    transactionHash: '',
    recipientEmail: '',
    recipientName: '',
    recipientBankDetails: {
      accountNumber: '',
      routingNumber: '',
      bankName: '',
      swiftCode: '',
      country: ''
    },
    crypto: 'btc'
  });

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
    if (user?.email) {
      setTransferForm(prev => ({ ...prev, recipientEmail: user.email }));
    }
  }, [dispatch, user]);

  // Copy address to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle file upload for transfer proofs - convert to base64
  const handleProofUpload = async (event) => {
    const files = Array.from(event.target.files);
    const base64Proofs = [];
    
    for (const file of files) {
      const base64 = await readFileAsBase64(file);
      base64Proofs.push({
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64
      });
    }
    
    setUploadedProofs(prev => [...prev, ...base64Proofs]);
  };

  // Helper to read file as base64 data URL
  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle crypto selection change
  const handleCryptoChange = (cryptoId) => {
    const crypto = cryptoOptions.find(c => c.id === cryptoId);
    setSelectedCrypto(crypto);
    setTransferForm(prev => ({ ...prev, crypto: cryptoId, sourceWalletAddress: '', transactionHash: '' }));
    setErrors({});
  };

  // Validate transfer form
  const validateTransferForm = () => {
    const newErrors = {};
    if (!transferForm.amount || parseFloat(transferForm.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    // Crypto-specific validation
    if (transferForm.method === 'crypto-transfer') {
      if (!transferForm.sourceWalletAddress || transferForm.sourceWalletAddress === 'new') {
        newErrors.sourceWalletAddress = 'Please enter your source wallet address';
      }
      if (uploadedProofs.length === 0) {
        newErrors.proofs = 'Please upload at least one proof of transaction';
      }
      if (!transferForm.recipientEmail) {
        newErrors.recipientEmail = 'Please enter a notification email';
      }
    }
    
    // Wire transfer specific validation
    if (transferForm.method === 'wire-transfer') {
      if (!transferForm.recipientName) {
        newErrors.recipientName = 'Please enter recipient name';
      }
      if (!transferForm.recipientBankDetails.swiftCode) {
        newErrors.swiftCode = 'Please enter SWIFT code';
      }
      if (!transferForm.recipientBankDetails.country) {
        newErrors.country = 'Please select recipient country';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setTransferForm(prev => ({ ...prev, method: method.id }));
    setOpenTransferDialog(true);
    
    // Set default crypto if method is crypto
    if (method.id === 'crypto-transfer') {
      const firstCrypto = cryptoOptions[0];
      setSelectedCrypto(firstCrypto);
      setTransferForm(prev => ({ ...prev, crypto: firstCrypto.id }));
    }
  };

  // Submit transfer
  const handleSubmitTransfer = async () => {
    const isValid = validateTransferForm();
    if (!isValid) return;
    
    // Handle crypto deposits with the specific crypto deposit API
    if (transferForm.method === 'crypto-transfer') {
      const depositData = {
        amount: parseFloat(transferForm.amount),
        walletAddress: transferForm.sourceWalletAddress,
        crypto: transferForm.crypto,
        email: transferForm.recipientEmail,
        proofs: uploadedProofs.map(proof => proof.data)
      };
      
      const result = await dispatch(processCryptoDeposit(depositData)).unwrap();
      setTransactionId(result.transactionId || result._id || 'N/A');
      // After successful deposit, move to completion step
      setActiveStep(2);
    } else {
      // Use regular international transfer API for bank/wire transfers
      const transferData = {
        type: 'international',
        amount: parseFloat(transferForm.amount),
        destinationAccountId: transferForm.destinationAccount,
        method: transferForm.method,
        source: {
          walletAddress: transferForm.sourceWalletAddress,
          transactionHash: transferForm.transactionHash,
          crypto: transferForm.crypto
        },
        recipient: {
          email: transferForm.recipientEmail,
          name: transferForm.recipientName,
          bankDetails: transferForm.recipientBankDetails
        },
        proofs: uploadedProofs.map(proof => proof.data)
      };
      
      const result = await dispatch(createInternationalTransfer(transferData)).unwrap();
      setTransactionId(result.transactionId || result._id || 'N/A');
      setOpenTransferDialog(false);
      setActiveStep(0);
      navigate('/transactions');
    }
  };

  const displayTransferMethods = [
    {
      id: 'wire-transfer',
      title: 'Wire Transfer',
      description: 'Same-day wire transfer to international bank accounts.',
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)'
    },
    {
      id: 'crypto-transfer',
      title: 'Cryptocurrency',
      description: 'Deposit cryptocurrency to your account using your crypto wallet.',
      icon: <CurrencyBitcoin sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
    },
    {
      id: 'bank-transfer',
      title: 'Bank Transfer',
      description: 'SWIFT/SEPA transfer to global bank accounts.',
      icon: <Payments sx={{ fontSize: 40 }} />,
      color: 'linear-gradient(135deg, #003087 0%, #009cde 100%)'
    }
  ];

  const steps = ['Enter Deposit Details', 'Confirm Deposit', 'Deposit Complete'];

  return (
    <Box sx={{ 
      position: 'relative', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #021024 0%, #063970 25%, #0066ff 50%, #00bfff 75%, #0066ff 100%)',
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
        animation: 'none'
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
        animation: 'none'
      }} />

      <Box sx={{ position: 'relative', zIndex: 1, pt: 4, px: { xs: 2, md: 4 } }}>
        <div
          style={{ opacity: 0, y: -30 }}
        >
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            mb: 2,
            color: 'white'
          }}>International Transfer</Typography>
          </div>
          
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

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {displayTransferMethods.map((method, index) => (
                <Grid item xs={12} md={6} key={method.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <Card 
                      sx={{ 
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: selectedMethod?.id === method.id ? '3px solid #0066FF' : '1px solid rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                      }}
                      onClick={() => handleMethodSelect(method)}
                    >
                      <Box sx={{ 
                        p: 0.5, 
                        background: method.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 3
                      }}>
                        {method.icon}
                      </Box>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                          {method.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.description}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Security Notice */}
            <Paper sx={{ 
              mt: 5,
              p: 3, 
              borderRadius: 2,
              background: 'rgba(0,102,255,0.05)',
              border: '1px solid rgba(0,102,255,0.1)',
              textAlign: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Lock sx={{ fontSize: 18, color: '#0066FF' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Secure Transaction</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                All transfers are encrypted and processed securely. Never share your PIN with anyone.
              </Typography>
            </Paper>
          </Paper>
        </motion.div>

        {/* Crypto Transfer Form */}
        {selectedMethod?.id === 'crypto-transfer' && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Paper sx={{ 
              mt: 4,
              p: { xs: 3, md: 5 },
              borderRadius: '24px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,245,255,0.9) 100%)',
              backdropFilter: 'blur(40px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 30px 90px -20px rgba(0,102,255,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 60px 120px -30px rgba(0,0,0,0.4)',
            }}>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {errors.submit && <Alert severity="error" sx={{ mb: 3 }}>{errors.submit}</Alert>}

              <Grid container spacing={{ xs: 2, sm: 3 }}>

            {/* Step 1: Enter Deposit Details */}
            {activeStep === 0 && transferForm.method === 'crypto-transfer' && selectedCrypto && (
              <>
                <Grid item xs={12} md={6}>
                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Destination Account"
                        value={transferForm.destinationAccount}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, destinationAccount: e.target.value }))}
                        error={!!errors.destinationAccount}
                        helperText={errors.destinationAccount}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        {accounts.map((account) => (
                          <MenuItem key={account.id} value={account.id}>
                            {account.nickname} - ${account.balance.toLocaleString()}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Amount (USD)"
                        type="number"
                        value={transferForm.amount}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                        error={!!errors.amount}
                        helperText={errors.amount}
                        placeholder="Enter amount in USD"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        select
                        fullWidth
                        label="Cryptocurrency"
                        value={transferForm.crypto}
                        onChange={(e) => handleCryptoChange(e.target.value)}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        {cryptoOptions.map((crypto) => (
                          <MenuItem key={crypto.id} value={crypto.id}>
                            {crypto.name} ({crypto.symbol})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                        <TextField
                          select
                          fullWidth
                          label="Your Wallet Address (Source)"
                          value={transferForm.sourceWalletAddress}
                          onChange={(e) => setTransferForm(prev => ({ ...prev, sourceWalletAddress: e.target.value }))}
                          error={!!errors.sourceWalletAddress}
                          helperText={errors.sourceWalletAddress || "Select from your saved crypto wallets or enter a new one below"}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                          {userWallets.filter(wallet => wallet.crypto === transferForm.crypto).map((wallet) => (
                            <MenuItem key={wallet.id || wallet._id || wallet.address} value={wallet.address}>
                              {wallet.label} - {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                            </MenuItem>
                          ))}
                          <MenuItem value="new">Enter new wallet address...</MenuItem>
                          {userWallets.filter(wallet => wallet.crypto === transferForm.crypto).length === 0 && (
                            <MenuItem value="" disabled>No saved addresses for this cryptocurrency</MenuItem>
                          )}
                        </TextField>
                        {transferForm.sourceWalletAddress && transferForm.sourceWalletAddress !== 'new' && (
                          <Tooltip title="Copy address">
                            <IconButton 
                              color="primary" 
                              onClick={() => copyToClipboard(transferForm.sourceWalletAddress)}
                              sx={{ mb: 1 }}
                            >
                              <ContentCopy />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Transaction Hash / Source Wallet Address"
                        value={transferForm.transactionHash}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, transactionHash: e.target.value, savedWalletAddress: '' }))}
                        error={!!errors.transactionHash}
                        helperText={errors.transactionHash || `Enter your ${selectedCrypto.symbol} transaction hash or source wallet address`}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notification Email"
                        type="email"
                        value={transferForm.recipientEmail}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
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
                          onChange={handleProofUpload}
                        />
                      </Button>
                      {uploadedProofs.length > 0 && (
                        <Box mt={2}>
                          <CheckCircle color="success" sx={{ fontSize: 16, mr: 1 }} />
                          <Typography variant="body2" component="span">{uploadedProofs.length} file(s) uploaded</Typography>
                        </Box>
                      )}
                      {errors.proofs && (
                        <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                          {errors.proofs}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Grid>

                {/* Crypto info card - right side */}
                <Grid item xs={12} md={6}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Paper sx={{ 
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
                    </Paper>
                  </motion.div>
                </Grid>
              </>
            )}

            {/* Step 2: Confirm Deposit - Show QR code and all deposit details */}
            {activeStep === 1 && transferForm.method === 'crypto-transfer' && selectedCrypto && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, bgcolor: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#00c896' }}>
                      Send your {selectedCrypto.name} to our official address:
                    </Typography>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        {/* QR Code placeholder */}
                        <Box sx={{ 
                          width: 200, 
                          height: 200, 
                          bgcolor: 'white', 
                          border: '1px solid #ccc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 2,
                          mb: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">QR Code</Typography>
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>Scan to send {selectedCrypto.symbol}</Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Wallet Address:</Typography>
                          <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {selectedCrypto.address}
                          </Typography>
                          <Tooltip title={copied ? "Copied!" : "Copy address"}>
                            <IconButton 
                              color="primary"
                              onClick={() => copyToClipboard(selectedCrypto.address)}
                              size="small"
                            >
                              <ContentCopy />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Network:</Typography>
                          <Typography variant="body1" color="primary">{selectedCrypto.network}</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Deposit summary */}
                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Deposit Summary:</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Amount (USD):</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>${parseFloat(transferForm.amount).toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Cryptocurrency:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedCrypto.name} ({selectedCrypto.symbol})</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Destination Account:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{transferForm.destinationAccount}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Notification Email:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{transferForm.recipientEmail}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Transaction ID:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{transactionId}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Step 3: Deposit Complete */}
            {activeStep === 2 && transferForm.method === 'crypto-transfer' && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <CheckCircle sx={{ fontSize: 80, color: '#00c896', mb: 3 }} />
                </motion.div>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#00c896' }}>
                  Deposit Complete!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Your cryptocurrency deposit has been submitted successfully.
                </Typography>
                <Paper sx={{ p: 3, maxWidth: 500, mx: 'auto', bgcolor: 'rgba(0,200,150,0.05)', border: '1px solid rgba(0,200,150,0.2)' }}>
                  <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Transaction ID:</Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{transactionId}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Amount:</Typography>
                      <Typography variant="body1">${parseFloat(transferForm.amount).toLocaleString()} USD</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Cryptocurrency:</Typography>
                      <Typography variant="body1">{selectedCrypto?.name || 'Bitcoin'} ({selectedCrypto?.symbol || 'BTC'})</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        You will receive a confirmation email at {transferForm.recipientEmail} once the transaction is confirmed on the blockchain.
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            )}

            {/* Non-crypto transfer flow (unchanged) */}
            {(transferForm.method !== 'crypto-transfer' && activeStep === 0) && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Amount (USD)"
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    error={!!errors.amount}
                    helperText={errors.amount}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Recipient Email"
                    value={transferForm.recipientEmail}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={() => {}}>
                          <Email />
                        </IconButton>
                      )
                    }}
                  />
                </Grid>
                {/* Other bank/wire transfer fields remain unchanged */}
              </Grid>
            )}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                onClick={() => { 
                  setActiveStep(0); 
                }}
                sx={{ display: activeStep > 0 ? 'inline-flex' : 'none' }}
              >
                Back
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              {transferForm.method === 'crypto-transfer' && activeStep === 0 && (
                <Button 
                  variant="contained"
                  onClick={() => {
                    const isValid = validateTransferForm();
                    if (isValid) setActiveStep(1);
                  }}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)',
                      boxShadow: '0 12px 32px rgba(0, 102, 255, 0.45)',
                    },
                  }}
                >
                  Continue to Confirmation
                </Button>
              )}
              {transferForm.method === 'crypto-transfer' && activeStep === 1 && (
                <Button 
                  variant="contained"
                  onClick={async () => {
                    await handleSubmitTransfer();
                    setActiveStep(2);
                  }}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)',
                      boxShadow: '0 12px 32px rgba(0, 102, 255, 0.45)',
                    },
                  }}
                >
                  {loading ? "Processing..." : "Confirm Deposit"}
                </Button>
              )}
              {transferForm.method === 'crypto-transfer' && activeStep === 2 && (
                <Button 
                  variant="contained"
                  onClick={() => {
                    setActiveStep(0);
                    navigate('/transactions');
                  }}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                  }}
                >
                  View Transactions
                </Button>
              )}
              {transferForm.method !== 'crypto-transfer' && activeStep === 0 && (
                <Button 
                  variant="contained"
                  onClick={() => setActiveStep(1)}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                  }}
                >
                  Continue to Confirmation
                </Button>
              )}
              {transferForm.method !== 'crypto-transfer' && activeStep === 1 && (
                <Button 
                  variant="contained"
                  onClick={handleSubmitTransfer}
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                    boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                  }}
                >
                  {loading ? "Processing..." : "Confirm & Submit Transfer"}
                </Button>
                )}
              </Box>
            </Grid>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default InternationalTransfer;

