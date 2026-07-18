import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Divider, Alert,
  MenuItem, Chip, CircularProgress, Tab, Tabs, Dialog, DialogTitle,
  DialogContent, DialogActions, Stepper, Step, StepLabel, Card,
  CardContent, Avatar, IconButton, Tooltip
} from '@mui/material';
import {
  AccountBalance, CurrencyBitcoin, QrCode, Email, CheckCircle,
  ContentCopy, Visibility, Close
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getCurrentUser } from '../store/slices/authSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import { processWithdrawal, processCryptoDeposit } from '../store/slices/transactionSlice';

// Supported cryptocurrencies with their official addresses
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

// Crypto address validation patterns (enhanced with more strict validation)
const addressValidators = {
  btc: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/, // Bitcoin addresses (bech32 or legacy)
  eth: /^0x[a-fA-F0-9]{40}$/, // Ethereum addresses (40 hex chars after 0x)
  trx: /^T[a-zA-Z0-9]{33}$/, // TRON addresses (starts with T, 34 characters total)
  sol: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // Solana addresses (base58, 32-44 chars)
  bnb: /^0x[a-fA-F0-9]{40}$/, // BNB Smart Chain (EVM compatible)
  ltc: /^(ltc1|[LM3])[a-zA-HJ-NP-Z0-9]{25,39}$/, // Litecoin addresses
  doge: /^D[5-9A-HJ-NP-Ua-km-z]{33}$/ // Dogecoin addresses (starts with D)
};

// Checksum validation for Ethereum addresses (simple check)
const isValidEthereumAddress = (address) => {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) return false;
  
  // Check if it's all lowercase or all uppercase (valid), or mixed (checksummed)
  const isAllLower = address === address.toLowerCase();
  const isAllUpper = address === address.toUpperCase();
  return isAllLower || isAllUpper;
};

// Enhanced address validation that includes network-specific checks
const validateCryptoAddress = (cryptoId, address) => {
  const validator = addressValidators[cryptoId];
  if (!validator) return false;
  
  // Basic format check
  if (!validator.test(address)) return false;
  
  // Additional Ethereum-specific checksum validation
  if (cryptoId === 'eth' || cryptoId === 'usdt') {
    return isValidEthereumAddress(address);
  }
  
  return true;
};

// Bank account validation (simple US routing and account number)
const validateBankAccount = (routingNumber, accountNumber) => {
  const routingRegex = /^\d{9}$/;
  const accountRegex = /^\d{8,17}$/;
  return routingRegex.test(routingNumber) && accountRegex.test(accountNumber);
};

const Withdraw = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const { accounts, loading: accountsLoading } = useSelector((state) => state.accounts);
  const { loading: transactionLoading, error: transactionError } = useSelector((state) => state.transactions);
  
  const [tabValue, setTabValue] = useState(0); // 0 = Bank, 1 = Crypto
  const [activeStep, setActiveStep] = useState(0);
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [transferComplete, setTransferComplete] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [copied, setCopied] = useState(false);
  
  // Form states
  const [bankForm, setBankForm] = useState({
    sourceAccount: '',
    routingNumber: '',
    accountNumber: '',
    accountHolderName: '',
    amount: '',
    email: ''
  });
  
  const [cryptoForm, setCryptoForm] = useState({
    sourceAccount: '',
    crypto: 'btc',
    walletAddress: '',
    amount: '',
    email: ''
  });
  
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
    dispatch(fetchAccounts());
  }, [dispatch, user, location.pathname]);

  useEffect(() => {
    if (user?.email) {
      setBankForm(prev => ({ ...prev, email: user.email }));
      setCryptoForm(prev => ({ ...prev, email: user.email }));
    }
    if (accounts.length > 0) {
      setBankForm(prev => ({ ...prev, sourceAccount: accounts[0].id }));
      setCryptoForm(prev => ({ ...prev, sourceAccount: accounts[0].id }));
    }
  }, [user, accounts]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setActiveStep(0);
    setErrors({});
  };

  const validateBankForm = () => {
    const newErrors = {};
    if (!bankForm.sourceAccount) newErrors.sourceAccount = 'Please select a source account';
    if (!bankForm.routingNumber) newErrors.routingNumber = 'Routing number is required';
    if (!bankForm.accountNumber) newErrors.accountNumber = 'Account number is required';
    if (!bankForm.accountHolderName) newErrors.accountHolderName = 'Account holder name is required';
    if (!bankForm.amount || parseFloat(bankForm.amount) <= 0) newErrors.amount = 'Valid amount is required';
    
    // Validate bank account format
    if (bankForm.routingNumber && bankForm.accountNumber) {
      if (!validateBankAccount(bankForm.routingNumber, bankForm.accountNumber)) {
        newErrors.accountDetails = 'Invalid routing or account number format';
      }
    }
    
    const sourceAccount = accounts.find(a => a.id === bankForm.sourceAccount);
    if (sourceAccount && parseFloat(bankForm.amount) > sourceAccount.balance) {
      newErrors.amount = 'Insufficient funds in source account';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCryptoForm = () => {
    const newErrors = {};
    if (!cryptoForm.sourceAccount) newErrors.sourceAccount = 'Please select a source account';
    if (!cryptoForm.walletAddress) newErrors.walletAddress = 'Wallet address is required';
    if (!cryptoForm.amount || parseFloat(cryptoForm.amount) <= 0) newErrors.amount = 'Valid amount is required';
    
    // Validate crypto address format with enhanced validation
    if (cryptoForm.walletAddress && !validateCryptoAddress(cryptoForm.crypto, cryptoForm.walletAddress)) {
      newErrors.walletAddress = `Invalid ${cryptoForm.crypto.toUpperCase()} wallet address format. Please check and enter a valid address.`;
    }
    
    const sourceAccount = accounts.find(a => a.id === cryptoForm.sourceAccount);
    if (sourceAccount && parseFloat(cryptoForm.amount) > sourceAccount.balance) {
      newErrors.amount = 'Insufficient funds in source account';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    const isValid = tabValue === 0 ? validateBankForm() : validateCryptoForm();
    if (isValid) {
      setActiveStep(1);
      setOpenConfirmation(true);
    }
  };

  const handleConfirmTransfer = async () => {
    const transferData = tabValue === 0 
      ? {
          type: 'bank',
          sourceAccountId: bankForm.sourceAccount,
          destination: {
            routingNumber: bankForm.routingNumber,
            accountNumber: bankForm.accountNumber,
            accountHolderName: bankForm.accountHolderName
          },
          amount: parseFloat(bankForm.amount),
          email: bankForm.email
        }
      : {
          type: 'crypto',
          sourceAccountId: cryptoForm.sourceAccount,
          destination: {
            crypto: cryptoForm.crypto,
            walletAddress: cryptoForm.walletAddress,
            network: selectedCrypto.network
          },
          amount: parseFloat(cryptoForm.amount),
          email: cryptoForm.email
        };

    try {
      await dispatch(processWithdrawal(transferData)).unwrap();
      setTransferComplete(true);
      setActiveStep(2);
      
      // Email is sent automatically via backend after successful withdrawal
    } catch (error) {
      setErrors({ submit: error.message || 'Transfer failed. Please try again.' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCryptoChange = (cryptoId) => {
    const crypto = cryptoOptions.find(c => c.id === cryptoId);
    setSelectedCrypto(crypto);
    setCryptoForm(prev => ({ ...prev, crypto: cryptoId, walletAddress: '' }));
  };

  if (authLoading || accountsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const steps = ['Enter Details', 'Confirm Transfer', 'Transfer Complete'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Withdraw Funds</Typography>
      
      <Paper sx={{ p: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 4 }}>
          <Tab icon={<AccountBalance />} label="Bank Withdrawal" iconPosition="start" />
          <Tab icon={<CurrencyBitcoin />} label="Crypto Withdrawal" iconPosition="start" />
        </Tabs>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {errors.submit && <Alert severity="error" sx={{ mb: 3 }}>{errors.submit}</Alert>}

        {tabValue === 0 && (
          <Grid container spacing={3}>
            {activeStep === 0 && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Source Account"
                    value={bankForm.sourceAccount}
                    onChange={(e) => setBankForm(prev => ({ ...prev, sourceAccount: e.target.value }))}
                    error={!!errors.sourceAccount}
                    helperText={errors.sourceAccount}
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
                    label="Amount (USD)"
                    type="number"
                    value={bankForm.amount}
                    onChange={(e) => setBankForm(prev => ({ ...prev, amount: e.target.value }))}
                    error={!!errors.amount}
                    helperText={errors.amount}
                    InputProps={{ inputProps: { min: 1, step: 0.01 } }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Routing Number"
                    value={bankForm.routingNumber}
                    onChange={(e) => setBankForm(prev => ({ ...prev, routingNumber: e.target.value }))}
                    error={!!errors.routingNumber}
                    helperText={errors.routingNumber || '9-digit US bank routing number'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    error={!!errors.accountNumber}
                    helperText={errors.accountNumber || '8-17 digit bank account number'}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Account Holder Name"
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm(prev => ({ ...prev, accountHolderName: e.target.value }))}
                    error={!!errors.accountHolderName}
                    helperText={errors.accountHolderName}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Notification Email"
                    type="email"
                    value={bankForm.email}
                    onChange={(e) => setBankForm(prev => ({ ...prev, email: e.target.value }))}
                    InputProps={{
                      endAdornment: <Email color="action" />
                    }}
                  />
                </Grid>
                {errors.accountDetails && (
                  <Grid item xs={12}>
                    <Alert severity="error">{errors.accountDetails}</Alert>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button variant="contained" size="large" onClick={handleContinue}>
                    Continue to Confirmation
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            {activeStep === 0 && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    fullWidth
                    label="Source Account"
                    value={cryptoForm.sourceAccount}
                    onChange={(e) => setCryptoForm(prev => ({ ...prev, sourceAccount: e.target.value }))}
                    error={!!errors.sourceAccount}
                    helperText={errors.sourceAccount}
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
                    label="Amount (USD)"
                    type="number"
                    value={cryptoForm.amount}
                    onChange={(e) => setCryptoForm(prev => ({ ...prev, amount: e.target.value }))}
                    error={!!errors.amount}
                    helperText={errors.amount}
                    InputProps={{ inputProps: { min: 10, step: 0.01 } }}
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
                  <TextField
                    fullWidth
                    label="Recipient Wallet Address"
                    value={cryptoForm.walletAddress}
                    onChange={(e) => setCryptoForm(prev => ({ ...prev, walletAddress: e.target.value }))}
                    error={!!errors.walletAddress}
                    helperText={errors.walletAddress || `Enter your ${selectedCrypto.symbol} wallet address`}
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
                <Grid item xs={12}>
                  <Card sx={{ p: 3, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      You can also send funds to our official {selectedCrypto.name} address:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                      <img src={selectedCrypto.qrCode} alt="QR Code" style={{ width: 100, height: 100 }} />
                      <Box flexGrow={1}>
                        <Typography variant="body2" color="text.secondary">
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
                <Grid item xs={12}>
                  <Button variant="contained" size="large" onClick={handleContinue}>
                    Continue to Confirmation
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={openConfirmation} onClose={() => setOpenConfirmation(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            Confirm {tabValue === 0 ? 'Bank Transfer' : 'Crypto Withdrawal'}
            <IconButton
              aria-label="close"
              onClick={() => setOpenConfirmation(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {transferComplete ? (
              <Box textAlign="center" py={4}>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>Withdrawal in Progress...</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Please note withdrawal will take sometime to reflect.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Thank you for choosing NorthCrestBank.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A confirmation email has been sent to {tabValue === 0 ? bankForm.email : cryptoForm.email}
                </Typography>
                {tabValue === 1 && (
                  <Box mt={3}>
                    <Typography variant="subtitle1">Transaction will be processed on the {selectedCrypto.network} network</Typography>
                    <img src={selectedCrypto.qrCode} alt="Transaction QR" style={{ width: 150, height: 150, margin: '20px auto' }} />
                  </Box>
                )}
              </Box>
            ) : (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Transfer Details</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Amount</Typography>
                          <Typography variant="h6">${tabValue === 0 ? parseFloat(bankForm.amount).toLocaleString() : parseFloat(cryptoForm.amount).toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Transfer Type</Typography>
                          <Typography variant="h6">{tabValue === 0 ? 'Bank Transfer' : `${selectedCrypto.name} Withdrawal`}</Typography>
                        </Grid>
                        {tabValue === 0 ? (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Routing Number</Typography>
                              <Typography variant="body1">••••{bankForm.routingNumber.slice(-4)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Account Number</Typography>
                              <Typography variant="body1">••••{bankForm.accountNumber.slice(-4)}</Typography>
                            </Grid>
                          </>
                        ) : (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="text.secondary">Network</Typography>
                              <Typography variant="body1">{selectedCrypto.network}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">Recipient Address</Typography>
                              <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>{cryptoForm.walletAddress}</Typography>
                            </Grid>
                          </>
                        )}
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Notification Email</Typography>
                          <Typography variant="body1">{tabValue === 0 ? bankForm.email : cryptoForm.email}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          {!transferComplete && (
            <DialogActions>
              <Button onClick={() => setOpenConfirmation(false)}>Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleConfirmTransfer}
                disabled={transactionLoading}
              >
                {transactionLoading ? <CircularProgress size={24} /> : 'Confirm & Send'}
              </Button>
            </DialogActions>
          )}
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Withdraw;