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
  CardContent
} from '@mui/material';
import api from '../services/api';

const Investments = () => {
  const location = useLocation();
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalInvestments: 0,
    activeInvestments: 0,
    totalPortfolioValue: 0
  });

  useEffect(() => {
    setLoading(true);
    fetchInvestments();
    fetchStats();
  }, [location.pathname]);

  const fetchInvestments = async () => {
    try {
      const response = await api.get('/admin/investments');
      setInvestments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching investments:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/investments/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching investment stats:', error);
    }
  };

  const filteredInvestments = investments.filter(investment =>
    investment.investmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    investment.investmentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Typography>Loading investments...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Investment Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Investments
              </Typography>
              <Typography variant="h4">
                {stats.totalInvestments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Investments
              </Typography>
              <Typography variant="h4">
                {stats.activeInvestments}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Portfolio Value
              </Typography>
              <Typography variant="h4">
                ${stats.totalPortfolioValue.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Search investments"
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
                <TableCell>Investment ID</TableCell>
                <TableCell>Investor</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount Invested</TableCell>
                <TableCell>Current Value</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Start Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvestments.map((investment) => (
                <TableRow key={investment._id}>
                  <TableCell>{investment.investmentId}</TableCell>
                  <TableCell>{investment.user?.name}</TableCell>
                  <TableCell>{investment.investmentType}</TableCell>
                  <TableCell>${investment.amount.toLocaleString()}</TableCell>
                  <TableCell>${investment.currentValue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={investment.status}
                      color={investment.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(investment.startDate).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default Investments;