import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Fab,
  Paper,
  Typography,
  IconButton,
  TextField,
  Avatar,
  Badge,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Send as SendIcon,
  SupportAgent as SupportAgentIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useSocket } from '../../contexts/SocketContext';
import api from '../../services/api';

const LiveSupportChat = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, token } = useSelector(state => state.auth);
  const { 
    socket, 
    isConnected, 
    supportOnline,
    joinChat,
    leaveChat,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markMessageAsRead
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentTicket, setCurrentTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, agentTyping, scrollToBottom]);

  // Initialize or get existing chat
  const initializeChat = async () => {
    if (!user || !token) return;
    
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const ticketsResponse = await api.get('/support/tickets?status=open,in-progress,awaiting-user');
      
      const tickets = ticketsResponse.data?.data?.tickets || ticketsResponse.data?.tickets || [];
      let activeTicket = tickets[0];
      
      if (!activeTicket) {
        const createResponse = await axios.post('/api/v1/support/tickets', {
          subject: 'Live Chat Inquiry',
          description: 'Customer started a live chat session',
          category: 'technical',
          priority: 'medium'
        }, { headers });
        
        activeTicket = createResponse.data?.data || createResponse.data;
      }

      if (activeTicket) {
        setCurrentTicket(activeTicket);
        setMessages(activeTicket.messages || []);
        
        if (socket && isConnected) {
          joinChat(activeTicket._id);
        }
  
        if (activeTicket.messages && activeTicket.messages.length > 0) {
          activeTicket.messages.forEach(msg => {
            if (!msg.readBy || !Array.isArray(msg.readBy)) return;
            if (!msg.readBy.some(read => read.user?.toString?.() === user.id)) {
              markMessageAsRead(activeTicket._id, msg._id);
            }
          });
        }
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the chat
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (!currentTicket) {
      initializeChat();
    }
  };

  // Handle closing the chat
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    if (currentTicket && socket) {
      leaveChat(currentTicket._id);
    }
  };

  // Handle toggle minimize
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Send message handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    if (!currentTicket) {
      try {
        const createResponse = await api.post('/support/tickets', {
          subject: 'Live Chat Inquiry',
          description: 'Customer started a live chat session',
          category: 'technical',
          priority: 'medium'
        });
        
        const newTicket = createResponse.data?.data || createResponse.data;
        if (newTicket && newTicket._id) {
          setCurrentTicket(newTicket);
          setMessages(newTicket.messages || []);
          
          if (socket && isConnected) {
            joinChat(newTicket._id);
          }
        }
      } catch (error) {
        console.error('Error creating ticket:', error);
        return;
      }
    }

    const ticketId = currentTicket?._id;
    if (!ticketId) return;

    const localMessage = {
      _id: `temp-${Date.now()}`,
      message: messageText,
      sender: { _id: user?.id, name: user?.fullName || 'You' },
      createdAt: new Date().toISOString(),
      delivered: false,
      read: false
    };

    setMessages(prev => [...prev, localMessage]);

    if (socket && isConnected) {
      sendMessage({
        ticketId,
        message: messageText
      });
    } else {
      try {
        const response = await api.post(`/support/tickets/${ticketId}/messages`, {
          message: messageText
        });
        
        const savedMessage = response.data?.data;
        if (savedMessage) {
          setMessages(prev => [...prev, { ...savedMessage, _id: savedMessage._id || `temp-${Date.now()}` }]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  // Handle input change with typing indicator
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    
    // Emit typing event
    if (currentTicket && socket) {
      emitTyping(currentTicket._id);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Emit stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(currentTicket._id);
      }, 2000);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleReceiveMessage = (data) => {
      const { message } = data;
      if (!message) return;
      
      setMessages(prev => {
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
      
      if (!isOpen || document.hidden) {
        setUnreadCount(prev => prev + 1);
      }
      
      if (['admin', 'super-admin', 'support'].includes(message.sender?.role) && currentTicket) {
        markMessageAsRead(currentTicket._id, message._id);
      }
    };

    const handleTyping = (data) => {
      if (data?.isAgent) {
        setAgentTyping(true);
      }
    };

    const handleStopTyping = () => {
      setAgentTyping(false);
    };

    const handleMessageDelivered = (data) => {
      if (!data?.messageId) return;
      setMessages(prev => prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, delivered: true, deliveredAt: data.deliveredAt }
          : msg
      ));
    };

    const handleMessageRead = (data) => {
      if (!data?.messageId) return;
      setMessages(prev => prev.map(msg =>
        msg._id === data.messageId
          ? { ...msg, read: true, readAt: data.readBy?.readAt }
          : msg
      ));
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageRead', handleMessageRead);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageRead', handleMessageRead);
    };
  }, [socket, isOpen, currentTicket, markMessageAsRead]);

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get header title and status
  const headerTitle = 'northcrestbankofusa';
  const headerStatus = 'Online';
  const emptyStateTitle = 'hi how can we help you?';
  const emptyStateSubtitle = 'Send us a message and we\'ll respond shortly.';

  // Check if message is from current user
  const isOwnMessage = (message) => {
    return message.sender?._id === user?.id;
  };

  // Get message status icon
  const getMessageStatus = (message) => {
    if (message.readBy?.some(read => read.user !== user?.id)) {
      return <DoneAllIcon fontSize="small" color="primary" />;
    }
    if (message.delivered) {
      return <CheckIcon fontSize="small" />;
    }
    return <CheckIcon fontSize="small" color="disabled" />;
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000
          }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{ '& .MuiBadge-badge': { fontSize: 12, fontWeight: 'bold' } }}
          >
            <Fab
              color="primary"
              onClick={handleOpen}
              sx={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)',
                boxShadow: '0 8px 25px rgba(0,102,255,0.4)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 35px rgba(0,102,255,0.5)'
                }
              }}
            >
              <ChatIcon fontSize="large" />
            </Fab>
          </Badge>
          {/* Online/Offline indicator */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#4caf50',
              border: '3px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          />
        </Box>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: isMobile ? 'calc(100vw - 48px)' : 380,
            height: isMinimized ? 80 : 580,
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: 3,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(30,30,30,0.95)' 
              : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          {/* Chat Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)',
              color: 'white',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                <SupportAgentIcon />
              </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.02em' }}>
                    {headerTitle}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.5, textTransform: 'capitalize' }}>
                    <Box 
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#4ade80'
                      }}
                    />
                    {headerStatus}
                  </Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton 
                size="small" 
                onClick={handleToggleMinimize}
                sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <MinimizeIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={handleClose}
                sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Chat Body (only show if not minimized) */}
          {!isMinimized && (
            <>
              {/* Messages Container */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  bgcolor: theme.palette.mode === 'dark' 
                    ? 'rgba(0,0,0,0.1)' 
                    : 'rgba(0,0,0,0.02)'
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress size={32} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <SupportAgentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {emptyStateTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {emptyStateSubtitle}
                    </Typography>
                  </Box>
                ) : (
                  messages.map((message, index) => (
                    <Box
                      key={message._id || index}
                      sx={{
                        alignSelf: isOwnMessage(message) ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                      }}
                    >
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: isOwnMessage(message) 
                            ? 'primary.main' 
                            : theme.palette.background.paper,
                          color: isOwnMessage(message) ? 'white' : 'text.primary',
                          borderBottomRightRadius: isOwnMessage(message) ? 4 : 2,
                          borderBottomLeftRadius: isOwnMessage(message) ? 2 : 4
                        }}
                      >
                        <Typography variant="body2">{message.message}</Typography>
                      </Paper>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isOwnMessage(message) ? 'flex-end' : 'flex-start',
                          gap: 0.5,
                          mt: 0.5,
                          px: 0.5
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(message.createdAt)}
                        </Typography>
                        {isOwnMessage(message) && getMessageStatus(message)}
                      </Box>
                    </Box>
                  ))
                )}

                {/* Agent typing indicator */}
                {agentTyping && (
                  <Box sx={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Paper elevation={1} sx={{ p: 1.5, borderRadius: 2, bgcolor: theme.palette.background.paper }}>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Box 
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'text.secondary',
                            animation: 'pulse 1.4s infinite ease-in-out'
                          }}
                        />
                        <Box 
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'text.secondary',
                            animation: 'pulse 1.4s infinite ease-in-out',
                            animationDelay: '0.2s'
                          }}
                        />
                        <Box 
                          component="span"
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'text.secondary',
                            animation: 'pulse 1.4s infinite ease-in-out',
                            animationDelay: '0.4s'
                          }}
                        />
                      </Box>
                    </Paper>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box
                sx={{
                  p: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  bgcolor: theme.palette.background.paper
                }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={handleMessageChange}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || loading}
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      },
                      '&:disabled': {
                        bgcolor: 'action.disabledBackground',
                        color: 'action.disabled'
                      }
                    }}
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </Paper>
      )}

      {/* Add pulse animation for typing indicator */}
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LiveSupportChat;