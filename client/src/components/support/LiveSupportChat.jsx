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
  useMediaQuery,
  Chip,
  Divider
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Send as SendIcon,
  SupportAgent as SupportAgentIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  InsertDriveFile as FileIcon
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
  const [isRecording, setIsRecording] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const initializedRef = useRef(false);
  const currentTicketRef = useRef(null);
  const lastFetchRef = useRef(0);
  const ticketsCacheRef = useRef({ data: null, timestamp: 0 });
  const MIN_FETCH_INTERVAL = 3000;

  // Keep ref in sync with state
  useEffect(() => {
    currentTicketRef.current = currentTicket;
  }, [currentTicket]);

  // Initialize chat once when opened
  useEffect(() => {
    if (!isOpen) return;
    if (initializedRef.current) return;
    if (!user || !token) return;

    initializedRef.current = true;
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      try {
        const ticketsResponse = await api.get('/support/tickets?status=open,in-progress,awaiting-user');
        const tickets = ticketsResponse.data?.data?.tickets || ticketsResponse.data?.tickets || [];
        let activeTicket = tickets[0];

        if (!activeTicket) {
          const createResponse = await api.post('/support/tickets', {
            subject: 'Live Chat Inquiry',
            description: 'Customer started a live chat session',
            category: 'technical',
            priority: 'medium'
          });
          activeTicket = createResponse.data?.data || createResponse.data;
        }

        if (!cancelled && activeTicket) {
          setCurrentTicket(activeTicket);
          setMessages(activeTicket.messages || []);
          setUnreadCount(0);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error initializing chat:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [isOpen, user, token]);

  // Join chat room when socket connects and we have a ticket
  useEffect(() => {
    if (!socket || !isConnected || !currentTicket) return;
    joinChat(currentTicket._id);
  }, [socket, isConnected, currentTicket, joinChat]);

  // Reset initialization flag when chat closes
  useEffect(() => {
    if (!isOpen) {
      initializedRef.current = false;
    }
  }, [isOpen]);

  // Initialize or get existing chat
  const initializeChat = async () => {
    if (!user || !token) return;
    
    const now = Date.now();
    if (now - lastFetchRef.current < MIN_FETCH_INTERVAL && ticketsCacheRef.current.data) {
      const cached = ticketsCacheRef.current.data;
      let activeTicket = cached[0];
      
      if (!activeTicket && cached.length === 0) {
        return;
      }
      
      if (activeTicket) {
        const ticketIdChanged = currentTicket?._id !== activeTicket._id;
        const messagesChanged = JSON.stringify(activeTicket.messages || []) !== JSON.stringify(currentTicket?.messages || []);
        
        if (ticketIdChanged || messagesChanged) {
          setCurrentTicket(activeTicket);
          setMessages(activeTicket.messages || []);
        }
        
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
      return;
    }
    
    setLoading(true);
    try {
      const ticketsResponse = await api.get('/support/tickets?status=open,in-progress,awaiting-user');
      
      const tickets = ticketsResponse.data?.data?.tickets || ticketsResponse.data?.tickets || [];
      ticketsCacheRef.current = { data: tickets, timestamp: now };
      lastFetchRef.current = now;
      let activeTicket = tickets[0];
      
      if (!activeTicket) {
        const createResponse = await api.post('/support/tickets', {
          subject: 'Live Chat Inquiry',
          description: 'Customer started a live chat session',
          category: 'technical',
          priority: 'medium'
        });
        
        activeTicket = createResponse.data?.data || createResponse.data;
      }

      if (activeTicket) {
        const ticketIdChanged = currentTicket?._id !== activeTicket._id;
        const messagesChanged = JSON.stringify(activeTicket.messages || []) !== JSON.stringify(currentTicket?.messages || []);
        
        if (ticketIdChanged || messagesChanged) {
          setCurrentTicket(activeTicket);
          setMessages(activeTicket.messages || []);
        }
        
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
  };

  // Handle closing the chat
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    if (currentTicket && socket) {
      leaveChat(currentTicket._id);
    }
    setCurrentTicket(null);
    setMessages([]);
    setUnreadCount(0);
    setNewMessage('');
  };

  // Handle toggle minimize
  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Send message handler
  const handleSendMessage = async (attachments = []) => {
    if (!newMessage.trim() && attachments.length === 0) return;

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
      read: false,
      attachments: attachments.map(att => ({
        name: att.name || 'Attachment',
        url: att.url || att,
        uploadedAt: new Date().toISOString()
      }))
    };

    setMessages(prev => [...prev, localMessage]);

    if (socket && isConnected) {
      sendMessage({
        ticketId,
        message: messageText,
        attachments: localMessage.attachments
      });
    } else {
      try {
        const response = await api.post(`/support/tickets/${ticketId}/messages`, {
          message: messageText,
          attachments: localMessage.attachments
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

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await api.post('/support/tickets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (uploadResponse.data?.success) {
        const attachment = uploadResponse.data.data;
        handleSendMessage([attachment]);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });

        try {
          const formData = new FormData();
          formData.append('file', audioFile);

          const uploadResponse = await api.post('/support/tickets/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          if (uploadResponse.data?.success) {
            const attachment = uploadResponse.data.data;
            attachment.name = '🎤 Voice Message';
            handleSendMessage([attachment]);
          }
        } catch (error) {
          console.error('Error uploading audio:', error);
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
      
      if (['admin', 'super-admin', 'support'].includes(message.sender?.role) && currentTicketRef.current) {
        markMessageAsRead(currentTicketRef.current._id, message._id);
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
  }, [socket, isOpen, markMessageAsRead]);

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get header title and status
  const headerTitle = 'northcrestbankofusa';
  const headerSubtitle = 'hi how can we help you?';
  const headerStatus = isConnected ? 'Online' : 'Connecting...';
  const emptyStateTitle = 'hi how can we help you?';
  const emptyStateSubtitle = 'Send us a message and we\'ll respond shortly.';

  // Check if message is from current user
  const isOwnMessage = (message) => {
    return message.sender?._id === user?.id;
  };

  // Get message status icon
  const getMessageStatus = (message) => {
    const isRead = message.readBy?.some(read => {
      const readUserId = read.user?._id || read.user;
      return readUserId === user?.id;
    });
    if (isRead) {
      return <DoneAllIcon fontSize="small" color="primary" />;
    }
    if (message.delivered) {
      return <CheckIcon fontSize="small" color="action" />;
    }
    return null;
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
                  <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', lineHeight: 1.2 }}>
                    {headerSubtitle}
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
                        {message.attachments && message.attachments.length > 0 && (
                          <Box sx={{ mb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {message.attachments.map((attachment, attIndex) => (
                              <Box key={attIndex}>
                                {attachment.url && (
                                  <>
                                    {attachment.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                      <Box
                                        component="img"
                                        src={attachment.url}
                                        alt={attachment.name}
                                        sx={{
                                          maxWidth: '100%',
                                          maxHeight: 200,
                                          borderRadius: 1,
                                          mt: 1
                                        }}
                                      />
                                    ) : attachment.url.match(/\.(mp3|wav|ogg|webm)$/i) ? (
                                      <Box sx={{ mt: 1 }}>
                                        <audio controls src={attachment.url} style={{ maxWidth: '100%', height: 40 }} />
                                      </Box>
                                    ) : (
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                          mt: 1,
                                          p: 1,
                                          borderRadius: 1,
                                          bgcolor: 'rgba(255,255,255,0.1)'
                                        }}
                                      >
                                        <FileIcon fontSize="small" />
                                        <Typography variant="caption">{attachment.name}</Typography>
                                      </Box>
                                    )}
                                  </>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
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
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
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
                  <IconButton
                    color="primary"
                    onClick={() => handleSendMessage()}
                    disabled={!newMessage.trim() && !isRecording}
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
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
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