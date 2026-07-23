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
  Divider,
  Button,
  Modal
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Minimize as MinimizeIcon,
  Send as SendIcon,
  SupportAgent as SupportAgentIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Edit as EditIcon,
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
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const editInputRef = useRef(null);
  const initializedRef = useRef(false);
  const currentTicketRef = useRef(null);
  const lastFetchRef = useRef(0);
  const ticketsCacheRef = useRef({ data: null, timestamp: 0 });
  const MIN_FETCH_INTERVAL = 3000;

   const mergeMessages = (local, server) => {
     const merged = new Map();
     [...local, ...server].forEach(msg => {
       const id = msg._id || msg.tempId;
       if (!id || String(id).startsWith?.('temp-')) return;
       const existing = merged.get(id);
       if (!existing || new Date(msg.createdAt) > new Date(existing.createdAt)) {
         merged.set(id, msg);
       }
     });
     return Array.from(merged.values()).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
   };

   const saveMessagesToStorage = (ticketId, messages) => {
     try {
       const allMessages = JSON.parse(localStorage.getItem('client_chat_messages') || '{}');
       allMessages[ticketId] = messages.slice(-100);
       localStorage.setItem('client_chat_messages', JSON.stringify(allMessages));
     } catch (e) {
       console.error('Error saving messages to localStorage:', e);
     }
   };

  const loadMessagesFromStorage = (ticketId) => {
    try {
      const allMessages = JSON.parse(localStorage.getItem('client_chat_messages') || '{}');
      return allMessages[ticketId] || [];
    } catch (e) {
      return [];
    }
  };

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
          const storedMessages = loadMessagesFromStorage(activeTicket._id);
          const serverMessages = activeTicket.messages || [];
          const mergedMessages = mergeMessages(storedMessages, serverMessages);
          setMessages(mergedMessages);
          saveMessagesToStorage(activeTicket._id, mergedMessages);
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

  const markMessagesAsReadIfNeeded = useCallback((ticket) => {
    if (!ticket?._id || !(user?.id || user?._id)) return;
    messages.forEach(msg => {
      const isFromAdmin = ['admin', 'super-admin', 'support'].includes(msg.sender?.role);
      const alreadyRead = Array.isArray(msg.readBy) && msg.readBy.some(r => (r.user?._id || r.user)?.toString?.() === user.id.toString?.());
      if (isFromAdmin && !alreadyRead) {
        markMessageAsRead(ticket._id, msg._id);
      }
    });
  }, [messages, user?.id, markMessageAsRead]);

  // Handle opening the chat
  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (currentTicket) {
      markMessagesAsReadIfNeeded(currentTicket);
    }
  };

  const handleSelectTicket = (ticket) => {
    setCurrentTicket(ticket);
    setIsOpen(true);
    setIsMinimized(false);
    setMessages(ticket.messages || []);
    markMessagesAsReadIfNeeded(ticket);
  };
  const handleClose = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks()?.forEach(t => t.stop());
    }
    setIsOpen(false);
    setIsMinimized(false);
    setIsRecording(false);
    setEditingMessageId(null);
    setEditText('');
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
          const newTicketId = newTicket._id;
          setCurrentTicket(newTicket);
          setMessages(newTicket.messages || []);
          
          if (socket && isConnected) {
            joinChat(newTicketId);
          }
          
          currentTicketRef.current = newTicket;
        }
      } catch (error) {
        console.error('Error creating ticket:', error);
        return;
      }
    }

    const ticketId = currentTicket?._id || currentTicketRef.current?._id;
    if (!ticketId) return;

    const localMessage = {
      _id: `temp-${Date.now()}`,
      message: messageText,
      sender: { _id: user?._id || user?.id, name: user?.fullName || 'You' },
      createdAt: new Date().toISOString(),
      delivered: false,
      read: false,
      attachments: attachments.map(att => ({
        name: att.name || 'Attachment',
        url: att.url || att,
        uploadedAt: new Date().toISOString()
      }))
    };

    setMessages(prev => {
      const exists = prev.some(msg => msg._id === localMessage._id);
      if (exists) return prev;
      const updated = [...prev, localMessage];
      saveMessagesToStorage(ticketId, updated);
      return updated;
    });

    if (socket && isConnected) {
      sendMessage({
        ticketId,
        message: messageText || (localMessage.attachments[0]?.name || '📎 Attachment'),
        attachments: localMessage.attachments,
        tempId: localMessage._id
      });
      } else {
        try {
          const response = await api.post(`/support/tickets/${ticketId}/messages`, {
            message: messageText || '📎 Attachment',
            attachments: localMessage.attachments
          });

          const savedMessage = response.data?.data;
          if (savedMessage) {
            setMessages(prev => {
              const tempIndex = prev.findIndex(msg => msg._id === localMessage._id);
              const replacement = { ...savedMessage, _id: savedMessage._id || localMessage._id };
              if (tempIndex !== -1) {
                const updated = [...prev];
                updated[tempIndex] = replacement;
                saveMessagesToStorage(ticketId, updated);
                return updated;
              }
              const updated = [...prev, replacement];
              saveMessagesToStorage(ticketId, updated);
              return updated;
            });
          }
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
  };

  // Handle image upload - convert to base64 and send directly (no server disk dependency)
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const attachment = {
        name: file.name,
        url: dataUrl,
        size: file.size,
        mimetype: file.type,
        uploadedAt: new Date().toISOString()
      };

      handleSendMessage([attachment]);
    } catch (error) {
      console.error('Error reading image:', error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

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
          const reader = new FileReader();
          const audioDataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(audioFile);
          });

          const attachment = {
            name: '🎤 Voice Message',
            url: audioDataUrl,
            size: audioBlob.size,
            mimetype: 'audio/webm',
            uploadedAt: new Date().toISOString()
          };

          handleSendMessage([attachment]);
        } catch (error) {
          console.error('Error processing audio:', error);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const handleStartRecording = async () => {
    if (!currentTicket?._id) return;
    await startRecording();
  };

  const handleSendAttachment = async (file) => {
    if (!file) return;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const attachment = {
        name: file.name,
        url: dataUrl,
        size: file.size,
        mimetype: file.type,
        uploadedAt: new Date().toISOString()
      };

      handleSendMessage([attachment]);
    } catch (error) {
      console.error('Error reading attachment:', error);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleSendAttachment(file);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!currentTicket) return;
    if (messageId.startsWith?.('temp-')) {
      setMessages(prev => {
        const updated = prev.filter(msg => msg._id !== messageId);
        if (currentTicket?._id) saveMessagesToStorage(currentTicket._id, updated);
        return updated;
      });
      return;
    }
    try {
      const viaSocket = !!(socket && isConnected);

      if (viaSocket) {
        setMessages(prev => {
          const updated = prev.filter(msg => msg._id !== messageId);
          if (currentTicket?._id) saveMessagesToStorage(currentTicket._id, updated);
          return updated;
        });
        socket.emit('deleteMessage', {
          ticketId: currentTicket._id,
          messageId
        });
        return;
      }

      await api.delete(`/support/tickets/${currentTicket._id}/messages/${messageId}`);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleEditMessage = async (messageId, messageText) => {
    if (!messageText.trim() || !currentTicket) return;
    try {
      if (messageId.startsWith?.('temp-')) {
        setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, message: messageText.trim(), edited: true, editedAt: new Date() } : msg));
        setEditingMessageId(null);
        setEditText('');
        return;
      }

      const viaSocket = !!(socket && isConnected);

      if (viaSocket) {
        socket.emit('updateMessage', {
          ticketId: currentTicket._id,
          messageId,
          message: messageText.trim()
        });
        setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, message: messageText.trim(), edited: true, editedAt: new Date() } : msg));
        setEditingMessageId(null);
        setEditText('');
        return;
      }

      await api.put(`/support/tickets/${currentTicket._id}/messages/${messageId}`, {
        message: messageText.trim()
      });
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, message: messageText.trim(), edited: true, editedAt: new Date() } : msg));
      setEditingMessageId(null);
      setEditText('');
    } catch (error) {
      console.error('Error editing message:', error);
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
    const markMessageAsReadRef = markMessageAsRead;

    const handleReceiveMessage = (data) => {
      const { message, tempId } = data;
      if (!message) return;

      const ticketId = currentTicketRef.current?._id;
      
      setMessages(prev => {
        // Check if this message replaces a temporary message (sent by this user)
        if (tempId) {
          const tempIndex = prev.findIndex(msg => msg._id === tempId);
          if (tempIndex !== -1) {
            // Replace the temporary message with the server-confirmed message
            const updated = [...prev];
            updated[tempIndex] = { ...message, _id: message._id || tempId };
            if (ticketId) saveMessagesToStorage(ticketId, updated);
            return updated;
          }
        }
        
        // Check if message already exists by _id
        if (prev.some(msg => msg._id === message._id)) return prev;
        
        // Check for duplicate by message content and sender (prevent duplicates from socket + API)
        const isDuplicate = prev.some(msg => 
          msg.message === message.message && 
          (msg.sender?._id || msg.sender) === (message.sender?._id || message.sender) &&
          Math.abs(new Date(msg.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000
        );
        if (isDuplicate) return prev;
        
        const updated = [...prev, message];
        if (ticketId) saveMessagesToStorage(ticketId, updated);
        return updated;
      });

      if (!isOpen || document.hidden) {
        setUnreadCount(prev => prev + 1);
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
      setMessages(prev => prev.map(msg => msg._id === data.messageId ? { ...msg, delivered: true, deliveredAt: data.deliveredAt } : msg));
    };

    const handleMessageRead = (data) => {
      if (!data?.messageId) return;
      setMessages(prev => prev.map(msg => msg._id === data.messageId ? { ...msg, read: true, readAt: data.readBy?.readAt } : msg));
    };

    const handleMessageDeleted = (data) => {
      if (!data?.ticketId || !data?.messageId) return;
      if (data.ticketId !== currentTicketRef.current?._id) return;
      setMessages(prev => {
        const updated = prev.filter(msg => msg._id !== data.messageId);
        saveMessagesToStorage(data.ticketId, updated);
        return updated;
      });
    };

    const handleMessageUpdated = (data) => {
      if (!data?.ticketId || !data?.messageId) return;
      if (data.ticketId !== currentTicketRef.current?._id) return;
      setMessages(prev => prev.map(msg => msg._id === data.messageId ? {
        ...msg,
        message: data.message,
        edited: data.edited,
        editedAt: data.editedAt
      } : msg));
    };

    const handleTicketDeleted = (data) => {
      const deletedTicketId = data?.ticketId;
      if (!deletedTicketId) return;
      
      if (currentTicketRef.current?._id === deletedTicketId) {
        setCurrentTicket(null);
        setMessages([]);
        setUnreadCount(0);
        setNewMessage('');
        setIsMinimized(false);
        if (socket && isConnected) {
          leaveChat(deletedTicketId);
        }
      }
      
      localStorage.removeItem(`client_chat_messages`);
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageRead', handleMessageRead);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('messageUpdated', handleMessageUpdated);
    socket.on('ticketDeleted', handleTicketDeleted);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageRead', handleMessageRead);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('messageUpdated', handleMessageUpdated);
      socket.off('ticketDeleted', handleTicketDeleted);
    };
  }, [socket, isOpen, markMessageAsRead, currentTicket]);

  const getMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get header title and status
  const headerTitle = 'northcrestbankofusa';
  const headerSubtitle = 'hi how can we help you?';
  const headerStatus = isConnected ? 'Online' : 'Connecting...';
  const emptyStateTitle = 'hi how can we help you?';
  const emptyStateSubtitle = 'Send us a message and we\'ll respond shortly.';

  // Check if message is from current user
  const isOwnMessage = (message) => {
    const senderId = message.sender?._id || message.sender;
    const currentUserId = user?.id || user?._id;
    return senderId?.toString?.() === currentUserId?.toString?.();
  };

  // Get message status icon and label
  const getMessageStatus = (message) => {
    if (!isOwnMessage(message)) return null;
    
    const isRead = message.readBy?.some(read => {
      const readUserId = read.user?._id || read.user;
      return readUserId?.toString?.() === (user?._id || user?.id)?.toString?.();
    }) || message.read;
    
    if (isRead) {
      return <Typography variant="caption" sx={{ fontSize: 11, color: '#4ade80', fontWeight: 500 }}>Seen</Typography>;
    }
    if (message.delivered) {
      return <DoneAllIcon fontSize="small" sx={{ fontSize: 16, opacity: 0.7 }} />;
    }
    return <CheckIcon fontSize="small" sx={{ fontSize: 16, opacity: 0.7 }} />;
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
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Typography
            variant="body2"
            sx={{
              bgcolor: 'rgba(255,255,255,0.95)',
              color: '#0066ff',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.8rem' },
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              display: 'block'
            }}
          >
            Chat with NorthCrest Support
          </Typography>
          <Box
            sx={{
              position: 'relative',
              display: 'inline-flex'
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
                                                                        
                                    {(() => {
                                      const url = attachment.url;
                                      const lower = url.toLowerCase();
                                      if (lower.startsWith('data:image/') || lower.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                                        return (
                                          <Box component="img" src={url} alt={attachment.name}
                                            sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 1, mt: 1, cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
                                            onClick={() => setSelectedImage(url)} />
                                        );
                                      }
                                      if (lower.startsWith('data:audio/') || lower.match(/\.(mp3|wav|ogg|webm)$/i)) {
                                        return (
                                          <Box sx={{ mt: 1 }}>
                                            <audio controls src={url} style={{ maxWidth: '100%', height: 40 }} />
                                          </Box>
                                        );
                                      }
                                      if (lower.startsWith('data:') || lower.startsWith('blob:')) {
                                        const mime = lower.match(/^data:([^;]+)/)?.[1] || lower.match(/^blob:([^;]+)/)?.[1];
                                        const ext = (mime || '').split('/').pop();
                                        if (mime?.startsWith('image/')) {
                                          return (
                                            <Box component="img" src={url} alt={attachment.name}
                                              sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 1, mt: 1, cursor: 'pointer', transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}
                                              onClick={() => setSelectedImage(url)} />
                                          );
                                        }
                                        if (mime?.startsWith('audio/')) {
                                          return (
                                            <Box sx={{ mt: 1 }}>
                                              <audio controls src={url} style={{ maxWidth: '100%', height: 40 }} />
                                            </Box>
                                          );
                                        }
                                        if (mime?.startsWith('video/')) {
                                          return (
                                            <Box sx={{ mt: 1 }}>
                                              <video controls src={url} style={{ maxWidth: '100%', height: 200, borderRadius: 1 }} />
                                            </Box>
                                          );
                                        }
                                        return (
                                          <Box sx={{ mt: 1 }}>
                                            <a href={url} download={attachment.name} style={{ color: 'inherit' }}>📎 {attachment.name || 'Download file'}</a>
                                          </Box>
                                        );
                                      }
                                      return (
                                        <Box sx={{ mt: 1 }}>
                                          <a href={url} target="_blank" rel="noopener noreferrer">📎 {attachment.name || 'Open file'}</a>
                                        </Box>
                                      );
                                    })()}
                                  </>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                        {editingMessageId === message._id ? (
                          <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                            <TextField
                              inputRef={editInputRef}
                              fullWidth
                              size="small"
                              defaultValue={message.message}
                              onKeyPress={(e) => e.key === 'Enter' && handleEditMessage(message._id, editInputRef.current?.value || message.message)}
                              onChange={(e) => setEditText(e.target.value)}
                              sx={{ bgcolor: 'white', borderRadius: 1 }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button size="small" onClick={() => {
                                handleEditMessage(message._id, editInputRef.current?.value || message.message);
                                setEditingMessageId(null);
                                setEditText('');
                              }}>Save</Button>
                              <Button size="small" onClick={() => {
                                setEditingMessageId(null);
                                setEditText('');
                              }}>Cancel</Button>
                            </Box>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {message.message}
                              {message.edited && <Typography component="span" variant="caption" sx={{ opacity: 0.7, ml: 0.5 }}>(edited)</Typography>}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: isOwnMessage(message) ? 'flex-end' : 'flex-start', mt: 0.5 }}>
                              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                {getMessageTime(message.createdAt || message.timestamp)}
                              </Typography>
                              {isOwnMessage(message) && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <IconButton size="small" sx={{ padding: 0, minWidth: 24, height: 24 }} onClick={() => {
                                    setEditingMessageId(message._id);
                                    setEditText(message.message);
                                    setTimeout(() => editInputRef.current?.focus(), 50);
                                  }}>
                                    <EditIcon fontSize="small" sx={{ fontSize: 14, opacity: 0.7 }} />
                                  </IconButton>
                                  <IconButton size="small" sx={{ padding: 0, minWidth: 24, height: 24 }} onClick={() => handleDeleteMessage(message._id)}>
                                    <DeleteIcon fontSize="small" sx={{ fontSize: 14, opacity: 0.7 }} />
                                  </IconButton>
                                </Box>
                              )}
                              {!isOwnMessage(message) && getMessageStatus(message)}
                            </Box>
                          </Box>
                        )}
                      </Paper>
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

      {/* Image preview modal */}
      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
      >
        <Box sx={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', outline: 'none' }}>
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{ position: 'absolute', top: -40, right: 0, color: 'white', zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={selectedImage || ''}
            alt="Full size preview"
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
            }}
          />
        </Box>
      </Modal>

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