import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, CardActions, Button, Chip, Tabs, Tab, CircularProgress, Alert, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { CheckCircle, Cancel, Visibility, Email, AccountBalance, SwapHoriz, TrendingUp, Receipt, Info } from '@mui/icons-material';
import api from '../services/api';

const PendingApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [pendingItems, setPendingItems] = useState({
    deposits: [],
    withdrawals: [],
    transfers: [],
    investments: [],
    loans: [],
    taxRefunds: []
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rejectAllOpen, setRejectAllOpen] = useState(false);
  const [rejectAllReason, setRejectAllReason] = useState('');

  const tabLabels = ['Deposits', 'Withdrawals', 'Transfers', 'Investments', 'Loans', 'Tax Refunds'];

  useEffect(() => {
    fetchPendingItems();
  }, []);

  const fetchPendingItems = async () => {
    try {
      setLoading(true);
      const [transactionsRes, transfersRes, investmentsRes, loansRes, taxRefundsRes] = await Promise.all([
        api.get('/admin/transactions?status=pending'),
        api.get('/admin/transfers?status=pending'),
        api.get('/admin/investments?status=pending'),
        api.get('/admin/loans?status=pending'),
        api.get('/admin/tax-refunds?status=submitted')
      ]);

      const transactions = transactionsRes.data?.data?.transactions || [];
      const transfers = transfersRes.data?.data?.transfers || [];
      const investments = investmentsRes.data?.data?.investments || [];
      const loans = loansRes.data?.data?.loans || [];
      const taxRefunds = taxRefundsRes.data?.data?.taxRefunds || [];

      setPendingItems({
        deposits: transactions.filter(t => t.type === 'deposit'),
        withdrawals: transactions.filter(t => t.type === 'withdrawal'),
        transfers: transfers,
        investments: investments,
        loans: loans,
        taxRefunds
      });
    } catch (err) {
      setError('Failed to load pending approvals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      let endpoint = '';
      let payload = {};

      if (activeTab === 0) {
        endpoint = `/transactions/admin/${selectedItem._id}/approve`;
      } else if (activeTab === 1) {
        endpoint = `/transactions/admin/${selectedItem._id}/approve`;
      } else if (activeTab === 2) {
        endpoint = `/transfers/admin/${selectedItem._id}/approve`;
        payload = { status: 'approved' };
      } else if (activeTab === 3) {
        endpoint = `/investments/admin/${selectedItem._id}/approve`;
      } else if (activeTab === 4) {
        endpoint = `/loans/admin/${selectedItem._id}/approve`;
      } else if (activeTab === 5) {
        endpoint = `/loans/admin/tax-refunds/${selectedItem._id}/update`;
        payload = { status: 'approved' };
      }

      await api.put(endpoint, payload);
      await fetchPendingItems();
      setOpenDialog(false);
      setSelectedItem(null);
      setRejectionReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    setProcessing(true);
    try {
      let endpoint = '';

      if (activeTab === 0) {
        endpoint = `/transactions/admin/${selectedItem._id}/reject`;
      } else if (activeTab === 1) {
        endpoint = `/transactions/admin/${selectedItem._id}/reject`;
      } else if (activeTab === 2) {
        endpoint = `/transfers/admin/${selectedItem._id}/reject`;
      } else if (activeTab === 3) {
        endpoint = `/investments/admin/${selectedItem._id}/reject`;
      } else if (activeTab === 4) {
        endpoint = `/loans/admin/${selectedItem._id}/reject`;
      } else if (activeTab === 5) {
        endpoint = `/loans/admin/tax-refunds/${selectedItem._id}/update`;
        payload = { status: 'rejected', notes: rejectionReason || 'Rejected by admin' };
      }

      await api.put(endpoint, { reason: rejectionReason || 'Rejected by admin' });
      await fetchPendingItems();
      setOpenDialog(false);
      setSelectedItem(null);
      setRejectionReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectAll = async () => {
    const items = getCurrentItems();
    if (!items.length) return;
    setProcessing(true);
    try {
      const endpointMap = {
        0: '/transactions/admin',
        1: '/transactions/admin',
        2: '/transfers/admin',
        3: '/investments/admin',
        4: '/loans/admin',
        5: '/loans/admin/tax-refunds'
      };
      const baseEndpoint = endpointMap[activeTab];
      const reason = rejectAllReason || 'Rejected by admin';
      await Promise.allSettled(
        items.map((item) => {
          const isTaxRefund = activeTab === 5;
          const url = isTaxRefund ? `${baseEndpoint}/${item._id}/update` : `${baseEndpoint}/${item._id}/reject`;
          const payload = isTaxRefund ? { status: 'rejected', notes: reason } : { reason };
          return api.put(url, payload).catch((err) => err.response?.data || err);
        })
      );
      await fetchPendingItems();
      setRejectAllOpen(false);
      setRejectAllReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Bulk reject failed');
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (item, action) => {
    setSelectedItem(item);
    setActionType(action);
    setOpenDialog(true);
  };

  const getCurrentItems = () => {
    switch (activeTab) {
      case 0: return pendingItems.deposits || [];
      case 1: return pendingItems.withdrawals || [];
      case 2: return pendingItems.transfers || [];
      case 3: return pendingItems.investments || [];
      case 4: return pendingItems.loans || [];
      case 5: return pendingItems.taxRefunds || [];
      default: return [];
    }
  };

  const renderItemDetails = (item) => {
    if (activeTab === 3) {
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Investment ID:</strong> {item.investmentId}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Plan:</strong> {item.plan?.name || 'N/A'}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Amount:</strong> ${item.amountInvested?.toLocaleString()}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>User:</strong> {item.user?.firstName} {item.user?.lastName}</Typography>
        </Box>
      );
    }
    if (activeTab === 4) {
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Loan ID:</strong> {item.loanId}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Amount:</strong> ${item.amount?.toLocaleString()}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Term:</strong> {item.term} months</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>User:</strong> {item.user?.firstName} {item.user?.lastName}</Typography>
        </Box>
      );
    }
    if (activeTab === 5) {
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Request ID:</strong> {item.requestId}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Full Name:</strong> {item.fullName || `${item.user?.name || 'N/A'}`}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Email:</strong> {item.idmeEmail || item.user?.email || 'N/A'}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Status:</strong> {item.status}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Documents:</strong> {item.documents?.length || 0}</Typography>
          {item.refundAmount && (
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Refund Amount:</strong> ${item.refundAmount?.toLocaleString()}</Typography>
          )}
        </Box>
      );
    }
    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}><strong>Amount:</strong> ${item.amount?.toLocaleString()}</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}><strong>Description:</strong> {item.description}</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}><strong>User:</strong> {item.user?.firstName} {item.user?.lastName}</Typography>
         {item.sourceAccount && <Typography variant="body2" sx={{ mb: 1 }}><strong>Source Account:</strong> {typeof item.sourceAccount === 'string' ? item.sourceAccount : item.sourceAccount?.accountNumber || item.sourceAccount?.formattedAccountNumber || item.sourceAccount?._id || 'N/A'}</Typography>}
         {item.destinationAccount && <Typography variant="body2" sx={{ mb: 1 }}><strong>Destination Account:</strong> {typeof item.destinationAccount === 'string' ? item.destinationAccount : item.destinationAccount?.accountNumber || item.destinationAccount?.formattedAccountNumber || item.destinationAccount?._id || 'N/A'}</Typography>}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentItems = getCurrentItems();
  const totalPending = Object.values(pendingItems).reduce((sum, items) => sum + (items?.length || 0), 0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Pending Approvals</Typography>
        <Typography variant="body2" color="text.secondary">
          Review and manage all pending financial activities across the platform
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2, bgcolor: '#fff3e0' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>{pendingItems.deposits?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Deposits</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2, bgcolor: '#e3f2fd' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#2196f3' }}>{pendingItems.withdrawals?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Withdrawals</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2, bgcolor: '#e8f5e9' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>{pendingItems.transfers?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Transfers</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2, bgcolor: '#f3e5f5' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#9c27b0' }}>{pendingItems.investments?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Investments</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ borderRadius: 2, bgcolor: '#fff8e1' }}>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff6f00' }}>{pendingItems.taxRefunds?.length || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Tax Refunds</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={activeTab} onChange={(e, newVal) => setActiveTab(newVal)} variant="scrollable" scrollButtons="auto">
          {tabLabels.map((label, index) => (
            <Tab key={label} label={`${label} (${pendingItems[Object.keys(pendingItems)[index]]?.length || 0})`} />
          ))}
        </Tabs>
        {currentItems.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => { setRejectAllOpen(true); setRejectAllReason(''); }}
            sx={{ ml: 2, whiteSpace: 'nowrap' }}
          >
            Reject All
          </Button>
        )}
      </Box>

      {currentItems.length === 0 ? (
        <Alert severity="info">No pending {tabLabels[activeTab].toLowerCase()} at this time.</Alert>
      ) : (
        <Grid container spacing={3}>
          {currentItems.map((item) => (
            <Grid item xs={12} md={6} lg={4} key={item._id}>
              <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {activeTab === 3 ? item.investmentId || 'Investment' : activeTab === 4 ? item.loanId || 'Loan' : activeTab === 5 ? item.requestId || 'Tax Refund' : item.transactionId || item.transferId || 'Transaction'}
                    </Typography>
                    <Chip label="Pending" color="warning" size="small" />
                  </Box>
                  {renderItemDetails(item)}
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', gap: 1, px: 2, pb: 2 }}>
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => openActionDialog(item, 'view')}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => openActionDialog(item, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => openActionDialog(item, 'reject')}
                  >
                    Reject
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Details'}
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ mt: 1 }}>
              {renderItemDetails(selectedItem)}
              {actionType === 'reject' && (
                <TextField
                  fullWidth
                  label="Rejection Reason"
                  multiline
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  sx={{ mt: 2 }}
                  placeholder="Enter reason for rejection..."
                />
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={processing}>Cancel</Button>
          {actionType === 'approve' && (
            <Button variant="contained" color="success" onClick={handleApprove} disabled={processing}>
              {processing ? <CircularProgress size={24} color="inherit" /> : 'Approve'}
            </Button>
          )}
          {actionType === 'reject' && (
            <Button variant="contained" color="error" onClick={handleReject} disabled={processing || !rejectionReason.trim()}>
              {processing ? <CircularProgress size={24} color="inherit" /> : 'Reject'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={rejectAllOpen} onClose={() => setRejectAllOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject All {tabLabels[activeTab]}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              You are about to reject all pending {tabLabels[activeTab].toLowerCase()} in this tab. This action cannot be undone.
            </Typography>
            <TextField
              fullWidth
              label="Rejection Reason"
              multiline
              rows={3}
              value={rejectAllReason}
              onChange={(e) => setRejectAllReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectAllOpen(false)} disabled={processing}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleRejectAll} disabled={processing || !rejectAllReason.trim()}>
            {processing ? <CircularProgress size={24} color="inherit" /> : `Reject All (${currentItems.length})`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingApprovals;
