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
  TextField,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import api from '../services/api';

const Transfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalToday: 0,
    totalVolume: 0,
    pendingTransfers: 0
  });

  useEffect(() => {
    fetchTransfers();
    fetchStats();
  }, []);

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Transfers;