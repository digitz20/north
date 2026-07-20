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
  Skeleton
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import api from '../services/api';

const Transactions = () => {
  const location = useLocation();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalToday: 0,
    totalVolume: 0,
    pendingTransactions: 0
  });

  useEffect(() => {
    setLoading(true);
    fetchTransactions();
    fetchStats();
  }, [location.pathname]);

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/admin/transactions');
      setTransactions(response.data?.data?.transactions || response.data?.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/transactions/stats');
      setStats(response.data?.data || response.data || {
        totalToday: 0,
        totalVolume: 0,
        pendingTransactions: 0
      });
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type?.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Skeleton width={80} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
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
        Transactions
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Transactions Today"
            value={stats.totalToday}
            icon={<PendingActionsIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #0066FF 0%, #4D94FF 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Volume"
            value={stats.totalVolume}
            prefix="$"
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #00C896 0%, #00BFFF 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Pending Transactions"
            value={stats.pendingTransactions}
            icon={<AccountBalanceIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)"
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <TextField
            label="Search transactions"
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
                  Transaction ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  From Account
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  To Account
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
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <TableRow
                    key={transaction._id}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>
                      {transaction.transactionId}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {transaction.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.fromAccount?.accountNumber || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.toAccount?.accountNumber || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      ${transaction.amount ? Number(transaction.amount).toLocaleString() : '0'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        color={transaction.status === 'completed' ? 'success' : transaction.status === 'pending' ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Transactions;
