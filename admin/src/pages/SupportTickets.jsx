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
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import EditIcon from '@mui/icons-material/Edit';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import MarkEmailUnreadIcon from '@mui/icons-material/MarkEmailUnread';
import ImageIcon from '@mui/icons-material/Image';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
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
  const [userDetails, setUserDetails] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

  const selectedTicketRef = useRef(null);
  const updateTicketMessagesRef = useRef(null);
  const markMessageAsReadRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const editInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const getMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const saveMessagesToStorage = useCallback((ticketId, messages) => {
    try {
      const allMessages = JSON.parse(localStorage.getItem('admin_chat_messages') || '{}');
      allMessages[ticketId] = messages.slice(-100);
      localStorage.setItem('admin_chat_messages', JSON.stringify(allMessages));
    } catch (e) {
      console.error('Error saving messages to localStorage:', e);
    }
  }, []);

  const loadMessagesFromStorage = useCallback((ticketId) => {
    try {
      const allMessages = JSON.parse(localStorage.getItem('admin_chat_messages') || '{}');
      return allMessages[ticketId] || [];
    } catch (e) {
      return [];
    }
  }, []);

  const updateTicketMessages = useCallback((ticketId, newMessage) => {
    setTicketMessages(prev => {
      const existing = prev[ticketId] || [];
      if (existing.some(msg => msg._id === newMessage._id)) {
        return prev;
      }
      const updated = {
        ...prev,
        [ticketId]: [...existing, newMessage]
      };
      saveMessagesToStorage(ticketId, updated[ticketId]);
      return updated;
    });
  }, [saveMessagesToStorage]);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/support/admin/tickets');
      const ticketsData = response.data?.data?.tickets || response.data?.tickets || [];
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);

      const messages = {};
      (Array.isArray(ticketsData) ? ticketsData : []).forEach(ticket => {
        const stored = loadMessagesFromStorage(ticket._id);
        if (stored.length > 0) {
          messages[ticket._id] = stored;
        } else if (ticket.messages) {
          messages[ticket._id] = ticket.messages;
          saveMessagesToStorage(ticket._id, ticket.messages);
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

  useEffect(() => {
    setLoading(true);
    fetchTickets();
  }, [location.pathname]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTickets();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

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
    selectedTicketRef.current = selectedTicket;
    updateTicketMessagesRef.current = updateTicketMessages;
    markMessageAsReadRef.current = markMessageAsRead;
  }, [selectedTicket, updateTicketMessages, markMessageAsRead]);

  useEffect(() => {
    if (!socket) return;
    
    selectedTicketRef.current = selectedTicket;
    updateTicketMessagesRef.current = updateTicketMessages;
    markMessageAsReadRef.current = markMessageAsRead;

    const handleReceiveMessage = (data) => {
      if (updateTicketMessagesRef.current) {
        updateTicketMessagesRef.current(data.ticketId, data.message);
      }

      if (selectedTicketRef.current?._id !== data.ticketId) {
        setUnreadCounts(prev => ({
          ...prev,
          [data.ticketId]: (prev[data.ticketId] || 0) + 1
        }));
      } else {
        if (markMessageAsReadRef.current) {
          markMessageAsReadRef.current(data.ticketId, data.message._id);
        }
      }

      if (selectedTicketRef.current?._id === data.ticketId) {
        scrollToBottom();
      }
    };

    const handleTyping = (data) => {
      if (data.ticketId === selectedTicketRef.current?._id) {
        setTypingUser(data.userId);
      }
    };

    const handleStopTyping = (data) => {
      if (data.ticketId === selectedTicketRef.current?._id) {
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
  }, [socket, scrollToBottom]);

  useEffect(() => {
    if (selectedTicket && ticketMessages[selectedTicket._id]) {
      scrollToBottom();
    }
  }, [ticketMessages, selectedTicket, scrollToBottom]);

  const handleDeleteMessage = useCallback(async (ticketId, messageId) => {
    try {
      await api.delete(`/support/tickets/${ticketId}/messages/${messageId}`);
      setTicketMessages(prev => ({
        ...prev,
        [ticketId]: (prev[ticketId] || []).filter(m => m._id !== messageId)
      }));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  const handleEditMessage = useCallback(async (ticketId, messageId, messageText) => {
    if (!messageText.trim()) return;
    try {
      const response = await api.put(`/support/tickets/${ticketId}/messages/${messageId}`, {
        message: messageText.trim()
      });
      const savedMessage = response.data?.data || response.data;
      if (savedMessage) {
        setTicketMessages(prev => ({
          ...prev,
          [ticketId]: (prev[ticketId] || []).map(m => m._id === messageId ? savedMessage : m)
        }));
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }, []);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedTicket) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await api.post(`/support/tickets/${selectedTicket._id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (uploadResponse.data?.success) {
        const attachment = uploadResponse.data.data;
        if (isConnected && socket) {
          sendMessage({
            ticketId: selectedTicket._id,
            message: '',
            attachments: [attachment]
          });
        } else {
          const response = await api.post(`/support/tickets/${selectedTicket._id}/messages`, {
            message: '',
            attachments: [attachment],
            sender: user._id,
            senderName: user?.firstName || user?.name || 'Admin'
          });
          const savedMessage = response.data?.data || response.data;
          if (savedMessage) updateTicketMessages(selectedTicket._id, savedMessage);
        }
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
    setPendingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        if (selectedTicket) {
          try {
            const formData = new FormData();
            formData.append('file', audioFile);
            const uploadResponse = await api.post(`/support/tickets/${selectedTicket._id}/upload`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (uploadResponse.data?.success) {
              const attachment = uploadResponse.data.data;
              attachment.name = '🎤 Voice Message';
              if (isConnected && socket) {
                sendMessage({
                  ticketId: selectedTicket._id,
                  message: '',
                  attachments: [attachment]
                });
              } else {
                const response = await api.post(`/support/tickets/${selectedTicket._id}/messages`, {
                  message: '',
                  attachments: [attachment],
                  sender: user._id,
                  senderName: user?.firstName || user?.name || 'Admin'
                });
                const savedMessage = response.data?.data || response.data;
                if (savedMessage) updateTicketMessages(selectedTicket._id, savedMessage);
              }
              scrollToBottom();
            }
          } catch (error) {
            console.error('Error uploading audio:', error);
          }
        }
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleOpenChat = useCallback(async (ticket) => {
    setSelectedTicket(ticket);
    setOpenChat(true);
    setUnreadCounts(prev => ({ ...prev, [ticket._id]: 0 }));
    setUserDetails(null);
    setEditingMessageId(null);
    setEditText('');
    setIsRecording(false);
    setPendingImage(null);
    
    setTicketMessages(prev => ({
      ...prev,
      [ticket._id]: prev[ticket._id] || ticket.messages || []
    }));
    
    if (!ticketMessages[ticket._id]) {
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
    }
    
    joinChat(ticket._id);

    if (ticketMessages[ticket._id]) {
      ticketMessages[ticket._id].forEach(msg => {
        if (!msg.read && msg.sender !== user._id) {
          markMessageAsRead(ticket._id, msg._id);
        }
      });
    }
    
    setLoadingUserDetails(true);
    try {
      const detailsResponse = await api.get(`/admin/users/${ticket.user?._id}/details`);
      setUserDetails(detailsResponse.data?.data || null);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoadingUserDetails(false);
    }
    
    setTimeout(scrollToBottom, 100);
  }, [joinChat, markMessageAsRead, scrollToBottom, ticketMessages, user._id]);

  const handleCloseChat = useCallback(() => {
    if (selectedTicket) {
      leaveChat(selectedTicket._id);
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks()?.forEach(t => t.stop());
    }
    setOpenChat(false);
    setSelectedTicket(null);
    setReplyMessage('');
    setTypingUser(null);
    setEditingMessageId(null);
    setEditText('');
    setIsRecording(false);
    setPendingImage(null);
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
      active: { color: 'success', icon: <PlayCircleIcon fontSize="small" />, label: 'Active' },
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
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
                  FINANCIAL OVERVIEW
                </Typography>
                
                {loadingUserDetails ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : userDetails ? (
                  <Box>
                    {userDetails.accounts?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <AccountBalanceWalletIcon fontSize="small" sx={{ color: 'primary.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>BALANCES</Typography>
                        </Box>
                        {userDetails.accounts.slice(0, 3).map((account) => (
                          <Box key={account._id} sx={{ ml: 3, mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {account.accountType?.toUpperCase()} ({account.accountNumber?.slice(-4)})
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${account.balance?.toLocaleString() || '0.00'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {userDetails.transfers?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <SwapHorizIcon fontSize="small" sx={{ color: 'info.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>RECENT TRANSFERS</Typography>
                        </Box>
                        {userDetails.transfers.slice(0, 3).map((transfer) => (
                          <Box key={transfer._id} sx={{ ml: 3, mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {transfer.type} -${transfer.amount?.toLocaleString()}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {new Date(transfer.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {userDetails.cards?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CreditCardIcon fontSize="small" sx={{ color: 'warning.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>CREDIT CARDS</Typography>
                        </Box>
                        {userDetails.cards.slice(0, 3).map((card) => (
                          <Box key={card._id} sx={{ ml: 3, mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {card.cardType?.toUpperCase()} ({card.cardNetwork})
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${card.currentBalance?.toLocaleString() || '0.00'}
                            </Typography>
                            {card.creditLimit && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                Limit: ${card.creditLimit?.toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {userDetails.investments?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <TrendingUpIcon fontSize="small" sx={{ color: 'success.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>INVESTMENTS</Typography>
                        </Box>
                        {userDetails.investments.slice(0, 3).map((inv) => (
                          <Box key={inv._id} sx={{ ml: 3, mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {inv.plan?.name || 'Investment'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${inv.amount?.toLocaleString() || '0.00'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {userDetails.loans?.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <AccountBalanceIcon fontSize="small" sx={{ color: 'error.main' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>LOANS</Typography>
                        </Box>
                        {userDetails.loans.slice(0, 3).map((loan) => (
                          <Box key={loan._id} sx={{ ml: 3, mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {loan.loanProduct?.name || 'Loan'}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              ${loan.amount?.toLocaleString() || '0.00'}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              Status: {loan.status || 'active'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {!userDetails.accounts?.length && !userDetails.transfers?.length && !userDetails.cards?.length && !userDetails.investments?.length && !userDetails.loans?.length && (
                      <Typography variant="caption" color="text.secondary">
                        No financial data available
                      </Typography>
                    )}
                  </Box>
                ) : null}
              </Box>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: '#f7fafc' }}>
                <Box ref={messagesContainerRef} sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                  {(ticketMessages[selectedTicket._id] || []).map((msg, index) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const isOwn = senderId?.toString?.() === user._id?.toString?.();
                    const canEdit = isOwn;
                    
                    const messageTime = getMessageTime(msg.createdAt || msg.timestamp);
                    
                    const getMessageStatus = (message) => {
                      if (!isOwn) return null;
                      
                      const isRead = message.readBy?.some(read => {
                        const readUserId = read.user?._id || read.user;
                        return readUserId?.toString?.() === user._id?.toString?.();
                      });
                      
                      if (isRead) {
                        return <DoneAllIcon fontSize="small" sx={{ fontSize: 14, color: '#4ade80' }} />;
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
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isOwn ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: isOwn ? '#0066ff' : 'white',
                              color: isOwn ? 'white' : 'text.primary',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            }}
                          >
                            {editingMessageId === msg._id ? (
                              <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                <TextField
                                  inputRef={editInputRef}
                                  fullWidth
                                  size="small"
                                  defaultValue={msg.message}
                                  onKeyPress={(e) => e.key === 'Enter' && handleEditMessage(selectedTicket._id, msg._id, editInputRef.current?.value || msg.message)}
                                  sx={{ bgcolor: 'white', borderRadius: 1 }}
                                />
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <Button size="small" onClick={() => {
                                    handleEditMessage(selectedTicket._id, msg._id, editInputRef.current?.value || msg.message);
                                    setEditingMessageId(null);
                                  }}>Save</Button>
                                  <Button size="small" onClick={() => {
                                    setEditingMessageId(null);
                                  }}>Cancel</Button>
                                </Box>
                              </Box>
                            ) : (
                              <>
                                {msg.attachments && msg.attachments.length > 0 && (
                                  <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {msg.attachments.map((attachment, attIndex) => (
                                      <Box key={attIndex}>
                                        {attachment.url && (
                                          <>
                                            {attachment.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                              <Box
                                                component="img"
                                                src={attachment.url}
                                                alt={attachment.name}
                                                sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 1, mt: 1 }}
                                              />
                                            ) : attachment.url.match(/\.(mp3|wav|ogg|webm)$/i) ? (
                                              <Box sx={{ mt: 1 }}>
                                                <audio controls src={attachment.url} style={{ maxWidth: '100%', height: 40 }} />
                                              </Box>
                                            ) : (
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 1, borderRadius: 1 }}>
                                                <Typography variant="caption">{attachment.name}</Typography>
                                              </Box>
                                            )}
                                          </>
                                        )}
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                    {msg.message}
                                    {msg.edited && <Typography component="span" variant="caption" sx={{ opacity: 0.7, ml: 0.5 }}>(edited)</Typography>}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: isOwn ? 'flex-end' : 'flex-start', mt: 0.5 }}>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>{messageTime}</Typography>
                                     {isOwn ? getMessageStatus(msg) : (
                                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        {canEdit && (
                                          <IconButton size="small" sx={{ padding: 0, minWidth: 24, height: 24 }} onClick={() => {
                                            setEditingMessageId(msg._id);
                                            setEditText(msg.message);
                                            setTimeout(() => editInputRef.current?.focus(), 50);
                                          }}>
                                            <EditIcon fontSize="small" sx={{ fontSize: 14, opacity: 0.7 }} />
                                          </IconButton>
                                        )}
                                        {canEdit && (
                                          <IconButton size="small" sx={{ padding: 0, minWidth: 24, height: 24 }} onClick={() => handleDeleteMessage(selectedTicket._id, msg._id)}>
                                            <DeleteIcon fontSize="small" sx={{ fontSize: 14, opacity: 0.7 }} />
                                          </IconButton>
                                        )}
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>

                <Box sx={{ p: 2, bgcolor: 'white', borderTop: 1, borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <IconButton
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ color: 'text.secondary' }}
                    >
                      <ImageIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={isRecording ? stopRecording : startRecording}
                      sx={{ color: isRecording ? 'error.main' : 'text.secondary' }}
                    >
                      {isRecording ? <StopIcon /> : <MicIcon />}
                    </IconButton>
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
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
