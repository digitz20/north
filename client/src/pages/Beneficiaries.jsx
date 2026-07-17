import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Grid, Avatar, Chip, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [open, setOpen] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState([
    {
      id: 1,
      name: 'John Smith',
      accountNumber: '****1234',
      bank: 'NorthCrest Bank'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      accountNumber: '****5678',
      bank: 'Chase Bank'
    }
  ]);
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    accountNumber: '',
    bank: ''
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddBeneficiary = () => {
    if (newBeneficiary.name && newBeneficiary.accountNumber && newBeneficiary.bank) {
      setBeneficiaries([...beneficiaries, {
        id: Date.now(),
        ...newBeneficiary
      }]);
      setNewBeneficiary({ name: '', accountNumber: '', bank: '' });
      setOpen(false);
    }
  };

  const handleDelete = (id) => {
    setBeneficiaries(beneficiaries.filter(b => b.id !== id));
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: '100%' }}
    >
      <Box sx={{ mb: 6 }}>
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                Beneficiaries
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontSize: '1.1rem' }}>
                Manage your trusted beneficiaries for seamless fund transfers
              </Typography>
            </Box>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />} 
                onClick={handleClickOpen}
                sx={{ 
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontSize: '1rem',
                  boxShadow: '0 8px 20px rgba(0,102,255,0.3)',
                  '&:hover': {
                    boxShadow: '0 12px 30px rgba(0,102,255,0.4)'
                  }
                }}
              >
                Add Beneficiary
              </Button>
            </motion.div>
          </Box>
        </motion.div>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                borderRadius: 4, 
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Avatar sx={{ bgcolor: 'rgba(0,102,255,0.1)', width: 64, height: 64 }}>
                <PersonIcon sx={{ fontSize: 32, color: '#0066FF' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>{beneficiaries.length}</Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>Total Beneficiaries</Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                borderRadius: 4, 
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Avatar sx={{ bgcolor: 'rgba(0,200,150,0.1)', width: 64, height: 64 }}>
                <AccountBalanceIcon sx={{ fontSize: 32, color: '#00C896' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {beneficiaries.filter(b => b.bank === 'NorthCrest Bank').length}
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>Internal Bank</Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
        <Grid item xs={12} md={4}>
          <motion.div variants={itemVariants}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                borderRadius: 4, 
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 3
              }}
            >
              <Avatar sx={{ bgcolor: 'rgba(255,107,107,0.1)', width: 64, height: 64 }}>
                <AccountBalanceIcon sx={{ fontSize: 32, color: '#FF6B6B' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {beneficiaries.filter(b => b.bank !== 'NorthCrest Bank').length}
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>External Banks</Typography>
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      </Grid>

      <motion.div variants={itemVariants}>
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
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
                      key={b.id}
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
                          label={b.accountNumber} 
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
                          label={b.bank}
                          sx={{ 
                            bgcolor: b.bank === 'NorthCrest Bank' ? 'rgba(0,200,150,0.1)' : 'rgba(255,179,0,0.1)',
                            color: b.bank === 'NorthCrest Bank' ? '#00C896' : '#FFB300',
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
                              onClick={() => handleDelete(b.id)}
                              sx={{ 
                                bgcolor: 'rgba(255,107,107,0.1)',
                                '&:hover': { bgcolor: 'rgba(255,107,107,0.2)' }
                              }}
                            >
                              <DeleteIcon />
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
        </Paper>
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
          <TextField
            autoFocus
            margin="dense"
            label="Full Name"
            fullWidth
            value={newBeneficiary.name}
            onChange={(e) => setNewBeneficiary({...newBeneficiary, name: e.target.value})}
            sx={{ mb: 3 }}
            InputProps={{
              sx: { borderRadius: 2, fontSize: '1rem' }
            }}
          />
          <TextField
            margin="dense"
            label="Account Number"
            fullWidth
            value={newBeneficiary.accountNumber}
            onChange={(e) => setNewBeneficiary({...newBeneficiary, accountNumber: e.target.value})}
            sx={{ mb: 3 }}
            InputProps={{
              sx: { borderRadius: 2, fontSize: '1rem' }
            }}
          />
          <TextField
            margin="dense"
            label="Bank Name"
            fullWidth
            value={newBeneficiary.bank}
            onChange={(e) => setNewBeneficiary({...newBeneficiary, bank: e.target.value})}
            InputProps={{
              sx: { borderRadius: 2, fontSize: '1rem' }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
          <Button 
            onClick={handleClose}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 600,
              color: '#64748b',
              fontSize: '1rem'
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddBeneficiary} 
            variant="contained"
            disabled={!newBeneficiary.name || !newBeneficiary.accountNumber || !newBeneficiary.bank}
            sx={{ 
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1,
              borderRadius: 2,
              fontSize: '1rem',
              boxShadow: '0 8px 20px rgba(0,102,255,0.3)'
            }}
          >
            Add Beneficiary
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default Beneficiaries;