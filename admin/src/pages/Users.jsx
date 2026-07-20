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
  List,
  ListItem,
  ListItemText,
  Divider
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
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../services/api';

const Users = () => {
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    isFrozen: false
  });
  const [editBalanceId, setEditBalanceId] = useState(null);
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingTransfer, setEditingTransfer] = useState(null);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
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
      const response = await api.get('/admin/users');
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
      isFrozen: false
    });
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'user',
      isVerified: user.isVerified || false,
      isActive: user.isActive !== false,
      isFrozen: user.isFrozen || false
    });
    setOpenDialog(true);
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
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {userDetails.loans.map((loan) => (
              <TableRow key={loan._id}>
                <TableCell sx={{ fontFamily: 'monospace' }}>{loan.loanId || loan._id}</TableCell>
                <TableCell>{loan.loanProduct?.name || 'Loan'}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>${loan.amount?.toLocaleString()}</TableCell>
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
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenTransferDialog(true)}>
            Add Transfer
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
              {userDetails.transfers.map((transfer) => (
                <TableRow key={transfer._id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{transfer._id}</TableCell>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{transfer.transferType}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>${transfer.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={transfer.status} color={transfer.status === 'completed' ? 'success' : transfer.status === 'pending' ? 'warning' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>{new Date(transfer.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const renderInvestmentsTab = () => {
    if (!userDetails?.investments?.length) {
      return <Typography color="text.secondary">No investments found</Typography>;
    }
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenInvestmentDialog(true)}>
            Add Investment
          </Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userDetails.investments.map((inv) => (
                <TableRow key={inv._id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{inv._id}</TableCell>
                  <TableCell>{inv.plan?.name || 'Investment'}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>${inv.amountInvested?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={inv.status} color={inv.status === 'active' ? 'success' : inv.status === 'pending' ? 'warning' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
        <Box sx={{ p: 3, pb: 2 }}>
          <TextField
            label="Search users"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 400 }}
            placeholder="Search by email or name..."
            InputProps={{
              sx: { borderRadius: 2 },
            }}
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
              <Tab label="Loans" />
              <Tab label="Transactions" />
              <Tab label="Transfers" />
              <Tab label="Investments" />
            </Tabs>
          </Box>
          {detailsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Skeleton width={200} height={40} />
            </Box>
          ) : (
            <Box>
              {detailsTab === 0 && renderAccountsTab()}
              {detailsTab === 1 && renderLoansTab()}
              {detailsTab === 2 && renderTransactionsTab()}
              {detailsTab === 3 && renderTransfersTab()}
              {detailsTab === 4 && renderInvestmentsTab()}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
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
