import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tab,
  Tabs,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
  Badge,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  InputAdornment,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import api from '../services/api';
import { useSocket } from '../contexts/SocketContext';

const SupportTickets = () => {
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  const { socket, isConnected, joinChat, leaveChat, sendMessage, emitTyping, emitStopTyping, markMessageAsRead } = useSocket();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openChat, setOpenChat] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [typingUser, setTypingUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketMessages, setTicketMessages] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const updateTicketMessages = useCallback((ticketId, newMessage) => {
    setTicketMessages(prev => {
      const existing = prev[ticketId] || [];
      if (existing.some(msg => msg._id === newMessage._id)) {
        return prev;
      }
      return {
        ...prev,
        [ticketId]: [...existing, newMessage]
      };
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchTickets();
  }, [location.pathname]);

  useEffect(() => {
    if (socket && user) {
      socket.emit('joinSupportTeam', user._id);
    }

    return () => {
      if (socket && user) {
        socket.emit('leaveSupportTeam', user._id);
      }
    };
  }, [socket, user]);

  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data) => {
      updateTicketMessages(data.ticketId, data.message);

      if (selectedTicket?._id !== data.ticketId) {
        setUnreadCounts(prev => ({
          ...prev,
          [data.ticketId]: (prev[data.ticketId] || 0) + 1
        }));
      } else {
        markMessageAsRead(data.ticketId, data.message._id);
      }

      if (selectedTicket?._id === data.ticketId) {
        scrollToBottom();
      }
    };

    const handleTyping = (data) => {
      if (data.ticketId === selectedTicket?._id) {
        setTypingUser(data.userId);
      }
    };

    const handleStopTyping = (data) => {
      if (data.ticketId === selectedTicket?._id) {
        setTypingUser(null);
      }
    };

    const handleTicketUpdated = (updatedTicket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('ticketUpdated', handleTicketUpdated);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('ticketUpdated', handleTicketUpdated);
    };
  }, [socket, selectedTicket, updateTicketMessages, markMessageAsRead, scrollToBottom]);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/support/admin/tickets');
      const ticketsData = response.data?.data?.tickets || response.data?.tickets || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);

      const messages = {};
      (Array.isArray(ticketsData) ? ticketsData : []).forEach(ticket => {
        if (ticket.messages) {
          messages[ticket._id] = ticket.messages;
        } else {
          messages[ticket._id] = [];
        }
      });
      setTicketMessages(messages);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
      setTickets([]);
      setLoading(false);
    }
  };

  const handleOpenChat = useCallback(async (ticket) => {
    setSelectedTicket(ticket);
    setOpenChat(true);
    setUnreadCounts(prev => ({ ...prev, [ticket._id]: 0 }));
    
    try {
      const response = await api.get(`/support/tickets/${ticket._id}`);
      const ticketData = response.data?.data || response.data;
      if (ticketData && ticketData.messages) {
        setTicketMessages(prev => ({
          ...prev,
          [ticket._id]: ticketData.messages
        }));
      }
    } catch (error) {
      console.error('Error fetching ticket messages:', error);
    }
    
    joinChat(ticket._id);

    if (ticketMessages[ticket._id]) {
      ticketMessages[ticket._id].forEach(msg => {
        if (!msg.read && msg.sender !== user._id) {
          markMessageAsRead(ticket._id, msg._id);
        }
      });
    }
    setTimeout(scrollToBottom, 100);
  }, [joinChat, markMessageAsRead, scrollToBottom, ticketMessages, user._id]);

  const handleCloseChat = useCallback(() => {
    if (selectedTicket) {
      leaveChat(selectedTicket._id);
    }
    setOpenChat(false);
    setSelectedTicket(null);
    setReplyMessage('');
    setTypingUser(null);
  }, [leaveChat, selectedTicket]);

  const handleAcceptTicket = useCallback(async (ticket) => {
    try {
      await api.patch(`/admin/support-tickets/${ticket._id}`, {
        status: 'active',
        assignedTo: user._id
      });
      handleOpenChat(ticket);
      fetchTickets();
    } catch (error) {
      console.error('Error accepting ticket:', error);
    }
  }, [fetchTickets, handleOpenChat, user._id]);

  const handleCloseTicket = useCallback(async (ticketId) => {
    try {
      await api.patch(`/admin/support-tickets/${ticketId}`, {
        status: 'closed'
      });
      handleCloseChat();
      fetchTickets();
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  }, [fetchTickets, handleCloseChat]);

  const handleReopenTicket = useCallback(async (ticketId) => {
    try {
      await api.patch(`/admin/support-tickets/${ticketId}`, {
        status: 'active'
      });
      fetchTickets();
    } catch (error) {
      console.error('Error reopening ticket:', error);
    }
  }, [fetchTickets]);

  const handleDeleteTicket = useCallback(async (ticketId) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/support-tickets/${ticketId}`);
      setTickets(prev => prev.filter(t => t._id !== ticketId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting ticket:', error);
    } finally {
      setDeleteLoading(false);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    const messageText = replyMessage.trim();
    setReplyMessage('');

    if (isConnected && socket) {
      sendMessage({
        ticketId: selectedTicket._id,
        message: messageText
      });
      emitStopTyping(selectedTicket._id);
      scrollToBottom();
    } else {
      try {
        const response = await api.post(`/support/tickets/${selectedTicket._id}/messages`, {
          message: messageText,
          sender: user._id,
          senderName: user?.firstName || user?.name || 'Admin'
        });
        
        const savedMessage = response.data?.data || response.data;
        if (savedMessage) {
          updateTicketMessages(selectedTicket._id, savedMessage);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        return;
      }
      emitStopTyping(selectedTicket._id);
      scrollToBottom();
    }
  };

  const handleTyping = (e) => {
    setReplyMessage(e.target.value);

    if (selectedTicket) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      emitTyping(selectedTicket._id);

      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(selectedTicket._id);
      }, 2000);
    }
  };

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      if (activeTab === 1 && ticket.status !== 'waiting') return false;
      if (activeTab === 2 && ticket.status !== 'active') return false;
      if (activeTab === 3 && ticket.status !== 'closed') return false;

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (ticket.user?.firstName?.toLowerCase().includes(searchLower) || false) ||
          (ticket.user?.lastName?.toLowerCase().includes(searchLower) || false) ||
          ticket._id.toLowerCase().includes(searchLower) ||
          ticket.subject?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [tickets, activeTab, searchTerm]);

  const getStatusChip = useCallback((status) => {
    const statusConfig = {
      waiting: { color: 'warning', icon: <HourglassEmptyIcon fontSize="small" />, label: 'Waiting' },
      active: { color: 'success', icon: <PlayCircleFilledIcon fontSize="small" />, label: 'Active' },
      closed: { color: 'default', icon: <CloseIcon fontSize="small" />, label: 'Closed' }
    };
    const config = statusConfig[status] || statusConfig.waiting;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        icon={config.icon}
        sx={{ minWidth: 90, fontWeight: 500 }}
      />
    );
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Live Support Console
      </Typography>

      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Badge
          variant="dot"
          color={isConnected ? "success" : "error"}
          sx={{ '& .MuiBadge-dot': { width: 12, height: 12 } }}
        >
          <ChatIcon color="action" />
        </Badge>
        <Typography variant="body2" color="text.secondary">
          {isConnected ? 'Connected to chat server' : 'Disconnected - reconnecting...'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 3, pb: 2 }}>
              <TextField
                fullWidth
                placeholder="Search tickets by user, ID, or subject..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
                <Tab label={`All (${tickets.length})`} />
                <Tab
                  label={`Waiting (${tickets.filter(t => t.status === 'waiting').length})`}
                  sx={{ '&.Mui-selected': { color: 'warning.main' } }}
                />
                <Tab
                  label={`Active (${tickets.filter(t => t.status === 'active').length})`}
                  sx={{ '&.Mui-selected': { color: 'success.main' } }}
                />
                <Tab label={`Closed (${tickets.filter(t => t.status === 'closed').length})`} />
              </Tabs>
            </Box>

            <List sx={{ maxHeight: '60vh', overflow: 'auto' }}>
              {filteredTickets.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <HourglassEmptyIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography>No tickets found in this category</Typography>
                </Box>
              ) : (
                filteredTickets.map((ticket) => (
                  <React.Fragment key={ticket._id}>
                    <ListItem
                      button
                      onClick={() => handleOpenChat(ticket)}
                      sx={{
                        borderRadius: 1,
                        mx: 2,
                        my: 1,
                        backgroundColor: unreadCounts[ticket._id] ? 'rgba(0,102,255,0.05)' : 'transparent',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                        transition: 'background-color 0.2s',
                      }}
                      secondaryAction={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} onClick={(e) => e.stopPropagation()}>
                          {unreadCounts[ticket._id] > 0 && (
                            <Chip
                              label={unreadCounts[ticket._id]}
                              color="primary"
                              size="small"
                              sx={{ minWidth: 30, fontWeight: 600 }}
                            />
                          )}
                          {ticket.status === 'waiting' && (
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleAcceptTicket(ticket)}
                              sx={{
                                background: 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #0052cc 0%, #0099cc 100%)',
                                },
                              }}
                            >
                              Accept
                            </Button>
                          )}
                          {(ticket.status === 'active' || ticket.status === 'closed') && (
                            <IconButton onClick={() => ticket.status === 'active' ? handleOpenChat(ticket) : null}>
                              <ChatIcon color={ticket.status === 'active' ? 'primary' : 'disabled'} />
                            </IconButton>
                          )}
                          <Tooltip title="Delete Ticket">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirmId(ticket._id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: ticket.status === 'active' ? '#0066ff' : ticket.status === 'waiting' ? '#ff9800' : '#9e9e9e' }}>
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {ticket.user?.firstName} {ticket.user?.lastName || 'Unknown User'}
                          </Typography>
                          {getStatusChip(ticket.status)}
                          {ticket.assignedTo && ticket.assignedTo._id === user._id && (
                            <Chip
                              label="Assigned to you"
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            <strong>#{ticket._id}</strong> - {ticket.subject}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(ticket.createdAt).toLocaleString()}
                            {ticket.lastMessageAt && ` - Last message: ${new Date(ticket.lastMessageAt).toLocaleTimeString()}`}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Live Stats</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.dark' }}>
                      {tickets.filter(t => t.status === 'waiting').length}
                    </Typography>
                    <Typography variant="body2">Waiting</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.dark' }}>
                      {tickets.filter(t => t.status === 'active').length}
                    </Typography>
                    <Typography variant="body2">Active</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Quick Actions</Typography>
              <List disablePadding>
                <ListItem sx={{ px: 0, py: 1.5, borderRadius: 1, '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' } }}>
                  <ListItemAvatar><TransferWithinAStationIcon /></ListItemAvatar>
                  <ListItemText primary="Transfer Chat" secondary="Move to another agent" />
                </ListItem>
                <Divider />
                <ListItem sx={{ px: 0, py: 1.5, borderRadius: 1, '&:hover': { bgcolor: 'rgba(0, 102, 255, 0.03)' } }}>
                  <ListItemAvatar><MarkEmailUnreadIcon /></ListItemAvatar>
                  <ListItemText primary="Mark as Unread" secondary="Flag for follow-up" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Ticket</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this ticket? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)} disabled={deleteLoading}>Cancel</Button>
          <Button
            onClick={() => deleteConfirmId && handleDeleteTicket(deleteConfirmId)}
            color="error"
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openChat}
        onClose={handleCloseChat}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            height: '85vh',
            maxHeight: '800px',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {selectedTicket && (
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                p: 2,
                background: 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Chat with {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  #{selectedTicket._id} - {selectedTicket.subject}
                  {typingUser && <span style={{ marginLeft: 10, fontStyle: 'italic' }}>typing...</span>}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedTicket.status !== 'closed' ? (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleCloseTicket(selectedTicket._id)}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  >
                    Close Chat
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleReopenTicket(selectedTicket._id)}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
                  >
                    Reopen
                  </Button>
                )}
                <IconButton onClick={handleCloseChat} sx={{ color: 'white' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              <Box sx={{ width: 280, borderRight: 1, borderColor: 'divider', p: 2, bgcolor: '#fafafa', overflow: 'auto' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                  CUSTOMER DETAILS
                </Typography>

                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      bgcolor: '#0066ff',
                      fontSize: 32,
                      mx: 'auto',
                      mb: 1
                    }}
                  >
                    {selectedTicket.user?.firstName?.charAt(0) || selectedTicket.user?.name?.charAt(0) || 'U'}
                  </Avatar>
                  <Typography variant="h6">
                    {selectedTicket.user?.firstName} {selectedTicket.user?.lastName || ''}
                  </Typography>
                  <Chip
                    label="Verified"
                    size="small"
                    color="success"
                    icon={<CheckCircleIcon fontSize="small" />}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <List disablePadding>
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <EmailIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText
                      primary={selectedTicket.user?.email}
                      secondary="Email"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <PhoneIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText
                      primary={selectedTicket.user?.phone || 'Not provided'}
                      secondary="Phone"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem sx={{ px: 0, py: 1 }}>
                    <PersonIcon fontSize="small" sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText
                      primary={selectedTicket.user?.accountType || 'Standard'}
                      secondary="Account Type"
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  TICKET INFO
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Priority</Typography>
                  <Chip
                    label={selectedTicket.priority}
                    size="small"
                    color={selectedTicket.priority === 'high' ? 'error' : selectedTicket.priority === 'medium' ? 'warning' : 'default'}
                    sx={{ ml: 1 }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                </Typography>
                {selectedTicket.updatedAt && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last updated: {new Date(selectedTicket.updatedAt).toLocaleString()}
                  </Typography>
                )}
              </Box>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f7fafc' }}>
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                  {(ticketMessages[selectedTicket._id] || []).map((msg, index) => {
                    const isAgent = msg.senderRole === 'admin' || msg.sender?.role === 'admin';
                    const isOwn = isAgent;
                    
                    const getMessageStatus = (message) => {
                      if (!isOwn) return null;
                      
                      const isRead = message.readBy?.some(read => {
                        const readUserId = read.user?._id || read.user;
                        return readUserId?.toString?.() === user._id?.toString?.();
                      });
                      
                      if (isRead) {
                        return <DoneAllIcon fontSize="small" sx={{ fontSize: 14, color: '#4ade80' }} />;
                      }
                      if (message.delivered) {
                        return <DoneAllIcon fontSize="small" sx={{ fontSize: 14, opacity: 0.7 }} />;
                      }
                      return <CheckIcon fontSize="small" sx={{ fontSize: 14, opacity: 0.7 }} />;
                    };
                    
                    return (
                      <Box
                        key={msg._id || index}
                        sx={{
                          display: 'flex',
                          justifyContent: isOwn ? 'flex-end' : 'flex-start',
                          mb: 2
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 2,
                            borderRadius: 2,
                            bgcolor: isOwn ? '#0066ff' : 'white',
                            color: isOwn ? 'white' : 'text.primary',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            position: 'relative'
                          }}
                        >
                          <Typography variant="body2" sx={{ mb: 0.5 }}>{msg.message}</Typography>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ opacity: 0.7 }}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                            {getMessageStatus(msg)}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>

                <Box sx={{ p: 2, bgcolor: 'white', borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Type your message..."
                      variant="outlined"
                      size="small"
                      value={replyMessage}
                      onChange={handleTyping}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={selectedTicket.status === 'closed'}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendMessage}
                      disabled={!replyMessage.trim() || selectedTicket.status === 'closed'}
                      sx={{
                        background: 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)',
                        color: 'white',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #0052cc 0%, #0099cc 100%)',
                        },
                        '&.Mui-disabled': {
                          background: '#e0e0e0',
                          color: '#9e9e9e'
                        }
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                  {selectedTicket.status === 'closed' && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                      This chat is closed. Reopen to send messages.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

export default SupportTickets;
