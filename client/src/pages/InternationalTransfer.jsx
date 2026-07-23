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
  IconButton,
  Tooltip,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Alert,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowBack, ContentCopy, UploadFile, Email, CheckCircle, Lock } from '@mui/icons-material';
import { 
  AccountBalance, CurrencyBitcoin, Payments
} from '@mui/icons-material';
import { getCurrentUser } from '../store/slices/authSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import { createInternationalTransfer, processCryptoDeposit } from '../store/slices/transactionSlice';

// Supported cryptocurrencies with permanent system addresses
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

const countries = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
  'Italy', 'Spain', 'Mexico', 'Brazil', 'India', 'China', 'Japan', 'South Korea',
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Austria', 'Azerbaijan',
  'Bahamas', 'Bahrain', 'Bangladesh', 'Belarus', 'Belgium', 'Benin',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Bulgaria',
  'Cambodia', 'Cameroon', 'Canada', 'Chile', 'China', 'Colombia',
  'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Ethiopia',
  'Fiji', 'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Haiti',
  'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
  'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
  'Laos', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Malaysia', 'Maldives', 'Mali',
  'Malta', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
  'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama', 'Paraguay', 'Peru', 'Philippines',
  'Poland', 'Portugal', 'Qatar', 'Romania', 'Russian Federation', 'Rwanda', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Sudan', 'Spain',
  'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda',
  'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam',
  'Yemen', 'Zambia', 'Zimbabwe'
];

const InternationalTransfer = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { accounts, loading: accountsLoading } = useSelector(state => state.accounts);
  const { loading, error } = useSelector(state => state.transactions);
  
  const userWallets = user?.savedWallets?.length > 0 ? user.savedWallets : savedWallets;
  
  const [selectedMethod, setSelectedMethod] = useState(null);
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
    dispatch(fetchAccounts());
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
    
    // Bank transfer specific validation
    if (transferForm.method === 'bank-transfer') {
      if (!transferForm.recipientName) {
        newErrors.recipientName = 'Please enter recipient name';
      }
      if (!transferForm.recipientBankDetails.accountNumber) {
        newErrors.accountNumber = 'Please enter account number';
      }
      if (!transferForm.recipientBankDetails.routingNumber) {
        newErrors.routingNumber = 'Please enter routing number';
      }
      if (!transferForm.recipientBankDetails.bankName) {
        newErrors.bankName = 'Please enter bank name';
      }
      if (!transferForm.recipientBankDetails.country) {
        newErrors.country = 'Please select country';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setTransferForm(prev => ({ ...prev, method: method.id }));
    setActiveStep(0);
    setUploadedProofs([]);
    setErrors({});
    setTransactionId('');
    
    // Set default crypto if method is crypto
    if (method.id === 'crypto-transfer') {
      const firstCrypto = cryptoOptions[0];
      setSelectedCrypto(firstCrypto);
      setTransferForm(prev => ({ ...prev, crypto: firstCrypto.id, sourceWalletAddress: '', transactionHash: '' }));
    }
  };

  const handleBackToMethods = () => {
    setSelectedMethod(null);
    setActiveStep(0);
    setUploadedProofs([]);
    setErrors({});
    setTransactionId('');
  };

  // Submit transfer
  const handleSubmitTransfer = async () => {
    const isValid = validateTransferForm();
    if (!isValid) return;
    
    // Handle crypto deposits with the specific crypto deposit API
    if (transferForm.method === 'crypto-transfer') {
      const depositData = {
        type: 'deposit',
        direction: 'credit',
        category: 'deposit',
        amount: parseFloat(transferForm.amount),
        destinationAccountId: transferForm.destinationAccount,
        source: {
          crypto: transferForm.crypto,
          walletAddress: transferForm.sourceWalletAddress,
          transactionHash: transferForm.transactionHash,
          network: selectedCrypto.network,
          proofImages: uploadedProofs.map(proof => proof.data)
        },
        email: transferForm.recipientEmail
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
        proofImageUrls: uploadedProofs.map(proof => proof.data)
      };
      
      const result = await dispatch(createInternationalTransfer(transferData)).unwrap();
      setTransactionId(result.transactionId || result._id || 'N/A');
      setActiveStep(2);
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

  const steps = [
    { short: 'Enter Details', full: 'Enter Transfer Details' },
    { short: 'Confirm', full: 'Confirm Transfer' },
    { short: 'Complete', full: 'Transfer Complete' }
  ];

  const renderMethodCards = () => (
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
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, textAlign: 'center' }}>
          Select Transfer Method
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
  );

  const renderMethodForm = () => {
    if (!selectedMethod) return null;
    
    return (
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Button
              variant="outlined"
              onClick={handleBackToMethods}
              sx={{ mr: 2, borderRadius: 2 }}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {selectedMethod.name} Transfer
            </Typography>
          </Box>

            <Stepper
              activeStep={activeStep}
              sx={{
                mb: 4,
                '& .MuiStepLabel-label': {
                  fontSize: { xs: '0.65rem', sm: '0.875rem' },
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  maxWidth: { xs: 70, sm: 150 },
                  lineHeight: 1.2,
                }
              }}
            >
              {steps.map((step) => (
                <Step key={step.full}>
                  <StepLabel>{step.full}</StepLabel>
                </Step>
              ))}
            </Stepper>

          {errors.submit && <Alert severity="error" sx={{ mb: 3 }}>{errors.submit}</Alert>}

          {activeStep === 0 && (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12} md={6}>
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
                   {accounts?.map((account) => (
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
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  placeholder="Enter amount in USD"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Recipient Name"
                  value={transferForm.recipientName}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, recipientName: e.target.value }))}
                  error={!!errors.recipientName}
                  helperText={errors.recipientName}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Notification Email"
                  type="email"
                  value={transferForm.recipientEmail}
                  onChange={(e) => setTransferForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                  error={!!errors.recipientEmail}
                  helperText={errors.recipientEmail}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>

              {selectedMethod.id === 'crypto-transfer' && (
                <>
                  <Grid item xs={12} md={6}>
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
                  <Grid item xs={12} md={6}>
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
                        <MenuItem value="">Select a wallet</MenuItem>
                        {userWallets.filter(w => w.crypto === transferForm.crypto).map((wallet) => (
                          <MenuItem key={wallet.id} value={wallet.address}>
                            {wallet.label} - {wallet.address.substring(0, 10)}...
                          </MenuItem>
                        ))}
                        <MenuItem value="new">Enter new wallet address</MenuItem>
                      </TextField>
                    </Box>
                  </Grid>
                  {transferForm.sourceWalletAddress === 'new' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="New Wallet Address"
                        value={transferForm.sourceWalletAddress === 'new' ? '' : transferForm.sourceWalletAddress}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, sourceWalletAddress: e.target.value }))}
                        error={!!errors.sourceWalletAddress}
                        helperText={errors.sourceWalletAddress || `Enter your ${selectedCrypto.symbol} wallet address`}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Grid>
                  )}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Transaction Hash (if applicable)"
                      value={transferForm.transactionHash}
                      onChange={(e) => setTransferForm(prev => ({ ...prev, transactionHash: e.target.value }))}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFile />}
                      sx={{ borderRadius: 2 }}
                    >
                      Upload Proof of Transaction
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleProofUpload}
                      />
                    </Button>
                    {uploadedProofs.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        {uploadedProofs.map((proof, index) => (
                          <Chip 
                            key={index} 
                            label={proof.name} 
                            sx={{ mr: 1, mb: 1 }}
                            onDelete={() => setUploadedProofs(prev => prev.filter((_, i) => i !== index))}
                          />
                        ))}
                      </Box>
                    )}
                    {errors.proofs && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.proofs}</Typography>}
                  </Grid>

                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, borderRadius: 2, background: 'rgba(0,102,255,0.03)', border: '1px solid rgba(0,102,255,0.1)' }}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Send {selectedCrypto.name} to this address
                      </Typography>
                      <Box sx={{ 
                        p: 2, 
                        background: 'white', 
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.1)',
                        mb: 2
                      }}>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                          {selectedCrypto.address}
                        </Typography>
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={() => copyToClipboard(selectedCrypto.address)}
                        sx={{ borderRadius: 2, mb: 2 }}
                      >
                        {copied ? <CheckCircle sx={{ mr: 1 }} /> : <ContentCopy sx={{ mr: 1 }} />}
                        {copied ? 'Copied!' : 'Copy Address'}
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        Network: {selectedCrypto.network}
                      </Typography>
                      <Box 
                        component="img"
                        src={selectedCrypto.qrCode}
                        alt="QR Code"
                        sx={{ width: '200px', height: '200px', mt: 2, borderRadius: 2 }}
                      />
                    </Paper>
                  </Grid>
                </>
              )}

              {selectedMethod.id === 'wire-transfer' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Recipient Bank Name"
                      value={transferForm.recipientBankDetails.bankName}
                      onChange={(e) => setTransferForm(prev => ({ 
                        ...prev, 
                        recipientBankDetails: { ...prev.recipientBankDetails, bankName: e.target.value }
                      }))}
                      error={!!errors.bankName}
                      helperText={errors.bankName}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="SWIFT / BIC Code"
                      value={transferForm.recipientBankDetails.swiftCode}
                      onChange={(e) => setTransferForm(prev => ({ 
                        ...prev, 
                        recipientBankDetails: { ...prev.recipientBankDetails, swiftCode: e.target.value }
                      }))}
                      error={!!errors.swiftCode}
                      helperText={errors.swiftCode}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Recipient Country"
                      value={transferForm.recipientBankDetails.country}
                      onChange={(e) => setTransferForm(prev => ({ 
                        ...prev, 
                        recipientBankDetails: { ...prev.recipientBankDetails, country: e.target.value }
                      }))}
                      error={!!errors.country}
                      helperText={errors.country}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      <MenuItem value="">Select country</MenuItem>
                      {countries.map((country) => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFile />}
                      sx={{ borderRadius: 2 }}
                    >
                      Upload Transfer Proof / Invoice
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleProofUpload}
                      />
                    </Button>
                    {uploadedProofs.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        {uploadedProofs.map((proof, index) => (
                          <Chip 
                            key={index} 
                            label={proof.name} 
                            sx={{ mr: 1, mb: 1 }}
                            onDelete={() => setUploadedProofs(prev => prev.filter((_, i) => i !== index))}
                          />
                        ))}
                      </Box>
                    )}
                    {errors.proofs && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.proofs}</Typography>}
                  </Grid>
                </>
              )}

              {selectedMethod.id === 'bank-transfer' && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Recipient Bank Name"
                      value={transferForm.recipientBankDetails.bankName}
                      onChange={(e) => setTransferForm(prev => ({ 
                        ...prev, 
                        recipientBankDetails: { ...prev.recipientBankDetails, bankName: e.target.value }
                      }))}
                      error={!!errors.bankName}
                      helperText={errors.bankName}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Account Number"
                      value={transferForm.recipientBankDetails.accountNumber}
                      onChange={(e) => setTransferForm(prev => ({ 
                        ...prev, 
                        recipientBankDetails: { ...prev.recipientBankDetails, accountNumber: e.target.value }
                      }))}
                      error={!!errors.accountNumber}
                      helperText={errors.accountNumber}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Routing Number"
                      value={transferForm.recipientBankDetails.routingNumber}
                      onChange={(e) => setTransferForm(prev => ({ 
                        ...prev, 
                        recipientBankDetails: { ...prev.recipientBankDetails, routingNumber: e.target.value }
                      }))}
                      error={!!errors.routingNumber}
                      helperText={errors.routingNumber}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Country"
                      value={transferForm.recipientBankDetails.country}
                      onChange={(e) => setTransferForm(prev => ({ 
                        ...prev, 
                        recipientBankDetails: { ...prev.recipientBankDetails, country: e.target.value }
                      }))}
                      error={!!errors.country}
                      helperText={errors.country}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      <MenuItem value="">Select country</MenuItem>
                      {countries.map((country) => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFile />}
                      sx={{ borderRadius: 2 }}
                    >
                      Upload Transfer Proof / Invoice
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*,.pdf"
                        onChange={handleProofUpload}
                      />
                    </Button>
                    {uploadedProofs.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        {uploadedProofs.map((proof, index) => (
                          <Chip 
                            key={index} 
                            label={proof.name} 
                            sx={{ mr: 1, mb: 1 }}
                            onDelete={() => setUploadedProofs(prev => prev.filter((_, i) => i !== index))}
                          />
                        ))}
                      </Box>
                    )}
                    {errors.proofs && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.proofs}</Typography>}
                  </Grid>
                </>
              )}

              <Grid item xs={12}>
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
              </Grid>
            </Grid>
          )}

          {/* Step 2: Confirm Transfer */}
          {activeStep === 1 && (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Confirm Your Transfer</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>${parseFloat(transferForm.amount).toLocaleString()}</Typography>
                    </Grid>
                    {transferForm.method === 'crypto-transfer' && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="text.secondary">Cryptocurrency</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedCrypto.name} ({selectedCrypto.symbol})</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Destination Account</Typography>
                       <Typography variant="body1" sx={{ fontWeight: 600 }}>
                         {accounts?.find(a => a._id === transferForm.destinationAccount)?.nickname || 'Not selected'}
                       </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Notification Email</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{transferForm.recipientEmail}</Typography>
                    </Grid>
                    {transferForm.method === 'crypto-transfer' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Source Wallet</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>{transferForm.sourceWalletAddress}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Uploaded Proofs</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{uploadedProofs.length} file(s)</Typography>
                        </Grid>
                      </>
                    )}
                    {transferForm.method !== 'crypto-transfer' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Recipient Name</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{transferForm.recipientName}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Bank Name</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{transferForm.recipientBankDetails.bankName}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">Account Number</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{transferForm.recipientBankDetails.accountNumber}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="text.secondary">SWIFT / Routing</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>{transferForm.recipientBankDetails.swiftCode || transferForm.recipientBankDetails.routingNumber}</Typography>
                        </Grid>
                      </>
                    )}
                  </Grid>
                </Paper>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', gap: 2 }}>
                <Button variant="outlined" onClick={() => setActiveStep(0)} sx={{ borderRadius: 2 }}>
                  Back
                </Button>
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
              </Grid>
            </Grid>
          )}

          {/* Step 3: Transfer Complete */}
          {activeStep === 2 && (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              <Grid item xs={12}>
                <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 64, color: '#22c55e', mb: 2 }} />
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Transfer Successful!</Typography>
                  <Typography variant="body1" sx={{ mb: 3 }}>
                    Your international transfer has been submitted successfully.
                  </Typography>
                  {transactionId && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Transaction ID: {transactionId}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    onClick={() => navigate('/transactions')}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                      boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                    }}
                  >
                    View Transactions
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Paper>
      </motion.div>
    );
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
        top: '-15%',
        right: '-10%',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,102,255,0.3) 0%, rgba(0,102,255,0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'none',
        display: { xs: 'none', md: 'block' }
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
        animation: 'none',
        display: { xs: 'none', md: 'block' }
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
        
        {selectedMethod ? renderMethodForm() : renderMethodCards()}
      </Box>
    </Box>
  );
};

export default InternationalTransfer;
