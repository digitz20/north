import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { createTransfer } from '../store/slices/transactionSlice';
import { fetchAccounts } from '../store/slices/accountSlice';
import { getCurrentUser } from '../store/slices/authSlice';

const TransferMoney = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { accounts, loading } = useSelector((state) => state.accounts);
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    toAccountHolder: '',
    amount: '',
    description: ''
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
    dispatch(fetchAccounts());
  }, [dispatch, user, location.pathname]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError('');

    try {
      await dispatch(createTransfer({
        fromAccount: formData.fromAccount,
        toAccount: formData.toAccount,
        toAccountHolder: formData.toAccountHolder,
        amount: parseFloat(formData.amount),
        description: formData.description
      })).unwrap();
      
      setSuccess(true);
      setFormData({
        fromAccount: '',
        toAccount: '',
        toAccountHolder: '',
        amount: '',
        description: ''
      });
    } catch (err) {
      setError(err.message || 'Transfer failed. Please try again.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Transfer Money
      </Typography>

      <Paper sx={{ p: 4, maxWidth: 800 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Transfer completed successfully!
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="From Account"
                name="fromAccount"
                value={formData.fromAccount}
                onChange={handleChange}
                required
              >
                {accounts.map((account) => (
                  <MenuItem key={account._id} value={account.accountNumber}>
                    {account.accountType} - {account.accountNumber} (${account.balance.toFixed(2)})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recipient Account Number"
                name="toAccount"
                value={formData.toAccount}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Recipient Name"
                name="toAccountHolder"
                value={formData.toAccountHolder}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount ($)"
                name="amount"
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Send Transfer'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TransferMoney;