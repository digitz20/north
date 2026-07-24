import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, TextField, InputAdornment, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Visibility, Search, FilterList } from '@mui/icons-material';
import api from '../services/api';

const EmailLogs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailLogs, setEmailLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTo, setSearchTo] = useState('');
  const [searchSubject, setSearchSubject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const limit = 20;

  useEffect(() => {
    fetchEmailLogs();
  }, [page, searchTo, searchSubject, filterCategory]);

  const fetchEmailLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (searchTo) params.append('to', searchTo);
      if (searchSubject) params.append('subject', searchSubject);
      if (filterCategory) params.append('category', filterCategory);

      const response = await api.get(`/admin/email-logs?${params.toString()}`);
      setEmailLogs(response.data?.data?.emailLogs || []);
      setTotalPages(response.data?.data?.pagination?.pages || 1);
      setTotal(response.data?.data?.pagination?.total || 0);
    } catch (err) {
      setError('Failed to load email logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (emailLog) => {
    setSelectedEmail(emailLog);
    setOpenDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'success';
      case 'failed': return 'error';
      case 'bounced': return 'warning';
      case 'delivered': return 'info';
      default: return 'default';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'verification': return 'primary';
      case 'transaction': return 'success';
      case 'investment': return 'warning';
      case 'loan': return 'info';
      case 'support': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Email Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            View all emails sent to users on the platform
          </Typography>
        </Box>
        <Chip label={`Total: ${total}`} color="primary" variant="outlined" />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search recipient email..."
            value={searchTo}
            onChange={(e) => { setSearchTo(e.target.value); setPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <TextField
            size="small"
            placeholder="Search subject..."
            value={searchSubject}
            onChange={(e) => { setSearchSubject(e.target.value); setPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              label="Category"
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="verification">Verification</MenuItem>
              <MenuItem value="transaction">Transaction</MenuItem>
              <MenuItem value="investment">Investment</MenuItem>
              <MenuItem value="loan">Loan</MenuItem>
              <MenuItem value="support">Support</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>To</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emailLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                      No email logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  emailLogs.map((log) => (
                    <TableRow key={log._id} hover>
                      <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.to}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.subject}
                      </TableCell>
                      <TableCell>
                        <Chip label={log.category} color={getCategoryColor(log.category)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={log.status} color={getStatusColor(log.status)} size="small" />
                      </TableCell>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => handleViewDetails(log)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, gap: 1 }}>
              <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Typography sx={{ alignSelf: 'center' }}>Page {page} of {totalPages}</Typography>
              <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </Box>
          )}
        </>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Email Details</DialogTitle>
        <DialogContent>
          {selectedEmail && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>To:</strong> {selectedEmail.to}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Subject:</strong> {selectedEmail.subject}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Category:</strong> {selectedEmail.category}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Status:</strong> {selectedEmail.status}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}><strong>Sent At:</strong> {new Date(selectedEmail.createdAt).toLocaleString()}</Typography>
              {selectedEmail.messageId && (
                <Typography variant="body2" sx={{ mb: 1 }}><strong>Message ID:</strong> {selectedEmail.messageId}</Typography>
              )}
              {selectedEmail.error && (
                <Typography variant="body2" sx={{ mb: 1, color: 'error.main' }}><strong>Error:</strong> {selectedEmail.error}</Typography>
              )}
              {selectedEmail.body && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, maxHeight: 300, overflow: 'auto' }}>
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {selectedEmail.body}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailLogs;
