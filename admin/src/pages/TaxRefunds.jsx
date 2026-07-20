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
  MenuItem,
  Skeleton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CancelIcon from '@mui/icons-material/Cancel';
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
      // Correctly extract array - add safeguard to ensure it's always an array
      const refundsData = response.data?.data || response.data || [];
      setTaxRefunds(Array.isArray(refundsData) ? refundsData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tax refunds:', error);
      setTaxRefunds([]);
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
      await api.patch(`/admin/tax-refunds/${selectedRefund._id}`, updateForm);
      setOpenDialog(false);
      fetchTaxRefunds();
    } catch (error) {
      console.error('Error updating tax refund:', error);
    }
  };

  const handleDeleteRefund = async (refundId) => {
    if (window.confirm('Are you sure you want to delete this tax refund request?')) {
      try {
        await api.delete(`/admin/tax-refunds/${refundId}`);
        fetchTaxRefunds();
      } catch (error) {
        console.error('Error deleting tax refund:', error);
      }
    }
  };

  const filteredRefunds = taxRefunds.filter(refund => {
    const matchesSearch = refund.requestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || refund.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        IRS Tax Refund Management
      </Typography>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Search requests"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ maxWidth: 400 }}
              placeholder="Search by ID or applicant..."
              InputProps={{ sx: { borderRadius: 2 } }}
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
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Request ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Applicant
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Email
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Country
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Submitted On
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Refund Amount
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
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRefunds.length > 0 ? (
                filteredRefunds.map((refund) => (
                  <TableRow
                    key={refund._id}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{refund.requestId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {refund.user?.fullName || refund.fullName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {refund.user?.email || refund.idmeEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>{refund.country}</TableCell>
                    <TableCell>
                      <Chip
                        label={refund.status}
                        color={getStatusColor(refund.status)}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(refund.submittedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {refund.refundAmount ? `$${Number(refund.refundAmount).toLocaleString()}` : 'Pending'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewRefund(refund)} size="small" sx={{ color: 'primary.main' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDeleteRefund(refund._id)} size="small">
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    No tax refund requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Tax Refund Request Details</DialogTitle>
        <DialogContent>
          {selectedRefund && (
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Applicant
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedRefund.user?.fullName || selectedRefund.fullName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedRefund.user?.email || selectedRefund.idmeEmail}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SSN
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  XXX-XX-{selectedRefund.ssn?.slice(-4) || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Country
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedRefund.country}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Status
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedRefund.status}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Submitted
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {new Date(selectedRefund.submittedAt).toLocaleString()}
                </Typography>
              </Grid>

              <Grid item xs={12} sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Update Request</Typography>
              </Grid>

              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="New Status"
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                  onChange={(e) => setUpdateForm({ ...updateForm, refundAmount: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Admin Notes"
                  multiline
                  rows={3}
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={handleUpdateStatus}
            disabled={!updateForm.status}
            sx={{
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)' },
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaxRefunds;