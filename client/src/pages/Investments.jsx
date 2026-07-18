import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, CircularProgress, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { Add } from '@mui/icons-material';
import { 
  getUserInvestments, getInvestmentTypes, createInvestment, sellInvestment 
} from '../store/slices/investmentSlice';

const Investments = () => {
  const dispatch = useDispatch();
  const { investments, loading, error, investmentTypes } = useSelector(state => state.investments);
  const [open, setOpen] = useState(false);
  const [newInvestmentData, setNewInvestmentData] = useState({
    investmentTypeId: '',
    amount: ''
  });

  useEffect(() => {
    if (investments.length === 0) {
      dispatch(getUserInvestments());
      dispatch(getInvestmentTypes());
    }
  }, [dispatch, investments.length]);

  useEffect(() => {
    // Set default investment type when types load
    if (investmentTypes.length > 0 && !newInvestmentData.investmentTypeId) {
      setNewInvestmentData(prev => ({ ...prev, investmentTypeId: investmentTypes[0]._id }));
    }
  }, [investmentTypes, newInvestmentData.investmentTypeId]);

  const handleCreateInvestment = async () => {
    try {
      await dispatch(createInvestment({
        ...newInvestmentData,
        amount: parseFloat(newInvestmentData.amount)
      })).unwrap();
      setOpen(false);
      // Reset form
      setNewInvestmentData({ investmentTypeId: investmentTypes[0]?._id || '', amount: '' });
    } catch (err) {
      console.error('Failed to create investment:', err);
    }
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
      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Add New Investment
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Stack spacing={3}>
            <TextField
              label="Investment Type"
              select
              fullWidth
              value={newInvestmentData.investmentTypeId}
              onChange={(e) => setNewInvestmentData({...newInvestmentData, investmentTypeId: e.target.value})}
              SelectProps={{ native: true }}
            >
              {investmentTypes.map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              ))}
            </TextField>
            <TextField
              label="Investment Amount ($)"
              type="number"
              fullWidth
              value={newInvestmentData.amount}
              onChange={(e) => setNewInvestmentData({...newInvestmentData, amount: e.target.value})}
              placeholder="Enter amount to invest"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button 
            onClick={handleCreateInvestment}
            variant="contained"
            sx={{ 
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              textTransform: 'none',
              fontWeight: 600,
              px: 4
            }}
          >
            Invest Now
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Investments;