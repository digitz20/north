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
  TextField,
  Grid
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/admin/support-tickets');
      setTickets(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setLoading(false);
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setOpenDialog(true);
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      await api.patch(`/admin/support-tickets/${ticketId}`, { 
        status: 'closed',
        adminReply: replyMessage
      });
      setOpenDialog(false);
      setReplyMessage('');
      fetchTickets();
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  if (loading) {
    return <Typography>Loading support tickets...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Support Tickets
      </Typography>

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket ID</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket._id}>
                  <TableCell>{ticket._id}</TableCell>
                  <TableCell>{ticket.subject}</TableCell>
                  <TableCell>{ticket.user?.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.priority}
                      color={ticket.priority === 'high' ? 'error' : ticket.priority === 'medium' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ticket.status}
                      color={ticket.status === 'open' ? 'success' : ticket.status === 'in-progress' ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewTicket(ticket)}>
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Ticket Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Ticket Details</DialogTitle>
        <DialogContent>
          {selectedTicket && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Subject</Typography>
                <Typography>{selectedTicket.subject}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">User Message</Typography>
                <Typography>{selectedTicket.message}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Priority</Typography>
                <Chip
                  label={selectedTicket.priority}
                  color={selectedTicket.priority === 'high' ? 'error' : 'warning'}
                  size="small"
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Status</Typography>
                <Chip
                  label={selectedTicket.status}
                  color={selectedTicket.status === 'open' ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
              {selectedTicket.status !== 'closed' && (
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <TextField
                    label="Admin Reply"
                    fullWidth
                    multiline
                    rows={4}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Enter your reply to the user..."
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
          {selectedTicket?.status !== 'closed' && (
            <Button 
              startIcon={<CheckCircleIcon />} 
              color="success" 
              onClick={() => handleCloseTicket(selectedTicket._id)}
              disabled={!replyMessage}
            >
              Close Ticket
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupportTickets;