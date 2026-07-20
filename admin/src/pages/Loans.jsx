import React, { useState, useEffect } from 'react';
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
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Card,
  CardContent,
  Skeleton
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import api from '../services/api';

const Loans = () => {
  const location = useLocation();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalLoans: 0,
    pendingLoans: 0,
    totalAmount: 0
  });

  useEffect(() => {
    setLoading(true);
    fetchLoans();
    fetchStats();
  }, [location.pathname]);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/admin/loans');
      setLoans(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/loans/stats');
      setStats(response.data?.data || response.data || {
        totalLoans: 0,
        pendingLoans: 0,
        totalAmount: 0
      });
    } catch (error) {
      console.error('Error fetching loan stats:', error);
    }
  };

  const handleViewLoan = (loan) => {
    setSelectedLoan(loan);
    setOpenDialog(true);
  };

  const handleApproveLoan = async (loanId) => {
    try {
      await api.patch(`/admin/loans/${loanId}`, { status: 'approved' });
      setOpenDialog(false);
      fetchLoans();
      fetchStats();
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  };

  const handleRejectLoan = async (loanId) => {
    try {
      await api.patch(`/admin/loans/${loanId}`, { status: 'rejected' });
      setOpenDialog(false);
      fetchLoans();
      fetchStats();
    } catch (error) {
      console.error('Error rejecting loan:', error);
    }
  };

  const filteredLoans = loans.filter(loan =>
    loan.loanId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, gradient, prefix = '', suffix = '' }) => (
    <Card
      sx={{
        height: '100%',
        background: gradient,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 40px rgba(0, 102, 255, 0.15)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
        },
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
          {title}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {loading ? (
            <Skeleton width={80} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
          ) : (
            <>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</>
          )}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Loan Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Loans"
            value={stats.totalLoans}
            gradient="linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Pending Loans"
            value={stats.pendingLoans}
            gradient="linear-gradient(135deg, #0066FF 0%, #4D94FF 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Amount"
            value={stats.totalAmount}
            prefix="$"
            gradient="linear-gradient(135deg, #00C896 0%, #00BFFF 100%)"
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <TextField
            label="Search loans"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 400 }}
            placeholder="Search by ID or type..."
            InputProps={{ sx: { borderRadius: 2 } }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Loan ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Borrower
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Loan Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Interest Rate
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Applied On
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
              ) : filteredLoans.length > 0 ? (
                filteredLoans.map((loan) => (
                  <TableRow
                    key={loan._id}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{loan.loanId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {loan.user?.fullName || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {loan.loanType}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      ${loan.amount ? Number(loan.amount).toLocaleString() : '0'}
                    </TableCell>
                    <TableCell>{loan.interestRate}%</TableCell>
                    <TableCell>
                      <Chip
                        label={loan.status}
                        color={loan.status === 'approved' ? 'success' : loan.status === 'pending' ? 'warning' : loan.status === 'rejected' ? 'error' : 'default'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {loan.appliedAt ? new Date(loan.appliedAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton onClick={() => handleViewLoan(loan)} size="small" sx={{ color: 'primary.main' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    No loans found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>Loan Application Details</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Borrower
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedLoan.user?.fullName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedLoan.user?.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Loan Type
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500, textTransform: 'capitalize' }}>
                  {selectedLoan.loanType}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Amount
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600 }}>
                  ${selectedLoan.amount ? Number(selectedLoan.amount).toLocaleString() : '0'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Interest Rate
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedLoan.interestRate}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Term
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedLoan.term} months
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Purpose
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedLoan.purpose}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedLoan.status}
                    color={selectedLoan.status === 'approved' ? 'success' : selectedLoan.status === 'pending' ? 'warning' : selectedLoan.status === 'rejected' ? 'error' : 'default'}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Applied On
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 500 }}>
                  {selectedLoan.appliedAt ? new Date(selectedLoan.appliedAt).toLocaleDateString() : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {selectedLoan?.status === 'pending' && (
            <>
              <Button
                startIcon={<CancelIcon />}
                color="error"
                onClick={() => handleRejectLoan(selectedLoan._id)}
              >
                Reject
              </Button>
              <Button
                startIcon={<CheckCircleIcon />}
                color="success"
                variant="contained"
                onClick={() => handleApproveLoan(selectedLoan._id)}
                sx={{
                  background: 'linear-gradient(135deg, #00C896 0%, #00BFFF 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #009B70 0%, #0099CC 100%)' },
                }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loans;
