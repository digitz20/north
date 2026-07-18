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
import { createInternationalTransfer } from '../store/slices/transactionSlice';

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
  { id: 'crypto-transfer', name: 'Cryptocurrency', icon: '₿', description: 'Crypto wallet transfer' },
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
    if (!transferForm.destinationAccount) {
      newErrors.destinationAccount = 'Please select a destination account';
    }
    
    // Crypto-specific validation
    if (transferForm.method === 'crypto') {
      if (!transferForm.sourceWalletAddress) {
        newErrors.sourceWalletAddress = 'Please enter your source wallet address';
      }
      if (!transferForm.transactionHash) {
        newErrors.transactionHash = 'Please enter your transaction hash';
      }
      if (uploadedProofs.length === 0) {
        newErrors.proofs = 'Please upload at least one proof of transaction';
      }
    }
    
    // Wire transfer specific validation
    if (transferForm.method === 'wire') {
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
    
    // Create transfer data using proper backend field names
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
      description: 'Send funds to your cryptocurrency wallet.',
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

  const steps = ['Select Details', 'Confirm & Submit'];

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
            borderRadius: 5,
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
              borderRadius: 5,
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
            {transferForm.method === 'crypto' ? 'Cryptocurrency Transfer' : 'International Transfer'}
          </DialogTitle>
          <DialogContent>
            <Stepper activeStep={activeStep} sx={{ py: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {activeStep === 0 && (
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

                {/* Crypto-specific fields */}
                {transferForm.method === 'crypto' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Cryptocurrency"
                        value={transferForm.crypto}
                        onChange={(e) => handleCryptoChange(e.target.value)}
                        error={!!errors.crypto}
                      >
                        {cryptoOptions.map((crypto) => (
                          <MenuItem key={crypto.id} value={crypto.id}>
                            {crypto.name} ({crypto.symbol})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    
                    {selectedCrypto && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Our {selectedCrypto.name} Address:
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block' }}>
                                {selectedCrypto.address}
                              </Typography>
                            </Box>
                            <Tooltip title={copied ? "Copied!" : "Copy address"}>
                              <IconButton 
                                color="primary"
                                onClick={() => copyToClipboard(selectedCrypto.address)}
                              >
                                <ContentCopy />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Your Source Wallet Address"
                        value={transferForm.sourceWalletAddress}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, sourceWalletAddress: e.target.value }))}
                        error={!!errors.sourceWalletAddress}
                        helperText={errors.sourceWalletAddress || "Select from your saved crypto wallets or enter manually"}
                      >
                        {savedWallets.filter(wallet => wallet.crypto === transferForm.crypto).map((wallet) => (
                          <MenuItem key={wallet.id} value={wallet.address}>
                            {wallet.label} - {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                          </MenuItem>
                        ))}
                        {savedWallets.filter(wallet => wallet.crypto === transferForm.crypto).length === 0 && (
                          <MenuItem value="" disabled>No saved addresses for this cryptocurrency</MenuItem>
                        )}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Transaction Hash"
                        value={transferForm.transactionHash}
                        onChange={(e) => setTransferForm(prev => ({ ...prev, transactionHash: e.target.value }))}
                        error={!!errors.transactionHash}
                        helperText={errors.transactionHash}
                      />
                    </Grid>
                    
                    {/* Proof upload section */}
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        startIcon={<UploadFile />}
                        component="label"
                        sx={{ mr: 2 }}
                      >
                        Upload Transaction Proofs
                        <input
                          type="file"
                          hidden
                          multiple
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
                  </>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setOpenTransferDialog(false); setActiveStep(0); }}>
              Cancel
            </Button>
            {activeStep === 0 && (
              <Button 
                variant="contained"
                onClick={() => setActiveStep(1)}
              >
                Continue to Confirmation
              </Button>
            )}
            {activeStep === 1 && (
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