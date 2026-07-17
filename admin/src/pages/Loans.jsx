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
  TextField
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../services/api';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/admin/loans');
      setLoans(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoading(false);
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
    } catch (error) {
      console.error('Error approving loan:', error);
    }
  };

  const handleRejectLoan = async (loanId) => {
    try {
      await api.patch(`/admin/loans/${loanId}`, { status: 'rejected' });
      setOpenDialog(false);
      fetchLoans();
    } catch (error) {
      console.error('Error rejecting loan:', error);
    }
  };

  const filteredLoans = loans.filter(loan =>
    loan.loanId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.loanType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Typography>Loading loans...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Loan Management
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Search loans"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 400 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Loan ID</TableCell>
                <TableCell>Borrower</TableCell>
                <TableCell>Loan Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Interest Rate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Applied On</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan._id}>
                  <TableCell>{loan.loanId}</TableCell>
                  <TableCell>{loan.user?.name}</TableCell>
                  <TableCell>{loan.loanType}</TableCell>
                  <TableCell>${loan.amount.toLocaleString()}</TableCell>
                  <TableCell>{loan.interestRate}%</TableCell>
                  <TableCell>
                    <Chip
                      label={loan.status}
                      color={loan.status === 'approved' ? 'success' : loan.status === 'pending' ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(loan.appliedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewLoan(loan)}>
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Loan Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Loan Application Details</DialogTitle>
        <DialogContent>
          {selectedLoan && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Borrower</Typography>
                <Typography>{selectedLoan.user?.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Email</Typography>
                <Typography>{selectedLoan.user?.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Loan Type</Typography>
                <Typography>{selectedLoan.loanType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Amount</Typography>
                <Typography>${selectedLoan.amount.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Interest Rate</Typography>
                <Typography>{selectedLoan.interestRate}%</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Term</Typography>
                <Typography>{selectedLoan.term} months</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Purpose</Typography>
                <Typography>{selectedLoan.purpose}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
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
                onClick={() => handleApproveLoan(selectedLoan._id)}
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