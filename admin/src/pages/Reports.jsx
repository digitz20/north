import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../services/api';

const Reports = () => {
  const [reportType, setReportType] = useState('transactions');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/reports/${reportType}`, {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      setReportData(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const csvContent = convertToCSV(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] ?? '')).join(','))
    ];
    return csvRows.join('\n');
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Reports
      </Typography>

      <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="transactions">Transactions Report</MenuItem>
                <MenuItem value="users">Users Report</MenuItem>
                <MenuItem value="accounts">Accounts Report</MenuItem>
                <MenuItem value="loans">Loans Report</MenuItem>
                <MenuItem value="investments">Investments Report</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={generateReport}
                disabled={loading}
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  '&:hover': { background: 'linear-gradient(135deg, #0052CC 0%, #0099CC 100%)' },
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Generate Report'}
              </Button>
              {reportData.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadReport}
                  sx={{ borderRadius: 2 }}
                >
                  Download
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {reportData.length > 0 && (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {Object.keys(reportData[0]).map((key) => (
                    <TableCell key={key} sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'text.secondary' }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    {Object.values(row).map((value, i) => (
                      <TableCell key={i}>
                        {typeof value === 'boolean' ? (
                          <Chip
                            label={value ? 'Yes' : 'No'}
                            color={value ? 'success' : 'default'}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        ) : (
                          String(value)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default Reports;
