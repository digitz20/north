import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
  Alert,
  Avatar,
  Skeleton,
  Tabs,
  Tab,
  InputAdornment
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  AccountBalance as AccountBalanceIcon,
  CreditScore as CreditScoreIcon,
  SwapHoriz as SwapHorizIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import api from '../services/api';

const Users = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnverified, setShowUnverified] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user',
    isVerified: true,
    isActive: true,
    isFrozen: false,
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    twoFactorEnabled: false,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netSavings: 0
  });
  const [editBalanceId, setEditBalanceId] = useState(null);
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [editTotalBalance, setEditTotalBalance] = useState(false);
  const [editTotalBalanceValue, setEditTotalBalanceValue] = useState('');
  const [editCardBalanceId, setEditCardBalanceId] = useState(null);
  const [editCardBalanceValue, setEditCardBalanceValue] = useState('');
  const [editInvestmentValueId, setEditInvestmentValueId] = useState(null);
  const [editInvestmentValueValue, setEditInvestmentValueValue] = useState('');
  const [editLoanBalanceId, setEditLoanBalanceId] = useState(null);
  const [editLoanBalanceValue, setEditLoanBalanceValue] = useState('');
  const [editInvestmentAmountId, setEditInvestmentAmountId] = useState(null);
  const [editInvestmentAmountValue, setEditInvestmentAmountValue] = useState('');
  const [editInvestmentCurrentValueId, setEditInvestmentCurrentValueId] = useState(null);
  const [editInvestmentCurrentValueValue, setEditInvestmentCurrentValueValue] = useState('');
  const [editTransferAmountId, setEditTransferAmountId] = useState(null);
  const [editTransferAmountValue, setEditTransferAmountValue] = useState('');
  const [editCardCreditLimitId, setEditCardCreditLimitId] = useState(null);
  const [editCardCreditLimitValue, setEditCardCreditLimitValue] = useState('');
  const [editCardDailyLimitId, setEditCardDailyLimitId] = useState(null);
  const [editCardDailyLimitValue, setEditCardDailyLimitValue] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [editingKYC, setEditingKYC] = useState(null);
  const [openTransactionDialog, setOpenTransactionDialog] = useState(false);
  const [openTransferDialog, setOpenTransferDialog] = useState(false);
  const [openInvestmentDialog, setOpenInvestmentDialog] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    type: 'deposit',
    amount: '',
    description: '',
    status: 'completed'
  });
  const [transferForm, setTransferForm] = useState({
    amount: '',
    transferType: 'domestic',
    status: 'completed',
    recipientDetails: { name: '', accountNumber: '', bankName: '' }
  });
  const [investmentForm, setInvestmentForm] = useState({
    amount: '',
    status: 'active',
    plan: { name: 'Custom Plan', type: 'stocks', expectedReturn: 5 }
  });

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [location.pathname]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (showUnverified) {
        params.append('verified', 'all');
      } else {
        params.append('verified', 'true');
      }
      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data?.data || response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'user',
      isVerified: true,
      isActive: true,
      isFrozen: false,
      dateOfBirth: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      twoFactorEnabled: false
    });
    setOpenDialog(true);
  };

  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      isVerified: user.isVerified || false,
      isActive: user.isActive !== false,
      isFrozen: user.isFrozen || false,
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      address: {
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        zipCode: user.address?.zipCode || '',
        country: user.address?.country || 'USA'
      },
      twoFactorEnabled: user.twoFactorEnabled || false,
      monthlyIncome: user.monthlyIncome || 0,
      monthlyExpenses: user.monthlyExpenses || 0,
      netSavings: user.netSavings || 0
    });
    setEditBalanceId(null);
    setEditBalanceValue('');
    setEditTotalBalance(false);
    setEditTotalBalanceValue('');
    setEditCardBalanceId(null);
    setEditCardBalanceValue('');
    setEditInvestmentValueId(null);
    setEditInvestmentValueValue('');
    try {
      const response = await api.get(`/admin/users/${user._id}/details`);
      setUserDetails(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching user details for edit:', error);
    }
    setOpenDialog(true);
  };

  const handleFreezeUser = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}`, {
        isFrozen: !user.isFrozen
      });
      setUsers(users.map(u => u._id === user._id ? { ...u, isFrozen: !user.isFrozen } : u));
    } catch (error) {
      console.error('Error toggling freeze:', error);
    }
  };

  const handleViewDetails = async (user) => {
    setSelectedUser(user);
    setDetailsLoading(true);
    setOpenDetailsDialog(true);
    setDetailsTab(0);
    setEditingAccount(null);
    setEditingTransaction(null);
    setEditingTransfer(null);
    setEditingInvestment(null);
    setEditingLoan(null);
    setEditingCard(null);
    setEditingKYC(null);
    setEditBalanceId(null);
    setEditBalanceValue('');
    setEditTotalBalance(false);
    setEditTotalBalanceValue('');
    setEditCardBalanceId(null);
    setEditCardBalanceValue('');
    setEditInvestmentValueId(null);
    setEditInvestmentValueValue('');
    setEditLoanBalanceId(null);
    setEditLoanBalanceValue('');
    setEditInvestmentAmountId(null);
    setEditInvestmentAmountValue('');
    setEditInvestmentCurrentValueId(null);
    setEditInvestmentCurrentValueValue('');
    setEditTransferAmountId(null);
    setEditTransferAmountValue('');
    setEditCardCreditLimitId(null);
    setEditCardCreditLimitValue('');
    setEditCardDailyLimitId(null);
    setEditCardDailyLimitValue('');
    try {
      const response = await api.get(`/admin/users/${user._id}/details`);
      setUserDetails(response.data?.data || null);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/admin/users/${selectedUser._id}`);
      setSuccess('User deleted successfully');
      setOpenDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await api.put(`/admin/users/${selectedUser._id}`, formData);
        setSuccess('User updated successfully');
      } else {
        await api.post('/admin/users', formData);
        setSuccess('User created successfully');
      }
      setOpenDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
    }
  };

  const handleUpdateBalance = async (accountId) => {
    try {
      await api.put(`/admin/accounts/${accountId}`, {
        balance: parseFloat(editBalanceValue)
      });
      setSuccess('Balance updated successfully');
      setEditBalanceId(null);
      setEditBalanceValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating balance:', error);
      setError('Failed to update balance');
    }
  };

  const handleUpdateTotalBalance = async () => {
    try {
      const newTotal = parseFloat(editTotalBalanceValue);
      if (isNaN(newTotal) || newTotal < 0) {
        setError('Please enter a valid total balance');
        return;
      }
      const accounts = userDetails?.accounts || [];
      if (accounts.length === 0) {
        setError('No accounts to update');
        return;
      }
      const currentTotal = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
      const difference = newTotal - currentTotal;
      if (accounts.length === 1) {
        await api.put(`/admin/accounts/${accounts[0]._id}`, {
          balance: (Number(accounts[0].balance) || 0) + difference
        });
      } else {
        const totalWeight = accounts.reduce((sum, acc) => sum + (Number(acc.balance) || 1), 0);
        await Promise.all(accounts.map(async (account) => {
          const weight = (Number(account.balance) || 0) / totalWeight;
          const newBalance = Math.max(0, (Number(account.balance) || 0) + difference * weight);
          await api.put(`/admin/accounts/${account._id}`, { balance: newBalance });
        }));
      }
      setSuccess('Total balance updated successfully');
      setEditTotalBalance(false);
      setEditTotalBalanceValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating total balance:', error);
      setError('Failed to update total balance');
    }
  };

  const handleUpdateCardBalance = async (cardId) => {
    try {
      await api.put(`/admin/cards/${cardId}`, {
        currentBalance: parseFloat(editCardBalanceValue)
      });
      setSuccess('Card balance updated successfully');
      setEditCardBalanceId(null);
      setEditCardBalanceValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating card balance:', error);
      setError('Failed to update card balance');
    }
  };

  const handleUpdateInvestmentValue = async (investmentId) => {
    try {
      await api.put(`/admin/investments/${investmentId}`, {
        currentValue: parseFloat(editInvestmentValueValue)
      });
      setSuccess('Investment value updated successfully');
      setEditInvestmentValueId(null);
      setEditInvestmentValueValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating investment value:', error);
      setError('Failed to update investment value');
    }
  };

  const handleUpdateAccount = async (accountId) => {
    try {
      const account = userDetails.accounts.find(a => a._id === accountId);
      if (!account) return;
      await api.put(`/admin/accounts/${accountId}`, editingAccount);
      setSuccess('Account updated successfully');
      setEditingAccount(null);
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating account:', error);
      setError('Failed to update account');
    }
  };

  const handleLoanAction = async (loanId, action) => {
    try {
      await api.patch(`/admin/loans/${loanId}`, { status: action });
      setSuccess(`Loan ${action} successfully`);
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error(`Error ${action} loan:`, error);
      setError(`Failed to ${action} loan`);
    }
  };

  const handleUpdateLoan = async (loanId) => {
    try {
      await api.put(`/admin/loans/${loanId}`, editingLoan);
      setSuccess('Loan updated successfully');
      setEditingLoan(null);
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating loan:', error);
      setError('Failed to update loan');
    }
  };

  const handleAddTransaction = async () => {
    try {
      await api.post('/admin/transactions', {
        ...transactionForm,
        user: selectedUser._id,
        amount: parseFloat(transactionForm.amount)
      });
      setSuccess('Transaction added successfully');
      setOpenTransactionDialog(false);
      setTransactionForm({ type: 'deposit', amount: '', description: '', status: 'completed' });
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Failed to add transaction');
    }
  };

  const handleAddTransfer = async () => {
    try {
      await api.post('/admin/transfers', {
        ...transferForm,
        initiatedBy: selectedUser._id,
        amount: parseFloat(transferForm.amount),
        recipientDetails: transferForm.recipientDetails
      });
      setSuccess('Transfer added successfully');
      setOpenTransferDialog(false);
      setTransferForm({ amount: '', transferType: 'domestic', status: 'completed', recipientDetails: { name: '', accountNumber: '', bankName: '' } });
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error adding transfer:', error);
      setError('Failed to add transfer');
    }
  };

  const handleAddInvestment = async () => {
    try {
      await api.post('/admin/investments', {
        ...investmentForm,
        user: selectedUser._id,
        amount: parseFloat(investmentForm.amount),
        plan: investmentForm.plan
      });
      setSuccess('Investment added successfully');
      setOpenInvestmentDialog(false);
      setInvestmentForm({ amount: '', status: 'active', plan: { name: 'Custom Plan', type: 'stocks', expectedReturn: 5 } });
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error adding investment:', error);
      setError('Failed to add investment');
    }
  };

  const handleUpdateKYC = async (kycId) => {
    try {
      await api.put(`/admin/kyc/${kycId}`, editingKYC);
      setSuccess('KYC updated successfully');
      setEditingKYC(null);
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating KYC:', error);
      setError('Failed to update KYC');
    }
  };

  const handleUpdateCard = async (cardId) => {
    try {
      await api.put(`/admin/cards/${cardId}`, editingCard);
      setSuccess('Card updated successfully');
      setEditingCard(null);
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating card:', error);
      setError('Failed to update card');
    }
  };

  const handleUpdateLoanBalance = async (loanId) => {
    try {
      await api.put(`/admin/loans/${loanId}`, {
        remainingBalance: parseFloat(editLoanBalanceValue)
      });
      setSuccess('Loan balance updated successfully');
      setEditLoanBalanceId(null);
      setEditLoanBalanceValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating loan balance:', error);
      setError('Failed to update loan balance');
    }
  };

  const handleUpdateInvestmentAmount = async (investmentId) => {
    try {
      await api.put(`/admin/investments/${investmentId}`, {
        amountInvested: parseFloat(editInvestmentAmountValue)
      });
      setSuccess('Investment amount updated successfully');
      setEditInvestmentAmountId(null);
      setEditInvestmentAmountValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating investment amount:', error);
      setError('Failed to update investment amount');
    }
  };

  const handleUpdateInvestmentCurrentValue = async (investmentId) => {
    try {
      await api.put(`/admin/investments/${investmentId}`, {
        currentValue: parseFloat(editInvestmentCurrentValueValue)
      });
      setSuccess('Investment current value updated successfully');
      setEditInvestmentCurrentValueId(null);
      setEditInvestmentCurrentValueValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating investment current value:', error);
      setError('Failed to update investment current value');
    }
  };

  const handleUpdateTransferAmount = async (transferId) => {
    try {
      await api.put(`/admin/transfers/${transferId}`, {
        amount: parseFloat(editTransferAmountValue)
      });
      setSuccess('Transfer amount updated successfully');
      setEditTransferAmountId(null);
      setEditTransferAmountValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating transfer amount:', error);
      setError('Failed to update transfer amount');
    }
  };

  const handleUpdateCardCreditLimit = async (cardId) => {
    try {
      await api.put(`/admin/cards/${cardId}`, {
        creditLimit: parseFloat(editCardCreditLimitValue)
      });
      setSuccess('Card credit limit updated successfully');
      setEditCardCreditLimitId(null);
      setEditCardCreditLimitValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating card credit limit:', error);
      setError('Failed to update card credit limit');
    }
  };

  const handleUpdateCardDailyLimit = async (cardId) => {
    try {
      await api.put(`/admin/cards/${cardId}`, {
        dailySpendingLimit: parseFloat(editCardDailyLimitValue)
      });
      setSuccess('Card daily spending limit updated successfully');
      setEditCardDailyLimitId(null);
      setEditCardDailyLimitValue('');
      handleViewDetails(selectedUser);
    } catch (error) {
      console.error('Error updating card daily limit:', error);
      setError('Failed to update card daily limit');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role) => {
    switch (role) {
      case 'super-admin': return 'error';
      case 'admin': return 'warning';
      case 'user': return 'default';
      default: return 'default';
    }
  };

  const renderAccountsTab = () => {
    if (!userDetails?.accounts?.length) {
      return <Typography color="text.secondary">No accounts found</Typography>;
    }
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => { setOpenTransactionDialog(true); }}>
            Add Transaction
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userDetails.accounts.map((account) => (
                <TableRow key={account._id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{account.accountNumber}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{account.accountType}</TableCell>
                  <TableCell>
                    {editBalanceId === account._id ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={editBalanceValue}
                          onChange={(e) => setEditBalanceValue(e.target.value)}
                          sx={{ width: 120 }}
                        />
                        <Button size="small" variant="contained" onClick={() => handleUpdateBalance(account._id)}>Save</Button>
                        <Button size="small" onClick={() => { setEditBalanceId(null); setEditBalanceValue(''); }}>Cancel</Button>
                      </Box>
                    ) : (
                      <Typography sx={{ fontWeight: 600 }}>${account.balance ? Number(account.balance).toLocaleString() : '0'}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={account.isActive ? 'Active' : 'Inactive'} color={account.isActive ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Balance">
                      <IconButton size="small" onClick={() => { setEditBalanceId(account._id); setEditBalanceValue(account.balance?.toString() || '0'); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Account">
                      <IconButton size="small" onClick={() => setEditingAccount(editingAccount === account._id ? null : {
                        ...account,
                        accountType: account.accountType || 'checking',
                        isActive: account.isActive !== false
                      })}>
                        <AccountBalanceIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Account Edit Form */}
        {editingAccount && (
          <Paper sx={{ p: 3, mt: 3, borderRadius: 2, background: 'rgba(0,102,255,0.03)', border: '1px solid rgba(0,102,255,0.1)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Edit Account</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Account Type"
                  size="small"
                  value={editingAccount.accountType}
                  onChange={(e) => setEditingAccount({ ...editingAccount, accountType: e.target.value })}
                >
                  <MenuItem value="checking">Checking</MenuItem>
                  <MenuItem value="savings">Savings</MenuItem>
                  <MenuItem value="credit">Credit</MenuItem>
                  <MenuItem value="investment">Investment</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editingAccount.isActive}
                      onChange={(e) => setEditingAccount({ ...editingAccount, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, mt: { xs: 2, md: 0 } }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => handleUpdateAccount(editingAccount._id)}
                    sx={{ background: 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)' }}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => setEditingAccount(null)}
                  >
                    Cancel
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}
      </Box>
    );
  };

  const renderCardsTab = () => {
    if (!userDetails?.cards?.length) {
      return <Typography color="text.secondary">No cards found</Typography>;
    }
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Card ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Network</TableCell>
              <TableCell>Last Four</TableCell>
              <TableCell>Credit Limit</TableCell>
              <TableCell>Daily Limit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userDetails.cards.map((card) => (
              <TableRow key={card._id}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{card.cardId || card._id}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{card.cardType}</TableCell>
                <TableCell>{card.cardNetwork}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>****{card.lastFourDigits}</TableCell>
                <TableCell>
                  {editCardCreditLimitId === card._id ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={editCardCreditLimitValue}
                        onChange={(e) => setEditCardCreditLimitValue(e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <Button size="small" variant="contained" onClick={() => handleUpdateCardCreditLimit(card._id)}>Save</Button>
                      <Button size="small" onClick={() => { setEditCardCreditLimitId(null); setEditCardCreditLimitValue(''); }}>Cancel</Button>
                    </Box>
                  ) : (
                    <Typography sx={{ fontWeight: 600 }}>${card.creditLimit?.toLocaleString() || '0'}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editCardDailyLimitId === card._id ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={editCardDailyLimitValue}
                        onChange={(e) => setEditCardDailyLimitValue(e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <Button size="small" variant="contained" onClick={() => handleUpdateCardDailyLimit(card._id)}>Save</Button>
                      <Button size="small" onClick={() => { setEditCardDailyLimitId(null); setEditCardDailyLimitValue(''); }}>Cancel</Button>
                    </Box>
                  ) : (
                    <Typography sx={{ fontWeight: 600 }}>${card.dailySpendingLimit?.toLocaleString() || '0'}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={card.isActive ? (card.isLocked ? 'Locked' : 'Active') : 'Inactive'} color={card.isActive ? (card.isLocked ? 'warning' : 'success') : 'error'} size="small" />
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit Credit Limit">
                    <IconButton size="small" onClick={() => { setEditCardCreditLimitId(card._id); setEditCardCreditLimitValue(card.creditLimit?.toString() || '0'); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Daily Limit">
                    <IconButton size="small" onClick={() => { setEditCardDailyLimitId(card._id); setEditCardDailyLimitValue(card.dailySpendingLimit?.toString() || '0'); }}>
                      <AccountBalanceIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Card">
                    <IconButton size="small" onClick={() => setEditingCard(editingCard === card._id ? null : { ...card })}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderKYCTab = () => {
    if (!userDetails?.kycs?.length) {
      return <Typography color="text.secondary">No KYC applications found</Typography>;
    }
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Application ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Submitted At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userDetails.kycs.map((kyc) => (
              <TableRow key={kyc._id}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{kyc.kycId || kyc._id}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{kyc.type}</TableCell>
                <TableCell>
                  {editingKYC === kyc._id ? (
                    <Select
                      size="small"
                      value={editingKYC.status || kyc.status}
                      onChange={(e) => setEditingKYC({ ...editingKYC, status: e.target.value })}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="additional-info-needed">Additional Info Needed</MenuItem>
                    </Select>
                  ) : (
                    <Chip label={kyc.status} color={kyc.status === 'approved' ? 'success' : kyc.status === 'rejected' ? 'error' : 'warning'} size="small" />
                  )}
                </TableCell>
                <TableCell>{new Date(kyc.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  {editingKYC === kyc._id ? (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button size="small" variant="contained" onClick={() => handleUpdateKYC(kyc._id)}>Save</Button>
                      <Button size="small" onClick={() => setEditingKYC(null)}>Cancel</Button>
                    </Box>
                  ) : (
                    <Tooltip title="Edit KYC">
                      <IconButton size="small" onClick={() => setEditingKYC({ ...kyc, status: kyc.status })}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderLoansTab = () => {
    if (!userDetails?.loans?.length) {
      return <Typography color="text.secondary">No loans found</Typography>;
    }
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Loan ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Remaining Balance</TableCell>
              <TableCell>Monthly Payment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userDetails.loans.map((loan) => (
              <TableRow key={loan._id}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{loan.loanId || loan._id}</TableCell>
                <TableCell>{loan.loanProduct ? loan.loanProduct.name : 'Loan'}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>${loan.amount?.toLocaleString()}</TableCell>
                <TableCell>
                  {editLoanBalanceId === loan._id ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={editLoanBalanceValue}
                        onChange={(e) => setEditLoanBalanceValue(e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <Button size="small" variant="contained" onClick={() => handleUpdateLoanBalance(loan._id)}>Save</Button>
                      <Button size="small" onClick={() => { setEditLoanBalanceId(null); setEditLoanBalanceValue(''); }}>Cancel</Button>
                    </Box>
                  ) : (
                    <Typography sx={{ fontWeight: 600 }}>${loan.remainingBalance?.toLocaleString() || '0'}</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>${loan.monthlyPayment?.toLocaleString() || '0'}</TableCell>
                <TableCell>
                  {editingLoan === loan._id ? (
                    <Select
                      size="small"
                      value={editingLoan.status || loan.status}
                      onChange={(e) => setEditingLoan({ ...editingLoan, status: e.target.value })}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  ) : (
                    <Chip 
                      label={loan.status} 
                      color={loan.status === 'approved' ? 'success' : loan.status === 'rejected' ? 'error' : loan.status === 'active' ? 'info' : 'warning'} 
                      size="small" 
                    />
                  )}
                </TableCell>
                <TableCell>
                  {editingLoan === loan._id ? (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button size="small" variant="contained" onClick={() => handleUpdateLoan(loan._id)}>Save</Button>
                      <Button size="small" onClick={() => setEditingLoan(null)}>Cancel</Button>
                    </Box>
                  ) : (
                    <>
                      {loan.status === 'pending' && (
                        <>
                          <Button size="small" variant="contained" color="success" onClick={() => handleLoanAction(loan._id, 'approved')} sx={{ mr: 1 }}>Approve</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleLoanAction(loan._id, 'rejected')}>Reject</Button>
                        </>
                      )}
                      <Tooltip title="Edit Loan">
                        <IconButton size="small" onClick={() => setEditingLoan({ ...loan, status: loan.status })}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Balance">
                        <IconButton size="small" onClick={() => { setEditLoanBalanceId(loan._id); setEditLoanBalanceValue(loan.remainingBalance?.toString() || '0'); }}>
                          <AccountBalanceIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderTransactionsTab = () => {
    if (!userDetails?.transactions?.length) {
      return <Typography color="text.secondary">No transactions found</Typography>;
    }
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenTransactionDialog(true)}>
            Add Transaction
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userDetails.transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{tx._id}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{tx.type}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>${tx.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={tx.status} color={tx.status === 'completed' ? 'success' : tx.status === 'pending' ? 'warning' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderTransfersTab = () => {
    if (!userDetails?.transfers?.length) {
      return <Typography color="text.secondary">No transfers found</Typography>;
    }
    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userDetails.transfers.map((transfer) => (
              <TableRow key={transfer._id}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{transfer._id}</TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{transfer.transferType}</TableCell>
                <TableCell>
                  {editTransferAmountId === transfer._id ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={editTransferAmountValue}
                        onChange={(e) => setEditTransferAmountValue(e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <Button size="small" variant="contained" onClick={() => handleUpdateTransferAmount(transfer._id)}>Save</Button>
                      <Button size="small" onClick={() => { setEditTransferAmountId(null); setEditTransferAmountValue(''); }}>Cancel</Button>
                    </Box>
                  ) : (
                    <Typography sx={{ fontWeight: 600 }}>${transfer.amount?.toLocaleString()}</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={transfer.status} color={transfer.status === 'completed' ? 'success' : transfer.status === 'pending' ? 'warning' : 'error'} size="small" />
                </TableCell>
                <TableCell>{new Date(transfer.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Tooltip title="Edit Amount">
                    <IconButton size="small" onClick={() => { setEditTransferAmountId(transfer._id); setEditTransferAmountValue(transfer.amount?.toString() || '0'); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderInvestmentsTab = () => {
    if (!userDetails?.investments?.length) {
      return <Typography color="text.secondary">No investments found</Typography>;
    }
    return (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>ID</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Amount Invested</TableCell>
              <TableCell>Current Value</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
              <TableCell sx={{ px: { xs: 1, sm: 2 } }}>Actions</TableCell>
            </TableRow>
          </TableHead>
              <TableBody>
            {userDetails.investments.map((inv) => (
              <TableRow key={inv._id}>
                <TableCell sx={{ fontFamily: 'monospace', display: { xs: 'none', sm: 'table-cell' } }}>{inv._id}</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }}}>{inv.plan ? inv.plan.name : 'Investment'}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {editInvestmentAmountId === inv._id ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={editInvestmentAmountValue}
                        onChange={(e) => setEditInvestmentAmountValue(e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <Button size="small" variant="contained" onClick={() => handleUpdateInvestmentAmount(inv._id)}>Save</Button>
                      <Button size="small" onClick={() => { setEditInvestmentAmountId(null); setEditInvestmentAmountValue(''); }}>Cancel</Button>
                    </Box>
                  ) : (
                    <Typography sx={{ fontWeight: 600 }}>${inv.amountInvested?.toLocaleString() || '0'}</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' }, fontWeight: 600 }}>
                  {editInvestmentCurrentValueId === inv._id ? (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        value={editInvestmentCurrentValueValue}
                        onChange={(e) => setEditInvestmentCurrentValueValue(e.target.value)}
                        sx={{ width: 120 }}
                      />
                      <Button size="small" variant="contained" onClick={() => handleUpdateInvestmentCurrentValue(inv._id)}>Save</Button>
                      <Button size="small" onClick={() => { setEditInvestmentCurrentValueId(null); setEditInvestmentCurrentValueValue(''); }}>Cancel</Button>
                    </Box>
                  ) : (
                    <Typography sx={{ fontWeight: 600 }}>${inv.currentValue?.toLocaleString() || '0'}</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  <Chip label={inv.status} color={inv.status === 'active' ? 'success' : inv.status === 'pending' ? 'warning' : 'error'} size="small" />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                  <Tooltip title="Edit Amount">
                    <IconButton size="small" onClick={() => { setEditInvestmentAmountId(inv._id); setEditInvestmentAmountValue(inv.amountInvested?.toString() || '0'); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Current Value">
                    <IconButton size="small" onClick={() => { setEditInvestmentCurrentValueId(inv._id); setEditInvestmentCurrentValueValue(inv.currentValue?.toString() || '0'); }}>
                      <TrendingUpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderAdminToolsTab = () => {
    if (!selectedUser) return null;
    const totalBalance = (userDetails?.accounts || []).reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    return (
      <Box sx={{ maxWidth: 1200 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Financial Overview</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Review and edit the user&apos;s balances below. All changes are logged in the audit trail.
        </Alert>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center', background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', color: 'white' }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Balance</Typography>
              {editTotalBalance ? (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                  <TextField
                    size="small"
                    type="number"
                    value={editTotalBalanceValue}
                    onChange={(e) => setEditTotalBalanceValue(e.target.value)}
                    sx={{ width: 140 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                  />
                  <Button size="small" variant="contained" onClick={handleUpdateTotalBalance}>Save</Button>
                  <Button size="small" onClick={() => { setEditTotalBalance(false); setEditTotalBalanceValue(''); }}>Cancel</Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  <Tooltip title="Edit Total Balance">
                    <IconButton size="small" onClick={() => { setEditTotalBalance(true); setEditTotalBalanceValue(totalBalance.toString()); }} sx={{ color: 'white' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Accounts</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{userDetails?.accounts?.length || 0}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Status</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: selectedUser.isFrozen ? 'warning.main' : selectedUser.isActive ? 'success.main' : 'error.main' }}>
                {selectedUser.isFrozen ? 'Frozen' : selectedUser.isActive ? 'Active' : 'Inactive'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 600 }}>Account Balances</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Account Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(userDetails?.accounts || []).map((account) => (
                <TableRow key={account._id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{account.accountNumber}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{account.accountType}</TableCell>
                  <TableCell>
                    {editBalanceId === account._id ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={editBalanceValue}
                          onChange={(e) => setEditBalanceValue(e.target.value)}
                          sx={{ width: 120 }}
                        />
                        <Button size="small" variant="contained" onClick={() => handleUpdateBalance(account._id)}>Save</Button>
                        <Button size="small" onClick={() => { setEditBalanceId(null); setEditBalanceValue(''); }}>Cancel</Button>
                      </Box>
                    ) : (
                      <Typography sx={{ fontWeight: 600 }}>${account.balance ? Number(account.balance).toLocaleString() : '0'}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={account.isActive ? 'Active' : 'Inactive'} color={account.isActive ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Balance">
                      <IconButton size="small" onClick={() => { setEditBalanceId(account._id); setEditBalanceValue(account.balance?.toString() || '0'); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(!userDetails?.accounts || userDetails.accounts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No accounts found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle2" sx={{ mt: 4, mb: 1, fontWeight: 600 }}>Card Balances</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Card</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Current Balance</TableCell>
                <TableCell>Credit Limit</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(userDetails?.cards || []).map((card) => (
                <TableRow key={card._id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{card.maskedCardNumber || `****-****-****-${card.lastFourDigits}`}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{card.cardType}</TableCell>
                  <TableCell>
                    {editCardBalanceId === card._id ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={editCardBalanceValue}
                          onChange={(e) => setEditCardBalanceValue(e.target.value)}
                          sx={{ width: 120 }}
                        />
                        <Button size="small" variant="contained" onClick={() => handleUpdateCardBalance(card._id)}>Save</Button>
                        <Button size="small" onClick={() => { setEditCardBalanceId(null); setEditCardBalanceValue(''); }}>Cancel</Button>
                      </Box>
                    ) : (
                      <Typography sx={{ fontWeight: 600 }}>${card.currentBalance ? Number(card.currentBalance).toLocaleString() : '0'}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>${card.creditLimit ? Number(card.creditLimit).toLocaleString() : 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Balance">
                      <IconButton size="small" onClick={() => { setEditCardBalanceId(card._id); setEditCardBalanceValue(card.currentBalance?.toString() || '0'); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(!userDetails?.cards || userDetails.cards.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No cards found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="subtitle2" sx={{ mt: 4, mb: 1, fontWeight: 600 }}>Investment Balances</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Investment ID</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Amount Invested</TableCell>
                <TableCell>Current Value</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(userDetails?.investments || []).map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{inv.investmentId}</TableCell>
                  <TableCell>{inv.plan ? inv.plan.name : 'N/A'}</TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600 }}>${inv.amountInvested ? Number(inv.amountInvested).toLocaleString() : '0'}</Typography>
                  </TableCell>
                  <TableCell>
                    {editInvestmentValueId === inv._id ? (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          size="small"
                          type="number"
                          value={editInvestmentValueValue}
                          onChange={(e) => setEditInvestmentValueValue(e.target.value)}
                          sx={{ width: 120 }}
                        />
                        <Button size="small" variant="contained" onClick={() => handleUpdateInvestmentValue(inv._id)}>Save</Button>
                        <Button size="small" onClick={() => { setEditInvestmentValueId(null); setEditInvestmentValueValue(''); }}>Cancel</Button>
                      </Box>
                    ) : (
                      <Typography sx={{ fontWeight: 600 }}>${inv.currentValue ? Number(inv.currentValue).toLocaleString() : '0'}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Current Value">
                      <IconButton size="small" onClick={() => { setEditInvestmentValueId(inv._id); setEditInvestmentValueValue(inv.currentValue?.toString() || '0'); }}>
                        <TrendingUpIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(!userDetails?.investments || userDetails.investments.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="text.secondary">No investments found</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Monthly Summary</Typography>
          <Grid container spacing={3}>
            <Grid item xs={4}>
              <TextField
                label="Monthly Income"
                type="number"
                fullWidth
                value={selectedUser.monthlyIncome || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  handleEditUser({ ...selectedUser, monthlyIncome: val });
                }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Monthly Expenses"
                type="number"
                fullWidth
                value={selectedUser.monthlyExpenses || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  handleEditUser({ ...selectedUser, monthlyExpenses: val });
                }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Net Savings"
                type="number"
                fullWidth
                value={selectedUser.netSavings || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  handleEditUser({ ...selectedUser, netSavings: val });
                }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => {
                  api.put(`/admin/users/${selectedUser._id}`, {
                    monthlyIncome: selectedUser.monthlyIncome || 0,
                    monthlyExpenses: selectedUser.monthlyExpenses || 0,
                    netSavings: selectedUser.netSavings || 0
                  }).then(() => {
                    setSuccess('Financial summary updated');
                    handleViewDetails(selectedUser);
                  }).catch(() => setError('Failed to update financial summary'));
                }}
                sx={{
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)' }
                }}
              >
                Save Financial Summary
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
          sx={{
            background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
            boxShadow: '0 4px 14px rgba(0, 102, 255, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)',
              boxShadow: '0 8px 25px rgba(0, 102, 255, 0.45)',
            },
          }}
        >
          Add New User
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

       <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
         <Box sx={{ p: 3, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
           <TextField
             label="Search users"
             variant="outlined"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             sx={{ maxWidth: 400, flex: 1, minWidth: 200 }}
             placeholder="Search by email or name..."
             InputProps={{
               sx: { borderRadius: 2 },
             }}
           />
           <FormControlLabel
             control={
               <Switch
                 checked={showUnverified}
                 onChange={(e) => {
                   setShowUnverified(e.target.checked);
                   fetchUsers();
                 }}
                 size="small"
               />
             }
             label={
               <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                 Show unverified users
               </Typography>
             }
           />
         </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  User
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Role
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Created
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow
                    key={user._id}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? (user.isFrozen ? 'Frozen' : 'Active') : 'Inactive'}
                        color={user.isActive && !user.isFrozen ? 'success' : user.isFrozen ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewDetails(user)} size="small" sx={{ color: 'primary.main' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.isFrozen ? "Unfreeze User" : "Freeze User"}>
                        <IconButton 
                          onClick={() => handleFreezeUser(user)} 
                          size="small" 
                          sx={{ color: user.isFrozen ? 'warning.main' : 'default' }}
                        >
                          {user.isFrozen ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditUser(user)} size="small" sx={{ color: 'primary.main' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                       {user.role !== 'super-admin' && (
                        <Tooltip title="Delete">
                          <IconButton onClick={() => handleDeleteUser(user)} size="small" color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, minHeight: '70vh' } }}>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedUser?.firstName?.[0]}{selectedUser?.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedUser?.firstName} {selectedUser?.lastName}</Typography>
              <Typography variant="body2" color="text.secondary">{selectedUser?.email}</Typography>
            </Box>
          </Box>
          <Chip 
            label={selectedUser?.isFrozen ? 'Frozen' : selectedUser?.isActive ? 'Active' : 'Inactive'} 
            color={selectedUser?.isFrozen ? 'warning' : selectedUser?.isActive ? 'success' : 'error'} 
          />
        </DialogTitle>
        <DialogContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={detailsTab} onChange={(e, v) => setDetailsTab(v)}>
              <Tab label="Accounts" />
              <Tab label="Cards" />
              <Tab label="KYC" />
              <Tab label="Loans" />
              <Tab label="Transactions" />
              <Tab label="Transfers" />
              <Tab label="Investments" />
              <Tab label="Admin Tools" />
            </Tabs>
          </Box>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Skeleton width={200} height={40} />
            </Box>
          ) : (
            <Box>
              {detailsTab === 0 && renderAccountsTab()}
              {detailsTab === 1 && renderCardsTab()}
              {detailsTab === 2 && renderKYCTab()}
              {detailsTab === 3 && renderLoansTab()}
              {detailsTab === 4 && renderTransactionsTab()}
              {detailsTab === 5 && renderTransfersTab()}
              {detailsTab === 6 && renderInvestmentsTab()}
              {detailsTab === 7 && renderAdminToolsTab()}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, m: { xs: 1, sm: 2 } } }}>
        <DialogTitle sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ maxHeight: { xs: 'calc(100vh - 140px)', sm: 'calc(100vh - 200px)' }, overflowY: 'auto', px: { xs: 2, sm: 3 } }}>
            <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Street Address"
                  fullWidth
                  value={formData.address.street}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  fullWidth
                  value={formData.address.city}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="State"
                  fullWidth
                  value={formData.address.state}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Zip Code"
                  fullWidth
                  value={formData.address.zipCode}
                  onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Country</InputLabel>
                  <Select
                    value={formData.address.country}
                    label="Country"
                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                  >
                    <MenuItem value="USA">United States</MenuItem>
                    <MenuItem value="Canada">Canada</MenuItem>
                    <MenuItem value="UK">United Kingdom</MenuItem>
                    <MenuItem value="Germany">Germany</MenuItem>
                    <MenuItem value="France">France</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Financial Overview</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Monthly Income"
                  type="number"
                  fullWidth
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: parseFloat(e.target.value) || 0 })}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Monthly Expenses"
                  type="number"
                  fullWidth
                  value={formData.monthlyExpenses}
                  onChange={(e) => setFormData({ ...formData, monthlyExpenses: parseFloat(e.target.value) || 0 })}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Net Savings"
                  type="number"
                  fullWidth
                  value={formData.netSavings}
                  onChange={(e) => setFormData({ ...formData, netSavings: parseFloat(e.target.value) || 0 })}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>

              {selectedUser && userDetails && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Account Balances</Typography>
                  </Grid>
                  {(userDetails?.accounts || []).map((account) => (
                    <Grid item xs={12} key={account._id}>
                      <TextField
                        label={`${account.accountType} (${account.accountNumber})`}
                        type="number"
                        fullWidth
                        value={editBalanceId === account._id ? editBalanceValue : (account.balance || 0)}
                        onChange={(e) => {
                          setEditBalanceId(account._id);
                          setEditBalanceValue(e.target.value);
                        }}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        onBlur={() => {
                          if (editBalanceId === account._id && editBalanceValue !== '') {
                            handleUpdateBalance(account._id);
                          }
                        }}
                        size="small"
                      />
                    </Grid>
                  ))}
                  {(!userDetails?.accounts || userDetails.accounts.length === 0) && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No accounts found</Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Card Balances</Typography>
                  </Grid>
                  {(userDetails?.cards || []).map((card) => (
                    <Grid item xs={12} key={card._id}>
                      <TextField
                        label={`${card.cardType} (****-${card.lastFourDigits})`}
                        type="number"
                        fullWidth
                        value={editCardBalanceId === card._id ? editCardBalanceValue : (card.currentBalance || 0)}
                        onChange={(e) => {
                          setEditCardBalanceId(card._id);
                          setEditCardBalanceValue(e.target.value);
                        }}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        onBlur={() => {
                          if (editCardBalanceId === card._id && editCardBalanceValue !== '') {
                            handleUpdateCardBalance(card._id);
                          }
                        }}
                        size="small"
                      />
                    </Grid>
                  ))}
                  {(!userDetails?.cards || userDetails.cards.length === 0) && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No cards found</Typography>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>Investment Balances</Typography>
                  </Grid>
                  {(userDetails?.investments || []).map((inv) => (
                    <Grid item xs={12} key={inv._id}>
                      <TextField
                         label={`${inv.plan ? inv.plan.name : 'Investment'} (${inv.investmentId})`}
                        type="number"
                        fullWidth
                        value={editInvestmentValueId === inv._id ? editInvestmentValueValue : (inv.currentValue || 0)}
                        onChange={(e) => {
                          setEditInvestmentValueId(inv._id);
                          setEditInvestmentValueValue(e.target.value);
                        }}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                        onBlur={() => {
                          if (editInvestmentValueId === inv._id && editInvestmentValueValue !== '') {
                            handleUpdateInvestmentValue(inv._id);
                          }
                        }}
                        size="small"
                      />
                    </Grid>
                  ))}
                  {(!userDetails?.investments || userDetails.investments.length === 0) && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">No investments found</Typography>
                    </Grid>
                  )}
                </>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <MenuItem value="user">Regular User</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="super-admin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isVerified}
                      onChange={(e) => setFormData({ ...formData, isVerified: e.target.checked })}
                    />
                  }
                  label="Verified"
                />
              </Grid>
              <Grid item xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
              <Grid item xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFrozen}
                      onChange={(e) => setFormData({ ...formData, isFrozen: e.target.checked })}
                    />
                  }
                  label="Frozen"
                />
              </Grid>
              <Grid item xs={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.twoFactorEnabled}
                      onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
                    />
                  }
                  label="2FA Enabled"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)' },
              }}
            >
              {selectedUser ? 'Update User' : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={openTransactionDialog} onClose={() => setOpenTransactionDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Add Transaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={transactionForm.type}
                  label="Type"
                  onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value })}
                >
                  <MenuItem value="deposit">Deposit</MenuItem>
                  <MenuItem value="withdrawal">Withdrawal</MenuItem>
                  <MenuItem value="transfer">Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                value={transactionForm.description}
                onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={transactionForm.status}
                  label="Status"
                  onChange={(e) => setTransactionForm({ ...transactionForm, status: e.target.value })}
                >
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenTransactionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddTransaction}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)' },
            }}
          >
            Add Transaction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Transfer Dialog */}
      <Dialog open={openTransferDialog} onClose={() => setOpenTransferDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Add Transfer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                value={transferForm.amount}
                onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Transfer Type</InputLabel>
                <Select
                  value={transferForm.transferType}
                  label="Transfer Type"
                  onChange={(e) => setTransferForm({ ...transferForm, transferType: e.target.value })}
                >
                  <MenuItem value="domestic">Domestic</MenuItem>
                  <MenuItem value="international">International</MenuItem>
                  <MenuItem value="crypto">Crypto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Recipient Name"
                fullWidth
                value={transferForm.recipientDetails.name}
                onChange={(e) => setTransferForm({ ...transferForm, recipientDetails: { ...transferForm.recipientDetails, name: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Account Number"
                fullWidth
                value={transferForm.recipientDetails.accountNumber}
                onChange={(e) => setTransferForm({ ...transferForm, recipientDetails: { ...transferForm.recipientDetails, accountNumber: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={transferForm.status}
                  label="Status"
                  onChange={(e) => setTransferForm({ ...transferForm, status: e.target.value })}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenTransferDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddTransfer}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)' },
            }}
          >
            Add Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Investment Dialog */}
      <Dialog open={openInvestmentDialog} onClose={() => setOpenInvestmentDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Add Investment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Amount"
                type="number"
                fullWidth
                value={investmentForm.amount}
                onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Plan Name"
                fullWidth
                value={investmentForm.plan.name}
                onChange={(e) => setInvestmentForm({ ...investmentForm, plan: { ...investmentForm.plan, name: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Plan Type</InputLabel>
                <Select
                  value={investmentForm.plan.type}
                  label="Plan Type"
                  onChange={(e) => setInvestmentForm({ ...investmentForm, plan: { ...investmentForm.plan, type: e.target.value } })}
                >
                  <MenuItem value="stocks">Stocks</MenuItem>
                  <MenuItem value="bonds">Bonds</MenuItem>
                  <MenuItem value="mutual-funds">Mutual Funds</MenuItem>
                  <MenuItem value="crypto">Crypto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Expected Return (%)"
                type="number"
                fullWidth
                value={investmentForm.plan.expectedReturn}
                onChange={(e) => setInvestmentForm({ ...investmentForm, plan: { ...investmentForm.plan, expectedReturn: parseFloat(e.target.value) } })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={investmentForm.status}
                  label="Status"
                  onChange={(e) => setInvestmentForm({ ...investmentForm, status: e.target.value })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenInvestmentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddInvestment}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)' },
            }}
          >
            Add Investment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? This will permanently remove the user and all their data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #E55A5A 0%, #FF6B6B 100%)' },
            }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
