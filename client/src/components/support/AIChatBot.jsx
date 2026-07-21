import React, { useState, useRef, useEffect } from 'react';
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
  SmartToy as AIIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  InsertDriveFile as FileIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const AIChatBot = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm NorthCrest Bank's AI assistant. How can I help you today?",
      sender: 'ai',
      timestamp: new Date().toISOString()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const getAIResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return "Hello! Welcome to NorthCrest Bank. I'm here to help you with any questions about our services. What would you like to know?";
    }
    if (message.includes('account') || message.includes('savings') || message.includes('checking')) {
      return "We offer various account types including Savings, Checking, and Premium accounts. Would you like to know more about our account features or interest rates?";
    }
    if (message.includes('loan') || message.includes('mortgage') || message.includes('borrow')) {
      return "We provide personal loans, home loans, and business loans with competitive interest rates. Would you like to check your eligibility or learn about our loan options?";
    }
    if (message.includes('card') || message.includes('credit card') || message.includes('debit')) {
      return "Our credit cards offer cashback rewards, travel benefits, and secure transactions. Would you like to apply for a card or check your existing card details?";
    }
    if (message.includes('transfer') || message.includes('send money') || message.includes('wire')) {
      return "We support local and international transfers with competitive exchange rates. Transfers are typically processed within 1-3 business days.";
    }
    if (message.includes('investment') || message.includes('invest') || message.includes('stocks')) {
      return "We offer investment plans in stocks, real estate, and cryptocurrency. Our investment advisors can help you build a diversified portfolio.";
    }
    if (message.includes('kyc') || message.includes('verify') || message.includes('verification')) {
      return "KYC verification is required for account security. You can complete your KYC in the KYC section of your dashboard. The process typically takes 24-48 hours.";
    }
    if (message.includes('password') || message.includes('login') || message.includes('forgot')) {
      return "For security reasons, please use the 'Forgot Password' option on the login page. If you need further assistance, I can connect you to our support team.";
    }
    if (message.includes('fee') || message.includes('charges') || message.includes('cost')) {
      return "Our fee structure varies by account type and service. Generally, we offer low-fee accounts. Would you like me to provide specific fee details for a particular service?";
    }
    if (message.includes('hours') || message.includes('open') || message.includes('close') || message.includes('time')) {
      return "Our customer support is available 24/7. Branch hours vary by location, but our online services are always available through the app and website.";
    }
    if (message.includes('contact') || message.includes('phone') || message.includes('email') || message.includes('support')) {
      return "You can reach our support team at 1-800-NORTHCREST or support@northcrestbank.com. For immediate assistance, I can connect you to a live agent.";
    }
    if (message.includes('thank') || message.includes('thanks')) {
      return "You're welcome! Is there anything else I can help you with today?";
    }
    if (message.includes('bye') || message.includes('goodbye')) {
      return "Thank you for contacting NorthCrest Bank! Have a great day!";
    }
    
    return "Thank you for your question. I'd be happy to help you with that. Could you please provide more details so I can assist you better? Or I can connect you to our human support team for more complex inquiries.";
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(newMessage),
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageMessage = {
        id: Date.now().toString(),
        text: `📷 Image: ${file.name}`,
        sender: 'user',
        timestamp: new Date().toISOString(),
        imageUrl: URL.createObjectURL(file)
      };
      setMessages(prev => [...prev, imageMessage]);
      
      setTimeout(() => {
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          text: "Thank you for sharing the image. I can see you've uploaded an image. How can I help you with this?",
          sender: 'ai',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
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

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audioMessage = {
          id: Date.now().toString(),
          text: '🎤 Voice message',
          sender: 'user',
          timestamp: new Date().toISOString(),
          audioUrl
        };
        setMessages(prev => [...prev, audioMessage]);
        
        setTimeout(() => {
          const aiResponse = {
            id: (Date.now() + 1).toString(),
            text: "Thank you for the voice message. I've received it. How can I assist you further?",
            sender: 'ai',
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, aiResponse]);
        }, 1000);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
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
              <AIIcon fontSize="large" />
            </Fab>
          </Badge>
        </Box>
      )}

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
                 <AIIcon />
               </Avatar>
               <Box>
                 <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: '0.02em' }}>
                   northcrestbankofusa
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
                   Online
                 </Typography>
                 <Typography variant="caption" sx={{ opacity: 0.75, display: 'block', lineHeight: 1.2 }}>
                   hi how can we help you?
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

          {!isMinimized && (
            <>
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
                {messages.map((message) => (
                  <Box
                    key={message.id}
                    sx={{
                      alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%'
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: message.sender === 'user'
                          ? 'primary.main'
                          : theme.palette.background.paper,
                        color: message.sender === 'user' ? 'white' : 'text.primary',
                        borderBottomRightRadius: message.sender === 'user' ? 4 : 2,
                        borderBottomLeftRadius: message.sender === 'user' ? 2 : 4
                      }}
                    >
                      {message.imageUrl && (
                        <Box
                          component="img"
                          src={message.imageUrl}
                          alt="Uploaded"
                          sx={{
                            maxWidth: '100%',
                            maxHeight: 200,
                            borderRadius: 1,
                            mb: 1
                          }}
                        />
                      )}
                      {message.audioUrl && (
                        <Box sx={{ mb: 1 }}>
                          <audio controls src={message.audioUrl} style={{ maxWidth: '100%' }} />
                        </Box>
                      )}
                      <Typography variant="body2">{message.text}</Typography>
                    </Paper>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                        gap: 0.5,
                        mt: 0.5,
                        px: 0.5
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {isTyping && (
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
                    onChange={(e) => setNewMessage(e.target.value)}
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
                    onClick={isTyping ? stopRecording : startRecording}
                    sx={{ color: isTyping ? 'error.main' : 'text.secondary' }}
                  >
                    {isTyping ? <StopIcon /> : <MicIcon />}
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
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
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </Box>
            </>
          )}
        </Paper>
      )}

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default AIChatBot;
