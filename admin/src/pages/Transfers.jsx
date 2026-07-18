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
  TextField,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  Link
} from '@mui/material';
import api from '../services/api';

const Transfers = () => {
  const location = useLocation();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [stats, setStats] = useState({
    totalToday: 0,
    totalVolume: 0,
    pendingTransfers: 0
  });

  useEffect(() => {
    setLoading(true);
    fetchTransfers();
    fetchStats();
  }, [location.pathname]);

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/admin/transfers');
      setTransfers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/transfers/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching transfer stats:', error);
    }
  };

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setOpenDetails(true);
  };

  const filteredTransfers = transfers.filter(transfer =>
    transfer.transferId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.transferType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Typography>Loading transfers...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Transfers
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Transfers Today
              </Typography>
              <Typography variant="h4">
                {stats.totalToday}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Volume
              </Typography>
              <Typography variant="h4">
                ${stats.totalVolume.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Transfers
              </Typography>
              <Typography variant="h4">
                {stats.pendingTransfers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Search transfers"
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
                <TableCell>Transfer ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Sender</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransfers.map((transfer) => (
                <TableRow key={transfer._id}>
                  <TableCell>{transfer.transferId}</TableCell>
                  <TableCell>{transfer.transferType}</TableCell>
                  <TableCell>{transfer.sender?.name || 'N/A'}</TableCell>
                  <TableCell>{transfer.recipient?.name || 'N/A'}</TableCell>
                  <TableCell>${transfer.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={transfer.status}
                      color={transfer.status === 'completed' ? 'success' : transfer.status === 'pending' ? 'warning' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(transfer.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="outlined"
                      onClick={() => handleViewDetails(transfer)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Transfer Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Transfer Details: {selectedTransfer?.transferId}
        </DialogTitle>
        <DialogContent>
          {selectedTransfer && (
            <>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Basic Information</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Amount:</strong> ${selectedTransfer.amount.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Status:</strong> {selectedTransfer.status}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Created:</strong> {new Date(selectedTransfer.createdAt).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2"><strong>Type:</strong> {selectedTransfer.transferType}</Typography>
                </Grid>
              </Grid>

              {/* Crypto Transfer Details */}
              {selectedTransfer.source?.walletAddress && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Crypto Transaction Details</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Source Wallet Address:</strong> {selectedTransfer.source.walletAddress}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Transaction Hash:</strong> {selectedTransfer.source.transactionHash}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2"><strong>Cryptocurrency:</strong> {selectedTransfer.source.crypto?.toUpperCase()}</Typography>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Uploaded Proofs */}
              {selectedTransfer.proofs && selectedTransfer.proofs.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Uploaded Transaction Proofs</Typography>
                  <List>
                    {selectedTransfer.proofs.map((proof, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={proof.name} 
                          secondary={`Uploaded: ${new Date(proof.uploadedAt).toLocaleString()}`}
                        />
                        {proof.url && (
                          <Link href={proof.url} target="_blank" rel="noopener">
                            <Button size="small" variant="outlined">View Proof</Button>
                          </Link>
                        )}
                      </ListItem>
                    ))}
                  </List>
                </>
              )}

              {(!selectedTransfer.proofs || selectedTransfer.proofs.length === 0) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No transaction proofs uploaded for this transfer.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Transfers;