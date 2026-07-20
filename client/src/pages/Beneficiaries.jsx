import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Grid, Avatar, Chip, Tooltip,
  Alert, CircularProgress
} from '@mui/material';
import { Delete, Add, Person, AccountBalance } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchBeneficiaries, addBeneficiary, deleteBeneficiary } from '../store/slices/beneficiarySlice';
import PremiumCard from '../components/PremiumCard';
import PremiumButton from '../components/PremiumButton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const Beneficiaries = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { beneficiaries, loading } = useSelector((state) => state.beneficiaries);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '021000021'
  });

  useEffect(() => {
    dispatch(fetchBeneficiaries());
  }, [dispatch, location.pathname]);

  const handleClickOpen = () => {
    setOpen(true);
    setError(null);
  };

  const handleClose = () => {
    setOpen(false);
    setNewBeneficiary({ name: '', accountNumber: '', bankName: '', routingNumber: '021000021' });
    setError(null);
  };

  const handleAddBeneficiary = async () => {
    if (!newBeneficiary.name || !newBeneficiary.accountNumber || !newBeneficiary.bankName) {
      setError('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await dispatch(addBeneficiary(newBeneficiary)).unwrap();
      setNewBeneficiary({ name: '', accountNumber: '', bankName: '', routingNumber: '021000021' });
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to add beneficiary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    dispatch(deleteBeneficiary(id));
  };

  const totalBeneficiaries = beneficiaries.length;
  const internalBank = beneficiaries.filter(b => b.isInternal).length;
  const externalBanks = totalBeneficiaries - internalBank;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: '100%' }}
    >
      <Box sx={{ mb: 6 }}>
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                Beneficiaries
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem' }}>
                Manage your trusted beneficiaries for seamless fund transfers
              </Typography>
            </Box>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <PremiumButton
                variant="primary"
                startIcon={<Add />}
                onClick={handleClickOpen}
              >
                Add Beneficiary
              </PremiumButton>
            </motion.div>
          </Box>
        </motion.div>

        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <PremiumCard
                sx={{ height: '100%' }}
                icon={<Person sx={{ fontSize: 32, color: '#0066FF' }} />}
              >
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{totalBeneficiaries}</Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>Total Beneficiaries</Typography>
              </PremiumCard>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <PremiumCard
                sx={{ height: '100%' }}
                icon={<AccountBalance sx={{ fontSize: 32, color: '#00C896' }} />}
              >
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{internalBank}</Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>Internal Bank</Typography>
              </PremiumCard>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <PremiumCard
                sx={{ height: '100%' }}
                icon={<AccountBalance sx={{ fontSize: 32, color: '#FF6B6B' }} />}
              >
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{externalBanks}</Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>External Banks</Typography>
              </PremiumCard>
            </motion.div>
          </Grid>
        </Grid>
      </Box>

      <motion.div variants={itemVariants}>
        <PremiumCard title="Beneficiary List">
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : beneficiaries.length === 0 ? (
            <Box sx={{ p: 8, textAlign: 'center' }}>
              <Person sx={{ fontSize: 80, color: '#ccc', mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2, color: '#666' }}>No beneficiaries found</Typography>
              <Typography variant="body1" sx={{ mb: 4, color: '#888' }}>
                You don't have any beneficiaries yet. Add your first beneficiary to get started!
              </Typography>
              <PremiumButton variant="primary" startIcon={<Add />} onClick={handleClickOpen}>
                Add Your First Beneficiary
              </PremiumButton>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem', py: 3 }}>Beneficiary</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem', py: 3 }}>Account Number</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem', py: 3 }}>Bank</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '1rem', py: 3 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {beneficiaries.map((b) => (
                      <motion.tr
                        key={b._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, transition: { duration: 0.3 } }}
                        whileHover={{ backgroundColor: 'rgba(0,102,255,0.02)' }}
                        style={{ borderBottom: '1px solid #f1f5f9' }}
                      >
                        <TableCell sx={{ py: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'rgba(0,102,255,0.1)', color: '#0066FF', fontWeight: 700 }}>
                              {b.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>{b.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ py: 3 }}>
                          <Chip
                            label={`****${b.accountNumber.slice(-4)}`}
                            variant="outlined"
                            sx={{
                              borderColor: '#cbd5e1',
                              fontWeight: 600,
                              fontSize: '0.9rem'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 3 }}>
                          <Chip
                            label={b.bankName}
                            sx={{
                              bgcolor: b.isInternal ? 'rgba(0,200,150,0.1)' : 'rgba(255,179,0,0.1)',
                              color: b.isInternal ? '#00C896' : '#FFB300',
                              fontWeight: 600,
                              border: 'none'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ py: 3 }}>
                          <Tooltip title="Delete Beneficiary">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <IconButton
                                color="error"
                                onClick={() => handleDelete(b._id)}
                                sx={{
                                  bgcolor: 'rgba(255,107,107,0.1)',
                                  '&:hover': { bgcolor: 'rgba(255,107,107,0.2)' }
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </motion.div>
                          </Tooltip>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </PremiumCard>
      </motion.div>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', p: 4 }}>
          <DialogTitle sx={{ color: 'white', p: 0, fontWeight: 700, fontSize: '1.5rem' }}>
            Add New Beneficiary
          </DialogTitle>
        </Box>
        <DialogContent sx={{ p: 4, pt: 5 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            fullWidth
            value={newBeneficiary.name}
            onChange={(e) => setNewBeneficiary({...newBeneficiary, name: e.target.value})}
            sx={{ mb: 3 }}
          />
          <TextField
            margin="dense"
            label="Account Number"
            fullWidth
            value={newBeneficiary.accountNumber}
            onChange={(e) => setNewBeneficiary({...newBeneficiary, accountNumber: e.target.value})}
            sx={{ mb: 3 }}
          />
          <TextField
            margin="dense"
            label="Bank Name"
            fullWidth
            value={newBeneficiary.bankName}
            onChange={(e) => setNewBeneficiary({...newBeneficiary, bankName: e.target.value})}
            sx={{ mb: 3 }}
          />
          <TextField
            margin="dense"
            label="Routing Number (Optional)"
            fullWidth
            value={newBeneficiary.routingNumber}
            onChange={(e) => setNewBeneficiary({...newBeneficiary, routingNumber: e.target.value})}
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
          <PremiumButton variant="ghost" onClick={handleClose}>
            Cancel
          </PremiumButton>
          <PremiumButton
            variant="primary"
            onClick={handleAddBeneficiary}
            loading={submitting}
            disabled={!newBeneficiary.name || !newBeneficiary.accountNumber || !newBeneficiary.bankName}
          >
            Add Beneficiary
          </PremiumButton>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default Beneficiaries;
