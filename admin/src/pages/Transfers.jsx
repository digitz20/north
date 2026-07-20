import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Skeleton
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ErrorIcon from '@mui/icons-material/Error';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import api from '../services/api';

const Transfers = () => {
  const location = useLocation();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    byType: {},
    volume: { total: 0, monthly: 0 }
  });

  useEffect(() => {
    setLoading(true);
    fetchTransfers();
    fetchStats();
  }, [location.pathname]);

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/transfers/admin/all');
      setTransfers(response.data?.data?.transfers || response.data?.transfers || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/transfers/stats');
      setStats(response.data?.data || response.data || {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        byType: {},
        volume: { total: 0, monthly: 0 }
      });
    } catch (error) {
      console.error('Error fetching transfer stats:', error);
    }
  };

  const handleViewDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setOpenDetails(true);
  };

  const filteredTransfers = transfers.filter(transfer =>
    transfer.transferId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transfer.transferType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon, gradient, prefix = '', suffix = '' }) => (
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {loading ? (
                <Skeleton width={60} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
              ) : (
                <>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</>
              )}
            </Typography>
          </Box>
          <Box sx={{ opacity: 0.9 }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Transfers
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Transfers"
            value={stats.total}
            icon={<AccountBalanceIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #00C896 0%, #00BFFF 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<PendingActionsIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #0066FF 0%, #4D94FF 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Failed"
            value={stats.failed}
            icon={<ErrorIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)"
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <TextField
            label="Search transfers"
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
                  Transfer ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Sender
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Recipient
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Amount
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Date
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
              ) : filteredTransfers.length > 0 ? (
                filteredTransfers.map((transfer) => (
                  <TableRow
                    key={transfer._id}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{transfer.transferId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {transfer.transferType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transfer.sender?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transfer.recipient?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      ${transfer.amount ? Number(transfer.amount).toLocaleString() : '0'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transfer.status}
                        color={transfer.status === 'completed' ? 'success' : transfer.status === 'pending' ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transfer.createdAt ? new Date(transfer.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetails(transfer)}
                        sx={{ borderRadius: 2 }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    No transfers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Transfer Details: {selectedTransfer?.transferId}
        </DialogTitle>
        <DialogContent>
          {selectedTransfer && (
            <Box>
              <Typography variant="h6" sx={{ mt: 2, mb: 2, fontWeight: 600 }}>Basic Information</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Amount
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    ${selectedTransfer.amount ? Number(selectedTransfer.amount).toLocaleString() : '0'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={selectedTransfer.status}
                      color={selectedTransfer.status === 'completed' ? 'success' : selectedTransfer.status === 'pending' ? 'warning' : 'error'}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedTransfer.createdAt ? new Date(selectedTransfer.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, textTransform: 'capitalize' }}>
                    {selectedTransfer.transferType}
                  </Typography>
                </Grid>
              </Grid>

              {selectedTransfer.source?.walletAddress && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2, fontWeight: 600 }}>Crypto Transaction Details</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Source Wallet Address
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                        {selectedTransfer.source.walletAddress}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Transaction Hash
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                        {selectedTransfer.source.transactionHash}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Cryptocurrency
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5, textTransform: 'uppercase' }}>
                        {selectedTransfer.source.crypto}
                      </Typography>
                    </Grid>
                  </Grid>
                </>
              )}

              {selectedTransfer.proofs && selectedTransfer.proofs.length > 0 && (
                <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 2, fontWeight: 600 }}>Uploaded Transaction Proofs</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {selectedTransfer.proofs.map((proof, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'grey.50',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {proof.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded: {proof.uploadedAt ? new Date(proof.uploadedAt).toLocaleString() : 'N/A'}
                          </Typography>
                        </Box>
                        {proof.url && (
                          <Button
                            size="small"
                            variant="outlined"
                            href={proof.url}
                            target="_blank"
                            rel="noopener"
                            sx={{ borderRadius: 2 }}
                          >
                            View Proof
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Box>
                </>
              )}

              {(!selectedTransfer.proofs || selectedTransfer.proofs.length === 0) && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center', py: 4 }}>
                  No transaction proofs uploaded for this transfer.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Transfers;