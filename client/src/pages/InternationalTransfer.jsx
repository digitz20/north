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
  
  const [selectedMethod, setSelectedMethod] = useState(transferMethods[0]);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [uploadedProofs, setUploadedProofs] = useState([]);
  const [errors, setErrors] = useState({});
  
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

  const [copied, setCopied] = useState(false);

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

  // Handle file upload for transfer proofs
  const handleProofUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedProofs(prev => [...prev, ...files]);
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
        proofs: uploadedProofs.map(file => file.name)
      };
      
      await dispatch(processCryptoDeposit(depositData));
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
        proofs: uploadedProofs.map(file => file.name)
      };
      
      await dispatch(createInternationalTransfer(transferData));
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      minHeight: '100vh',
      p: { xs: 2, md: 0 }
    }}>
      {/* Background effects */}
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
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/transfer')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0
          }}>
            Dashboard / International Transfer
          </Typography>
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper sx={{ 
            p: 4, 
            maxWidth: 1200,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(15,39,68,0.08)',
            boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)',
            mx: 'auto'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Select Transfer Method</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Choose from our secure international transfer options
            </Typography>

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

        {/* Transfer Dialog */}
        <Dialog 
          open={openTransferDialog} 
          onClose={() => setOpenTransferDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {transferForm.method === 'crypto-transfer' ? 'Cryptocurrency Deposit' : 'International Transfer'}
          </DialogTitle>
          <DialogContent>
            <Stepper activeStep={activeStep} sx={{ py: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Step 1: Enter Deposit Details - Show QR Code and address first */}
            {activeStep === 0 && transferForm.method === 'crypto-transfer' && selectedCrypto && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Show QR Code and wallet address immediately */}
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
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cryptocurrency"
                    value={transferForm.crypto}
                    onChange={(e) => handleCryptoChange(e.target.value)}
                    select
                  >
                    {cryptoOptions.map((crypto) => (
                      <MenuItem key={crypto.id} value={crypto.id}>
                        {crypto.name} ({crypto.symbol})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Amount (USD)"
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                    error={!!errors.amount}
                    helperText={errors.amount}
                    placeholder="Enter amount in USD"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Notification Email"
                    value={transferForm.recipientEmail}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                    error={!!errors.recipientEmail}
                    helperText={errors.recipientEmail}
                    placeholder="alaekekaebuka200@gmail.com"
                    InputProps={{
                      endAdornment: (
                        <IconButton onClick={() => {}}>
                          <Email />
                        </IconButton>
                      )
                    }}
                  />
                </Grid>

                {/* Source wallet address field */}
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Your Wallet Address (Source)"
                    value={transferForm.sourceWalletAddress}
                    onChange={(e) => setTransferForm(prev => ({ ...prev, sourceWalletAddress: e.target.value }))}
                    error={!!errors.sourceWalletAddress}
                    helperText={errors.sourceWalletAddress || "Select from your saved crypto wallets or enter a new one below"}
                  >
                    {savedWallets.filter(wallet => wallet.crypto === transferForm.crypto).map((wallet) => (
                      <MenuItem key={wallet.id} value={wallet.address}>
                        {wallet.label} - {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                      </MenuItem>
                    ))}
                    <MenuItem value="new">Enter new wallet address...</MenuItem>
                    {savedWallets.filter(wallet => wallet.crypto === transferForm.crypto).length === 0 && (
                      <MenuItem value="" disabled>No saved addresses for this cryptocurrency</MenuItem>
                    )}
                  </TextField>
                </Grid>

                {/* Manual entry if not selecting saved wallet */}
                {transferForm.sourceWalletAddress === 'new' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Enter your source wallet address"
                      value={transferForm.sourceWalletAddress === 'new' ? '' : transferForm.sourceWalletAddress}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, sourceWalletAddress: e.target.value }))}
                      placeholder="Enter your wallet address manually"
                    />
                  </Grid>
                )}

                {/* Proof upload section */}
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<UploadFile />}
                    component="label"
                    sx={{ mr: 2, mt: 2 }}
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
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <CheckCircle color="success" sx={{ fontSize: 16, mr: 1 }} />
                      {uploadedProofs.length} file(s) uploaded
                    </Typography>
                  )}
                  {errors.proofs && (
                    <Typography variant="caption" color="error" display="block">
                      {errors.proofs}
                    </Typography>
                  )}
                </Grid>
              </Grid>
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { 
              setOpenTransferDialog(false); 
              setActiveStep(0); 
            }}>
              Cancel
            </Button>
            
            {/* Crypto transfer navigation buttons */}
            {transferForm.method === 'crypto-transfer' && activeStep === 0 && (
              <Button 
                variant="contained"
                onClick={() => {
                  const isValid = validateTransferForm();
                  if (isValid) setActiveStep(1);
                }}
              >
                Continue to Confirm Deposit
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
              >
                {loading ? "Processing..." : "Confirm Deposit"}
              </Button>
            )}
            {transferForm.method === 'crypto-transfer' && activeStep === 2 && (
              <Button 
                variant="contained"
                onClick={() => {
                  setOpenTransferDialog(false);
                  setActiveStep(0);
                  navigate('/transactions');
                }}
              >
                View Transactions
              </Button>
            )}

            {/* Non-crypto transfer buttons (unchanged) */}
            {transferForm.method !== 'crypto-transfer' && activeStep === 0 && (
              <Button 
                variant="contained"
                onClick={() => setActiveStep(1)}
              >
                Continue to Confirmation
              </Button>
            )}
            {transferForm.method !== 'crypto-transfer' && activeStep === 1 && (
              <Button 
                variant="contained"
                onClick={handleSubmitTransfer}
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm & Submit Transfer"}
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default InternationalTransfer;