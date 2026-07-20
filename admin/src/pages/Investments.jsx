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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';

const Investments = () => {
  const location = useLocation();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalInvestments: 0,
    activeInvestments: 0,
    completedInvestments: 0,
    summary: {},
    byType: {}
  });

  useEffect(() => {
    setLoading(true);
    fetchInvestments();
    fetchStats();
  }, [location.pathname]);

  const fetchInvestments = async () => {
    try {
      const response = await api.get('/investments/admin/all');
      setInvestments(response.data?.data?.investments || response.data?.investments || []);
    } catch (error) {
      console.error('Error fetching investments:', error);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/investments/stats');
      setStats(response.data?.data || response.data || {
        totalInvestments: 0,
        activeInvestments: 0,
        completedInvestments: 0,
        summary: {},
        byType: {}
      });
    } catch (error) {
      console.error('Error fetching investment stats:', error);
    }
  };

  const filteredInvestments = investments.filter(investment =>
    investment.investmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.investmentType?.toLowerCase().includes(searchTerm.toLowerCase())
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
        Investment Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Investments"
            value={stats.totalInvestments}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Active Investments"
            value={stats.activeInvestments}
            icon={<AccountBalanceWalletIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #00C896 0%, #00BFFF 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Completed Investments"
            value={stats.completedInvestments}
            icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
            gradient="linear-gradient(135deg, #0066FF 0%, #4D94FF 100%)"
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <TextField
            label="Search investments"
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
                  Investment ID
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Investor
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Amount Invested
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Current Value
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Status
                </TableCell>
                <TableCell sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                  Start Date
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
              ) : filteredInvestments.length > 0 ? (
                filteredInvestments.map((investment) => (
                  <TableRow
                    key={investment._id}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell sx={{ fontFamily: 'monospace' }}>{investment.investmentId}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {investment.user?.name || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {investment.investmentType}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      ${investment.amount ? Number(investment.amount).toLocaleString() : '0'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      ${investment.currentValue ? Number(investment.currentValue).toLocaleString() : '0'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={investment.status}
                        color={investment.status === 'active' ? 'success' : investment.status === 'completed' ? 'info' : 'default'}
                        size="small"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {investment.startDate ? new Date(investment.startDate).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    No investments found
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

export default Investments;