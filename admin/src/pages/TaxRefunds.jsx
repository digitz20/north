import React, { useState, useEffect } from 'react';
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
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  MenuItem
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../services/api';

const TaxRefunds = () => {
  const [taxRefunds, setTaxRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updateForm, setUpdateForm] = useState({
    status: '',
    refundAmount: '',
    notes: ''
  });

  useEffect(() => {
    fetchTaxRefunds();
  }, []);

  const fetchTaxRefunds = async () => {
    try {
      const response = await api.get('/loans/admin/tax-refunds');
      setTaxRefunds(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tax refunds:', error);
      setLoading(false);
    }
  };

  const handleViewRefund = (refund) => {
    setSelectedRefund(refund);
    setUpdateForm({
      status: refund.status,
      refundAmount: refund.refundAmount || '',
      notes: ''
    });
    setOpenDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedRefund) return;
    try {
      await api.put(`/loans/admin/tax-refunds/${selectedRefund._id}/update`, updateForm);
      setOpenDialog(false);
      fetchTaxRefunds();
    } catch (error) {
      console.error('Error updating tax refund:', error);
    }
  };

  const handleDeleteRefund = async (refundId) => {
    if (window.confirm('Are you sure you want to delete this tax refund request?')) {
      try {
        await api.delete(`/loans/admin/tax-refunds/${refundId}`);
        fetchTaxRefunds();
      } catch (error) {
        console.error('Error deleting tax refund:', error);
      }
    }
  };

  const filteredRefunds = taxRefunds.filter(refund => {
    const matchesSearch = refund.requestId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'submitted': return 'warning';
      case 'processing': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading tax refunds...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        IRS Tax Refund Management
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Search requests"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 400 }}
          />
          <TextField
            select
            label="Filter by status"
            variant="outlined"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="processing">Processing</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request ID</TableCell>
                <TableCell>Applicant</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted On</TableCell>
                <TableCell>Refund Amount</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRefunds.map((refund) => (
                <TableRow key={refund._id}>
                  <TableCell>{refund.requestId}</TableCell>
                  <TableCell>{refund.user?.fullName || refund.fullName}</TableCell>
                  <TableCell>{refund.user?.email || refund.idmeEmail}</TableCell>
                  <TableCell>{refund.country}</TableCell>
                  <TableCell>
                    <Chip
                      label={refund.status}
                      color={getStatusColor(refund.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(refund.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{refund.refundAmount ? `$${refund.refundAmount.toLocaleString()}` : 'Pending'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewRefund(refund)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteRefund(refund._id)}>
                      <CancelIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Tax Refund Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Tax Refund Request Details</DialogTitle>
        <DialogContent>
          {selectedRefund && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Applicant</Typography>
                <Typography>{selectedRefund.user?.fullName || selectedRefund.fullName}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Email</Typography>
                <Typography>{selectedRefund.user?.email || selectedRefund.idmeEmail}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">SSN</Typography>
                <Typography>XXX-XX-{selectedRefund.ssn?.slice(-4) || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Country</Typography>
                <Typography>{selectedRefund.country}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Current Status</Typography>
                <Typography>{selectedRefund.status}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Submitted</Typography>
                <Typography>{new Date(selectedRefund.submittedAt).toLocaleString()}</Typography>
              </Grid>
              
              <Grid item xs={12} sx={{ mt: 3 }}>
                <Typography variant="h6">Update Request</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="New Status"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                >
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Refund Amount"
                  type="number"
                  value={updateForm.refundAmount}
                  onChange={(e) => setUpdateForm({...updateForm, refundAmount: e.target.value})}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Admin Notes"
                  multiline
                  rows={3}
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button 
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={!updateForm.status}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxRefunds;