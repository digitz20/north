import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, Stepper, Step, StepLabel, Card, CardContent,
  Avatar, IconButton, Tooltip, Divider, MenuItem
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Add, ContentCopy, Visibility, UploadFile, CheckCircle, Close, Email } from '@mui/icons-material';
import { 
  getUserInvestments, getInvestmentTypes, createInvestment, sellInvestment 
} from '../store/slices/investmentSlice';
import { processCryptoDeposit } from '../store/slices/transactionSlice';
import { getCurrentUser } from '../store/slices/authSlice';
import { fetchAccounts } from '../store/slices/accountSlice';

// New supported cryptocurrencies with your specified addresses
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

const Investments = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { investments, loading: investmentsLoading, error: investmentsError, investmentTypes } = useSelector(state => state.investments);
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const { loading: transactionLoading, error: transactionError } = useSelector((state) => state.transactions);
  
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [transferComplete, setTransferComplete] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [copied, setCopied] = useState(false);
  // Support multiple uploaded images/proofs
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Form states
  const [investmentForm, setInvestmentForm] = useState({
    investmentCategory: 'crypto', // crypto, stocks, realestate
    selectedPlan: '',
    amount: '',
    destinationAccount: '',
    crypto: 'btc',
    transactionHash: '',
    walletAddress: '', // New wallet selection field for all categories
    savedWalletAddress: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({});
  
  // Investment plans matching your requirements
  const investmentPlans = {
    crypto: [
      { id: 'btc-growth', name: 'BTC Growth', description: 'Large-cap crypto exposure', minAmount: 10000, tenor: '30–180 days', payout: 'Flexible' },
      { id: 'altcoin-select', name: 'Altcoin Select', description: 'Curated mid-cap basket', minAmount: 10000, tenor: '60–180 days', payout: 'End of tenor' },
      { id: 'stable-yield', name: 'Stable Yield', description: 'Stablecoin-based strategies', minAmount: 10000, tenor: '30–90 days', payout: 'Monthly' }
    ],
    stocks: [
      { id: 'blue-chip', name: 'Blue Chip Bundle', description: 'Diversified large-cap stocks', minAmount: 5000, tenor: 'Flexible', payout: 'Flexible' },
      { id: 'dividend-focus', name: 'Dividend Focus', description: 'Income-oriented equities', minAmount: 3000, tenor: 'Quarterly', payout: 'Quarterly' },
      { id: 'tech-momentum', name: 'Tech Momentum', description: 'High-growth sector tilt', minAmount: 2500, tenor: '90–180 days', payout: 'End of tenor' }
    ],
    realestate: [
      { id: 'rental-income', name: 'Rental Income Fund', description: 'Residential cashflow pool', minAmount: 10000, tenor: '6–12 months', payout: 'Monthly' },
      { id: 'industrial-reit', name: 'Industrial REIT', description: 'Warehouses & logistics', minAmount: 7500, tenor: '12 months', payout: 'End of tenor' },
      { id: 'commercial-mix', name: 'Commercial Mix', description: 'Office & retail blend', minAmount: 8000, tenor: '9–18 months', payout: 'End of tenor' }
    ]
  };

  useEffect(() => {
    // Always refetch investment data when navigating to investments page
    dispatch(getUserInvestments());
    dispatch(getInvestmentTypes());
    if (!user) dispatch(getCurrentUser());
    dispatch(fetchAccounts());
  }, [dispatch, location.pathname, user]);

  useEffect(() => {
    if (user?.email) {
      setInvestmentForm(prev => ({ ...prev, email: user.email }));
    }
    if (accounts.length > 0) {
      setInvestmentForm(prev => ({ ...prev, destinationAccount: accounts[0].id }));
    }
    // Set default selected plan for crypto category
    if (investmentPlans.crypto.length > 0 && !investmentForm.selectedPlan) {
      setInvestmentForm(prev => ({ ...prev, selectedPlan: investmentPlans.crypto[0].id }));
    }
  }, [user, accounts]);

  // Handle crypto selection change
  const handleCryptoChange = (cryptoId) => {
    const crypto = cryptoOptions.find(c => c.id === cryptoId);
    setSelectedCrypto(crypto);
    setInvestmentForm(prev => ({ ...prev, crypto: cryptoId, savedWalletAddress: '', transactionHash: '' }));
  };

  // Handle category change to update available plans
  const handleCategoryChange = (categoryId) => {
    const plans = investmentPlans[categoryId];
    setInvestmentForm(prev => ({ 
      ...prev, 
      investmentCategory: categoryId,
      selectedPlan: plans[0].id,
      amount: ''
    }));
  };

  // Handle multiple image uploads
  const handleMultipleImagesUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedImages(prev => [...prev, ...files]);
    
    // Create previews for all new images
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  // Remove an uploaded image
  const removeImage = (index) => {
    // Only revoke if the blob URL still exists
    if (imagePreviews[index]) {
      try {
        URL.revokeObjectURL(imagePreviews[index]);
      } catch (e) {
        console.warn('Could not revoke blob URL:', e);
      }
    }
    
    const newImages = [...uploadedImages];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setUploadedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Cleanup all blob URLs when component unmounts
  useEffect(() => {
    return () => {
      // Revoke all remaining blob URLs to prevent memory leaks
      imagePreviews.forEach(preview => {
        try {
          URL.revokeObjectURL(preview);
        } catch (e) {
          console.warn('Cleanup: Could not revoke blob URL:', e);
        }
      });
    };
  }, []);

  // Copy address to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Validate the investment form
  const validateInvestmentForm = () => {
    const newErrors = {};
    if (!investmentForm.destinationAccount) newErrors.destinationAccount = 'Please select a destination account';
    if (!investmentForm.walletAddress) newErrors.walletAddress = 'Please select a payment wallet';
    if (!investmentForm.amount || parseFloat(investmentForm.amount) <= 0) newErrors.amount = 'Please enter a valid amount';
    
    // Validate amount against selected plan's minimum
    const currentPlan = investmentPlans[investmentForm.investmentCategory]?.find(p => p.id === investmentForm.selectedPlan);
    if (currentPlan && parseFloat(investmentForm.amount) < currentPlan.minAmount) {
      newErrors.amount = `Minimum investment for this plan is $${currentPlan.minAmount.toLocaleString()}`;
    }

    if (!investmentForm.transactionHash) newErrors.transactionHash = 'Please enter your transaction hash';
    if (uploadedImages.length === 0) newErrors.images = 'Please upload at least one screenshot/proof of your transaction';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    const isValid = validateInvestmentForm();
    if (isValid) {
      if (activeStep === 0) {
        // From plan selection (step 0) to payment method (step 1) - this is what "Continue to Payment Review" button should do
        setActiveStep(1);
        // Smooth scroll to the new content
        setTimeout(() => {
          window.scrollTo({
            top: document.querySelector('[role="dialog"]')?.offsetTop || 0,
            behavior: 'smooth'
          });
        }, 100);
      } else if (activeStep === 1) {
        // From payment method (step 1) to confirmation, which will show the confirm & submit button
        // The UI already has the confirmation section rendered when activeStep === 1, so we just ensure it's visible
        setTimeout(() => {
          const confirmSection = document.querySelector('.MuiDialogActions-root');
          if (confirmSection) {
            confirmSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  };
  
  const handleBackToPlanSelection = () => {
    setActiveStep(0);
  };
  
  const handleBackToPaymentMethod = () => {
    setActiveStep(1);
  };

  const handleConfirmInvestment = async () => {
    const depositData = {
      type: 'investment',
      destinationAccountId: investmentForm.destinationAccount,
      source: {
        crypto: investmentForm.crypto,
        transactionHash: investmentForm.transactionHash,
        network: selectedCrypto.network,
        proofImages: uploadedImages // Send all uploaded proof images
      },
      amount: parseFloat(investmentForm.amount),
      email: investmentForm.email,
      investmentDetails: {
        category: investmentForm.investmentCategory,
        planId: investmentForm.selectedPlan
      }
    };

    try {
      await dispatch(processCryptoDeposit(depositData)).unwrap();
      // Also create the investment record
      await dispatch(createInvestment({
        ...investmentForm,
        amount: parseFloat(investmentForm.amount),
        proofImages: uploadedImages // Pass proof images to backend for email attachments
      })).unwrap();
      
      setTransferComplete(true);
      setActiveStep(2);
      // Email is sent automatically via backend after successful investment initiation
    } catch (error) {
      setErrors({ submit: error.message || 'Investment failed. Please try again.' });
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setActiveStep(0);
    setTransferComplete(false);
    setUploadedImages([]);
    setImagePreviews([]);
    // Reset form
    setInvestmentForm({
      investmentCategory: 'crypto',
      selectedPlan: '',
      amount: '',
      destinationAccount: accounts[0]?.id || '',
      crypto: 'btc',
      transactionHash: '',
      walletAddress: '', // New wallet selection field
      savedWalletAddress: '',
      email: user?.email || ''
    });
  };

  const handleSellInvestment = async (id) => {
    try {
      await dispatch(sellInvestment(id)).unwrap();
    } catch (err) {
      console.error('Failed to sell investment:', err);
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.invested, 0);
  const totalCurrent = investments.reduce((sum, inv) => sum + inv.currentValue, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" gutterBottom>Investments</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
        >
          Add New Investment
        </Button>
      </Box>

      {/* Error State */}
      {investmentsError && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          {investmentsError}
        </Alert>
      )}

      {/* Loading State */}
      {investmentsLoading || authLoading || accountsLoading || transactionLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" color="text.secondary">Total Invested</Typography>
                <Typography variant="h4">${totalInvested.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" color="text.secondary">Current Value</Typography>
                <Typography variant="h4" color={totalCurrent >= totalInvested ? "success.main" : "error.main"}>
                  ${totalCurrent.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {investments.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, color: '#666' }}>No investments found</Typography>
              <Typography variant="body1" sx={{ mb: 4, color: '#888' }}>
                You don't have any investments yet. Start investing to grow your wealth!
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4
                }}
              >
                Create Your First Investment
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Invested</TableCell>
                    <TableCell>Current Value</TableCell>
                    <TableCell>Returns</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {investments.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.type}</TableCell>
                      <TableCell>{inv.name}</TableCell>
                      <TableCell>${inv.invested.toLocaleString()}</TableCell>
                      <TableCell>${inv.currentValue.toLocaleString()}</TableCell>
                      <TableCell>
                        <Typography color={inv.currentValue >= inv.invested ? "success.main" : "error.main"}>
                          {inv.returns}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          color="error"
                          onClick={() => handleSellInvestment(inv.id)}
                          sx={{ textTransform: 'none' }}
                        >
                          Sell
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* New Investment Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          color: 'white',
          fontWeight: 700,
          position: 'relative'
        }}>
          Fund Your Investment
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          {errors.submit && <Alert severity="error" sx={{ mb: 3 }}>{errors.submit}</Alert>}
          {errors.images && <Alert severity="error" sx={{ mb: 3 }}>{errors.images}</Alert>}
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {['Step 1: Choose Your Plan', 'Step 2: Select Payment Method', 'Step 3: Complete Payment', 'Step 4: Confirmation'].map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Grid container spacing={3}>
              {/* Step 1: Choose Investment Category */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Step 1: Choose Your Investment Category</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>Select the type of investment you'd like to make</Typography>
              </Grid>

              {/* Category Selector */}
              <Grid item xs={12} md={4}>
                <Button 
                  fullWidth
                  variant={investmentForm.investmentCategory === 'crypto' ? 'contained' : 'outlined'}
                  onClick={() => handleCategoryChange('crypto')}
                  sx={{ py: 3, fontSize: '1.1rem' }}
                >
                  🪙 Crypto
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button 
                  fullWidth
                  variant={investmentForm.investmentCategory === 'stocks' ? 'contained' : 'outlined'}
                  onClick={() => handleCategoryChange('stocks')}
                  sx={{ py: 3, fontSize: '1.1rem' }}
                >
                  📈 Stocks
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Button 
                  fullWidth
                  variant={investmentForm.investmentCategory === 'realestate' ? 'contained' : 'outlined'}
                  onClick={() => handleCategoryChange('realestate')}
                  sx={{ py: 3, fontSize: '1.1rem' }}
                >
                  🏠 Real Estate
                </Button>
              </Grid>

              {/* Investment Plans for Selected Category */}
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }} />
                <Typography variant="h5" gutterBottom fontWeight="bold">
                  {investmentForm.investmentCategory === 'crypto' ? 'Crypto Investment Plans' : 
                   investmentForm.investmentCategory === 'stocks' ? 'Stock Investment Plans' : 'Real Estate Investment Plans'}
                </Typography>
                {investmentForm.investmentCategory === 'stocks' && <Typography variant="body1" color="text.secondary" gutterBottom>Choose an equity strategy that fits your goals</Typography>}
                {investmentForm.investmentCategory === 'realestate' && <Typography variant="body1" color="text.secondary" gutterBottom>Choose a property investment strategy</Typography>}
                {investmentForm.investmentCategory === 'crypto' && <Typography variant="body1" color="text.secondary" gutterBottom>Choose a cryptocurrency investment strategy</Typography>}
                
                <Grid container spacing={3} mt={1}>
                  {investmentPlans[investmentForm.investmentCategory].map((plan) => (
                    <Grid item xs={12} md={4} key={plan.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          border: investmentForm.selectedPlan === plan.id ? '3px solid #0066FF' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': { boxShadow: 8, transform: 'translateY(-2px)' }
                        }}
                        onClick={() => setInvestmentForm(prev => ({ ...prev, selectedPlan: plan.id }))}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Typography variant="h6" fontWeight="bold">{plan.name}</Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>{plan.description}</Typography>
                          <Box mt={2}>
                            <Typography variant="body2" display="block"><strong>Tenor:</strong> {plan.tenor}</Typography>
                            <Typography variant="body2" display="block"><strong>Minimum:</strong> ${plan.minAmount.toLocaleString()}</Typography>
                            <Typography variant="body2" display="block"><strong>Payout:</strong> {plan.payout}</Typography>
                          </Box>
                          
                          {/* Amount input for this plan */}
                          {investmentForm.selectedPlan === plan.id && (
                            <Box mt={3}>
                              <TextField
                                fullWidth
                                label="Enter Investment Amount (USD)"
                                type="number"
                                value={investmentForm.amount}
                                onChange={(e) => setInvestmentForm({...investmentForm, amount: e.target.value})}
                                error={!!errors.amount}
                                helperText={errors.amount || `Minimum $${plan.minAmount.toLocaleString()} required.`}
                                InputProps={{ inputProps: { min: plan.minAmount, step: 0.01 } }}
                              />
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Continue to next step button */}
              {investmentForm.selectedPlan && investmentForm.amount >= investmentPlans[investmentForm.investmentCategory].find(p => p.id === investmentForm.selectedPlan)?.minAmount && (
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    fullWidth
                    onClick={() => setActiveStep(1)}
                    sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', py: 2, mt: 2, fontSize: '1.1rem' }}
                  >
                    Continue to Payment Method →
                  </Button>
                </Grid>
              )}
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={3}>
              {/* Step 2: Select Payment Method */}
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Step 2: Select Your Payment Method</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>Choose how you'd like to fund your investment</Typography>
              </Grid>

              {/* Crypto Payment Details (only show for crypto category) */}
              {investmentForm.investmentCategory === 'crypto' && (
                <>
                  <Grid item xs={12}><Divider sx={{ my: 3 }} /></Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Select Cryptocurrency to send payment:</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Cryptocurrency"
                      value={investmentForm.crypto}
                      onChange={(e) => handleCryptoChange(e.target.value)}
                      sx={{ mt: 1 }}
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
                      label="Destination Account"
                      select
                      value={investmentForm.destinationAccount}
                      onChange={(e) => setInvestmentForm({...investmentForm, destinationAccount: e.target.value})}
                      error={!!errors.destinationAccount}
                      helperText={errors.destinationAccount}
                    >
                      {accounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.nickname} - ${account.balance.toLocaleString()}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField
                        select
                        fullWidth
                        label="Your Saved Wallet Address (Source)"
                        value={investmentForm.savedWalletAddress || ''}
                        onChange={(e) => setInvestmentForm(prev => ({ ...prev, transactionHash: e.target.value, savedWalletAddress: e.target.value }))}
                        helperText="Select from your saved crypto wallets or enter a new one below"
                      >
                        {savedWallets.filter(wallet => wallet.crypto === investmentForm.crypto).map((wallet) => (
                          <MenuItem key={wallet.id} value={wallet.address}>
                            {wallet.label} - {wallet.address.substring(0, 10)}...{wallet.address.substring(wallet.address.length - 8)}
                          </MenuItem>
                        ))}
                        {savedWallets.filter(wallet => wallet.crypto === investmentForm.crypto).length === 0 && (
                          <MenuItem value="" disabled>No saved addresses for this cryptocurrency</MenuItem>
                        )}
                      </TextField>
                      {investmentForm.savedWalletAddress && (
                        <Tooltip title="Copy address">
                          <IconButton 
                            color="primary" 
                            onClick={() => {
                              navigator.clipboard.writeText(investmentForm.savedWalletAddress);
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
                      value={investmentForm.transactionHash}
                      onChange={(e) => setInvestmentForm({...investmentForm, transactionHash: e.target.value, savedWalletAddress: ''})}
                      error={!!errors.transactionHash}
                      helperText={errors.transactionHash || `Enter your ${selectedCrypto.symbol} transaction hash`}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Notification Email"
                      type="email"
                      value={investmentForm.email}
                      onChange={(e) => setInvestmentForm({...investmentForm, email: e.target.value})}
                      InputProps={{ endAdornment: <Email color="action" /> }}
                    />
                  </Grid>

                  {/* Multiple image upload support */}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<UploadFile />}
                      sx={{ height: '56px', borderStyle: 'dashed' }}
                    >
                      Upload Multiple Transaction Proofs (Screenshots)
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleMultipleImagesUpload}
                      />
                    </Button>
                    {/* Show all uploaded image previews */}
                    {imagePreviews.length > 0 && (
                      <Grid container spacing={2} mt={2}>
                        {imagePreviews.map((preview, index) => (
                          <Grid item xs={6} md={3} key={index}>
                            <Box position="relative">
                              <img src={preview} alt={`Transaction proof ${index+1}`} style={{ width: '100%', borderRadius: 4 }} />
                              <IconButton
                                size="small"
                                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'white' }}
                                onClick={() => removeImage(index)}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Grid>

                  {/* Our official crypto address to send payment to */}
                  <Grid item xs={12}>
                    <Card sx={{ p: 3, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Send your {selectedCrypto.name} to our official address:
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                        <img src={selectedCrypto.qrCode} alt="QR Code" style={{ width: 100, height: 100 }} />
                        <Box flexGrow={1}>
                          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                            {selectedCrypto.address}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Network: {selectedCrypto.network}
                          </Typography>
                          <Box mt={1}>
                            <Tooltip title={copied ? "Copied!" : "Copy address"}>
                              <IconButton onClick={() => copyToClipboard(selectedCrypto.address)} size="small">
                                <ContentCopy />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View QR Code">
                              <IconButton onClick={() => window.open(selectedCrypto.qrCode, '_blank')} size="small">
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>

                  {/* Navigation buttons */}
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      size="large" 
                      fullWidth
                      onClick={handleBackToPlanSelection}
                      sx={{ py: 2 }}
                    >
                      ← Back to Plan Selection
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth
                      onClick={handleContinue}
                      sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', py: 2 }}
                    >
                      Continue to Payment Review →
                    </Button>
                  </Grid>
                </>
              )}

              {/* Payment details for all non-crypto categories (stocks/real estate - fiat payment options */}
              {investmentForm.investmentCategory !== 'crypto' && (
                <>
                  <Grid item xs={12}><Divider sx={{ my: 3 }} /></Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Complete your payment:</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Destination Account"
                      select
                      value={investmentForm.destinationAccount}
                      onChange={(e) => setInvestmentForm({...investmentForm, destinationAccount: e.target.value})}
                      error={!!errors.destinationAccount}
                      helperText={errors.destinationAccount}
                    >
                      {accounts.map((account) => (
                        <MenuItem key={account.id} value={account.id}>
                          {account.nickname} - ${account.balance.toLocaleString()}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Transaction ID / Bank Reference"
                      value={investmentForm.transactionHash}
                      onChange={(e) => setInvestmentForm({...investmentForm, transactionHash: e.target.value})}
                      error={!!errors.transactionHash}
                      helperText={errors.transactionHash || 'Enter your bank transfer reference ID'}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Notification Email"
                      type="email"
                      value={investmentForm.email}
                      onChange={(e) => setInvestmentForm({...investmentForm, email: e.target.value})}
                      InputProps={{ endAdornment: <Email color="action" /> }}
                    />
                  </Grid>

                  {/* Multiple image upload support for all categories */}
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={<UploadFile />}
                      sx={{ height: '56px', borderStyle: 'dashed' }}
                    >
                      Upload Multiple Transaction Proofs (Screenshots)
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleMultipleImagesUpload}
                      />
                    </Button>
                    {/* Show all uploaded image previews */}
                    {imagePreviews.length > 0 && (
                      <Grid container spacing={2} mt={2}>
                        {imagePreviews.map((preview, index) => (
                          <Grid item xs={6} md={3} key={index}>
                            <Box position="relative">
                              <img src={preview} alt={`Transaction proof ${index+1}`} style={{ width: '100%', borderRadius: 4 }} />
                              <IconButton
                                size="small"
                                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'white' }}
                                onClick={() => removeImage(index)}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Grid>

                  {/* Bank transfer details for fiat payments */}
                  <Grid item xs={12}>
                    <Card sx={{ p: 3, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Bank Transfer Details:
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bank Name: NorthCrest Bank USA<br/>
                        Routing Number: 021000021<br/>
                        Account Number: 1234567890<br/>
                        SWIFT/BIC: NCBKUS33<br/>
                        Reference: Include your account ID for automatic verification
                      </Typography>
                    </Card>
                  </Grid>

                  {/* Navigation buttons */}
                  <Grid item xs={6}>
                    <Button 
                      variant="outlined" 
                      size="large" 
                      fullWidth
                      onClick={handleBackToPlanSelection}
                      sx={{ py: 2 }}
                    >
                      ← Back to Plan Selection
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button 
                      variant="contained" 
                      size="large" 
                      fullWidth
                      onClick={handleContinue}
                      sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', py: 2 }}
                    >
                      Continue to Payment Review →
                    </Button>
                  </Grid>
                </>
              )}
            </Grid>
          )}

          {/* Step 2: Confirmation */}
          {activeStep === 1 && !transferComplete && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Investment Details</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Amount</Typography>
                        <Typography variant="h6">${parseFloat(investmentForm.amount).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Category</Typography>
                        <Typography variant="h6">{investmentForm.investmentCategory.charAt(0).toUpperCase() + investmentForm.investmentCategory.slice(1)}</Typography>
                      </Grid>
                      {investmentForm.investmentCategory === 'crypto' && (
                        <>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary">Cryptocurrency</Typography>
                            <Typography variant="h6">{selectedCrypto.name}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">Transaction Hash</Typography>
                            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{investmentForm.transactionHash}</Typography>
                          </Grid>
                        </>
                      )}
                      {imagePreviews.length > 0 && (
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Uploaded Proofs</Typography>
                          <Grid container spacing={2} mt={1}>
                            {imagePreviews.map((preview, index) => (
                              <Grid item xs={6} md={3} key={index}>
                                <img src={preview} alt={`Proof ${index+1}`} style={{ width: '100%', borderRadius: 4 }} />
                              </Grid>
                            ))}
                          </Grid>
                        </Grid>
                      )}
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">Notification Email</Typography>
                        <Typography variant="body1">{investmentForm.email}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <DialogActions>
                  <Button onClick={() => setActiveStep(0)}>Back</Button>
                  <Button 
                    variant="contained" 
                    onClick={handleConfirmInvestment}
                    disabled={transactionLoading}
                    sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)' }}
                  >
                    {transactionLoading ? <CircularProgress size={24} /> : 'Confirm & Submit Investment'}
                  </Button>
                </DialogActions>
              </Grid>
            </Grid>
          )}

          {/* Step 3: Complete */}
          {transferComplete && (
            <Box textAlign="center" py={4}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>Investment Submitted Successfully!</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Your investment is being processed and will reflect in your account shortly.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                A confirmation email has been sent to {investmentForm.email}
              </Typography>
              <Box mt={4}>
                <Button variant="contained" onClick={handleCloseDialog}>
                  Back to Investments
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Investments;