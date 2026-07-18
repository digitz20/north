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
  TextField,
  Grid
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../services/api';

const KYCReview = () => {
  const location = useLocation();
  const [kycApplications, setKYCApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchKYCApplications();
  }, [location.pathname]);

  const fetchKYCApplications = async () => {
    try {
      const response = await api.get('/admin/kyc');
      setKYCApplications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching KYC applications:', error);
      setLoading(false);
    }
  };

  const handleViewApplication = (application) => {
    setSelectedApplication(application);
    setOpenDialog(true);
  };

  const handleApprove = async (applicationId) => {
    try {
      await api.patch(`/admin/kyc/${applicationId}`, { status: 'approved' });
      setOpenDialog(false);
      fetchKYCApplications();
    } catch (error) {
      console.error('Error approving KYC:', error);
    }
  };

  const handleReject = async (applicationId) => {
    try {
      await api.patch(`/admin/kyc/${applicationId}`, { 
        status: 'rejected',
        rejectionReason 
      });
      setOpenDialog(false);
      setRejectionReason('');
      fetchKYCApplications();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
    }
  };

  if (loading) {
    return <Typography>Loading KYC applications...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        KYC Review
      </Typography>

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Application ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Submitted At</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {kycApplications.map((application) => (
                <TableRow key={application._id}>
                  <TableCell>{application._id}</TableCell>
                  <TableCell>{application.user?.name}</TableCell>
                  <TableCell>{application.documentType}</TableCell>
                  <TableCell>{new Date(application.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={application.status}
                      color={application.status === 'approved' ? 'success' : application.status === 'pending' ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewApplication(application)}>
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* KYC Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>KYC Application Details</DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">User Name</Typography>
                <Typography>{selectedApplication.user?.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">User Email</Typography>
                <Typography>{selectedApplication.user?.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Document Type</Typography>
                <Typography>{selectedApplication.documentType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Document Number</Typography>
                <Typography>{selectedApplication.documentNumber}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Current Status</Typography>
                <Chip
                  label={selectedApplication.status}
                  color={selectedApplication.status === 'approved' ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
              {selectedApplication.status === 'pending' && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <TextField
                    label="Rejection Reason (if rejecting)"
                    fullWidth
                    multiline
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {selectedApplication?.status === 'pending' && (
            <>
              <Button 
                startIcon={<CancelIcon />} 
                color="error" 
                onClick={() => handleReject(selectedApplication._id)}
                disabled={!rejectionReason}
              >
                Reject
              </Button>
              <Button 
                startIcon={<CheckCircleIcon />} 
                color="success" 
                onClick={() => handleApprove(selectedApplication._id)}
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

export default KYCReview;