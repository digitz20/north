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

  const getAIResponse = (userMessage, messageHistory = []) => {
    const message = userMessage.toLowerCase().trim();
    
    const hasContext = (keywords) => 
      keywords.some(kw => message.includes(kw));
    
    const getRecentContext = () => {
      return messageHistory.slice(-3).map(m => m.text?.toLowerCase() || '').join(' ');
    };
    
    const context = getRecentContext();
    const isFollowUp = context.includes('would you like') || context.includes('can i help') || context.includes('anything else');
    
    if (hasContext(['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'])) {
      const responses = [
        "Hello! Welcome to NorthCrest Bank. I'm your AI assistant. How can I help you today?",
        "Hi there! I'm the NorthCrest Bank AI assistant. What can I do for you?",
        "Good day! I'm here to help with any banking questions. What would you like to know?"
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    if (hasContext(['account', 'savings', 'checking', 'balance', 'open account'])) {
      if (hasContext(['interest', 'rate', 'apy'])) {
        return "Our savings accounts offer APY rates from 2.5% to 4.5% depending on the tier. Checking accounts earn 0.5% APY. Premium accounts can earn up to 5.2% APY. Would you like to open an account or check your current rates?";
      }
      if (hasContext(['open', 'create', 'new'])) {
        return "Opening an account is quick and easy! You can open a Savings, Checking, or Premium account in under 5 minutes through our mobile app or website. You'll need your ID, SSN, and initial deposit. Would you like me to guide you through the process?";
      }
      if (hasContext(['require', 'need', 'document'])) {
        return "To open an account, you'll need: 1) Valid government-issued photo ID (driver's license or passport), 2) Social Security Number, 3) Initial deposit (as low as $1 for savings), 4) Proof of address (utility bill or bank statement). All documents can be uploaded securely through our app.";
      }
      return "We offer several account types:\n• **Savings Account** - 2.5-4.5% APY, no monthly fees\n• **Checking Account** - 0.5% APY, unlimited transactions\n• **Premium Account** - 5.2% APY, exclusive benefits\n• **Business Account** - Tailored for businesses\nWhich would you like to learn more about?";
    }
    
    if (hasContext(['loan', 'mortgage', 'borrow', 'lend', 'credit'])) {
      if (hasContext(['mortgage', 'home', 'house'])) {
        return "Our mortgage options include:\n• **Fixed Rate** - 6.5-7.5% APR (15-30 years)\n• **Adjustable Rate** - 6.0-7.0% APR (5/1 ARM)\n• **FHA** - 6.25-7.25% APR\n• **VA** - Competitive rates for veterans\nYou can apply online in 10 minutes with our express application. Would you like to check your eligibility?";
      }
      if (hasContext(['personal', 'debt', 'consolidat'])) {
        return "Personal loans range from $1,000 to $100,000 with rates from 6.99% to 25% APR. Terms from 12 to 84 months. Perfect for debt consolidation, home improvements, or major purchases. You can get a pre-qualification decision in under 60 seconds with no impact on your credit score.";
      }
      if (hasContext(['eligib', 'qualify', 'approval'])) {
        return "To check your loan eligibility, we consider: credit score (600+ minimum), income (stable employment), debt-to-income ratio (under 43%), and employment history (2+ years). You can get a free pre-qualification check that won't affect your credit score. Would you like to proceed?";
      }
      return "We offer various loan options:\n• **Personal Loans** - $1K-$100K, 6.99-25% APR\n• **Mortgages** - Up to $2M, 6.25-7.5% APR\n• **Auto Loans** - Up to $100K, 4.99-12% APR\n• **Student Loans** - Refinancing options\n• **Business Loans** - Up to $500K\nWhich type of loan are you interested in?";
    }
    
    if (hasContext(['card', 'credit card', 'debit', 'apply card', 'lost', 'stolen'])) {
      if (hasContext(['apply', 'get', 'new', 'order'])) {
        return "Our cards offer great benefits:\n• **Cashback Card** - 3% cashback on dining, 2% on groceries\n• **Travel Card** - 5x miles on travel, no foreign fees\n• **Premium Card** - 0.5% cashback on all purchases, $0 annual fee\n• **Student Card** - Designed for students building credit\nApply in 3 minutes with instant decision. Would you like to apply?";
      }
      if (hasContext(['lost', 'stolen', 'freeze', 'block'])) {
        return "If your card is lost or stolen:\n1. Immediately report it through our app, website, or call 1-800-NORTHCREST\n2. We'll freeze your card instantly and issue a replacement\n3. Your funds are protected with $0 liability guarantee\n4. Replacement card arrives in 3-5 business days\nYou can also freeze/unfreeze your card instantly through the app. Need help with this now?";
      }
      return "Our card options include:\n• **Cashback Rewards** - Up to 3% cashback\n• **Travel Rewards** - 5x miles on travel\n• **Premium** - 0.5% cashback, no annual fee\n• **Student** - Build credit with exclusive rates\nAll cards feature chip technology, contactless payments, and mobile wallet support. What would you like to know?";
    }
    
    if (hasContext(['transfer', 'send money', 'wire', 'remit', 'international'])) {
      if (hasContext(['international', 'overseas', 'foreign', 'currency'])) {
        return "International transfers are available in 30+ currencies with competitive exchange rates. Fees start at $5 for transfers under $1,000. Processing time: 1-3 business days. You'll need the recipient's full name, bank details (SWIFT/BIC), and address. Would you like to initiate a transfer?";
      }
      if (hasContext(['local', 'domestic', 'same', 'instant'])) {
        return "Local transfers between NorthCrest accounts are instant and free. Transfers to other US banks via ACH take 1-3 business days with no fee. Wire transfers are available for $15 with same-day processing. You can send up to $50,000 per day.";
      }
      return "We support:\n• **Local Transfers** - Instant between NorthCrest accounts, free\n• **Domestic Wires** - Same-day, $15 fee\n• **International Transfers** - 30+ currencies, 1-3 business days\n• **Mobile P2P** - Send to friends instantly\nExchange rates are updated in real-time. What type of transfer would you like to make?";
    }
    
    if (hasContext(['invest', 'investment', 'stock', 'crypto', 'real estate', 'retirement', '401', 'ira'])) {
      if (hasContext(['crypto', 'bitcoin', 'ethereum', 'btc', 'eth'])) {
        return "We offer crypto investment through our partner platforms. Available cryptocurrencies include Bitcoin, Ethereum, Litecoin, and more. Minimum investment: $100. All crypto investments are held in secure custodial accounts with insurance. Would you like to explore crypto investment options?";
      }
      if (hasContext(['retirement', '401', 'ira', 'pension'])) {
        return "Our retirement planning services include:\n• **Traditional IRA** - Tax-deductible contributions\n• **Roth IRA** - Tax-free withdrawals\n• **401(k) Rollovers** - Consolidate old accounts\n• **Managed Portfolios** - Professional management\nMinimum initial investment: $1,000. Speak with a certified financial planner for a free consultation.";
      }
      if (hasContext(['stock', 'portfolio', 'diversif'])) {
        return "Our investment portfolios are managed by certified financial advisors with over 20 years of experience. Options include:\n• **Conservative** - 70% bonds, 30% stocks\n• **Balanced** - 50% bonds, 50% stocks\n• **Growth** - 30% bonds, 70% stocks\n• **Aggressive** - 90% stocks, 10% alternatives\nAll portfolios include automatic rebalancing and tax-loss harvesting. Would you like a personalized recommendation?";
      }
      return "Investment options at NorthCrest:\n• **Stocks & ETFs** - Commission-free trading\n• **Mutual Funds** - 0 expense ratio options\n• **Bonds** - Government and corporate\n• **Real Estate** - REITs and direct investment\n• **Cryptocurrency** - 10+ coins available\n• **Retirement** - IRA and 401(k) management\nMinimum investment starts at $100. Ready to get started?";
    }
    
    if (hasContext(['kyc', 'verify', 'verification', 'identity', 'document'])) {
      return "KYC verification helps protect your account and comply with regulations. To complete KYC:\n1. Go to your Dashboard → Profile → KYC Verification\n2. Upload a clear photo of your government-issued ID (driver's license or passport)\n3. Take a live selfie for identity verification\n4. Submit proof of address (utility bill or bank statement)\nVerification typically takes 24-48 hours. You'll receive an email notification when complete. Need help with the process?";
    }
    
    if (hasContext(['password', 'login', 'forgot', 'reset', 'sign in', 'access'])) {
      if (hasContext(['forgot', 'reset', 'can\'t', 'cannot', 'unable'])) {
        return "To reset your password:\n1. Go to the login page and click 'Forgot Password'\n2. Enter your registered email address\n3. Check your email for a password reset link (expires in 15 minutes)\n4. Create a new password (minimum 8 characters, including uppercase, lowercase, number, and special character)\nIf you don't receive the email, check your spam folder or contact support. Need the reset link sent again?";
      }
      return "For security, we recommend:\n• Use a unique password not used elsewhere\n• Enable two-factor authentication (2FA) for extra security\n• Update your password every 90 days\n• Never share your password or 2FA codes\nYou can enable 2FA in your account settings under Security. Would you like instructions on setting this up?";
    }
    
    if (hasContext(['fee', 'charge', 'cost', 'price', 'expense'])) {
      return "Our fee structure:\n• **Monthly Maintenance** - $0 for all accounts\n• **ATM Fees** - $0 at NorthCrest ATMs, $2.50 at out-of-network ATMs\n• **Transfer Fees** - Free for local, $5-15 for international\n• **Card Fees** - $0 annual fee on all cards\n• **Overdraft** - $34 per occurrence (opt-in required)\n• **Wire Transfer** - $15 domestic, $35 international\nPremium account holders enjoy fee waivers on most services. Would you like details on a specific fee?";
    }
    
    if (hasContext(['hour', 'open', 'close', 'time', 'available', 'support', 'customer service'])) {
      return "Our support is available 24/7:\n• **Phone**: 1-800-NORTHCREST (1-800-667-8427)\n• **Live Chat**: Available on our website and mobile app\n• **Email**: support@northcrestbank.com (response within 2 hours)\n• **Branch Hours**: Mon-Fri 9AM-6PM, Sat 10AM-4PM (varies by location)\n• **Emergency Support**: 1-800-NORTHCREST (24/7 for urgent issues)\nOur AI assistant is always here to help with basic questions!";
    }
    
    if (hasContext(['contact', 'phone', 'email', 'address', 'call', 'reach'])) {
      return "You can reach us through:\n• **Phone**: 1-800-NORTHCREST (1-800-667-8427)\n• **Email**: support@northcrestbank.com\n• **Live Chat**: Click the chat icon on our website\n• **Mail**: NorthCrest Bank, 123 Financial District, New York, NY 10001\n• **In Person**: Visit any of our 200+ branch locations\n• **Social Media**: @NorthCrestBank on Twitter, Facebook, Instagram\nFor immediate assistance, I can connect you to a live agent. Would you like me to do that?";
    }
    
    if (hasContext(['thank', 'thanks', 'appreciate'])) {
      return "You're very welcome! I'm glad I could help. Is there anything else you'd like to know about NorthCrest Bank services? I'm here to assist you with accounts, loans, investments, or any other banking needs.";
    }
    
    if (hasContext(['bye', 'goodbye', 'see you', 'later'])) {
      return "Thank you for contacting NorthCrest Bank! Have a wonderful day. Remember, our support is available 24/7 if you need anything else. You can also use our mobile app for quick banking anytime!";
    }
    
    if (hasContext(['help', 'assist', 'what can you do', 'what do you do'])) {
      return "I'm your NorthCrest Bank AI assistant! I can help you with:\n• Account information and opening\n• Loan applications and eligibility\n• Card services and security\n• Investment advice and portfolio management\n• Transfer and payment processing\n• KYC verification and security\n• Password and login issues\n• Fee inquiries and billing\n• Branch and support information\nJust ask me anything about banking, and I'll do my best to assist you!";
    }
    
    if (hasContext(['how much', 'how many', 'minimum', 'maximum', 'limit'])) {
      return "Here are our key limits:\n• **Daily Transfer Limit**: $50,000\n• **Daily ATM Withdrawal**: $2,000\n• **Minimum Account Balance**: $0 (Savings), $100 (Checking)\n• **Minimum Investment**: $100\n• **Minimum Loan Amount**: $1,000\n• **Maximum Loan Amount**: $2,000,000\n• **Credit Card Limit**: $500-$25,000 based on creditworthiness\nWould you like details on any specific limit?";
    }
    
    if (hasContext(['security', 'safe', 'protect', 'fraud', 'hack', 'scam'])) {
      return "At NorthCrest Bank, your security is our priority:\n• **FDIC Insurance**: Up to $250,000 per depositor\n• **Zero Liability**: $0 liability on unauthorized transactions\n• **24/7 Monitoring**: AI-powered fraud detection\n• **Two-Factor Authentication**: Extra layer of security\n• **Encrypted Data**: Bank-level 256-bit encryption\n• **Biometric Login**: Face ID, Touch ID, fingerprint\nIf you notice any suspicious activity, report it immediately at 1-800-NORTHCREST or through the app's fraud reporting feature.";
    }
    
    if (hasContext(['mobile', 'app', 'download', 'ios', 'android'])) {
      return "Download the NorthCrest Bank mobile app:\n• **iOS**: Available on the App Store\n• **Android**: Available on Google Play Store\n• **Features**: Account management, mobile check deposit, bill pay, card controls, investment tracking, budget insights, and more!\n• **Security**: Biometric login, encrypted transactions, and real-time alerts\nThe app is free to download and use. Just search 'NorthCrest Bank' in your app store.";
    }
    
    if (hasContext(['bill', 'pay', 'payment', 'automatic', 'recurring'])) {
      return "Our bill pay service makes managing payments easy:\n• **One-time Payments**: Pay any business or individual\n• **Automatic Payments**: Set up recurring payments for utilities, subscriptions\n• **Payment Calendar**: Schedule payments in advance\n• **Payment History**: View and download past payments\n• **Mobile Pay**: Use Apple Pay, Google Pay, or Samsung Pay\nSetup takes less than 2 minutes in the app or website. Would you like step-by-step instructions?";
    }
    
    return "Thank you for your question about '" + userMessage + "'. I'd be happy to help you with that! For more complex inquiries, I can connect you to our human support team who can provide personalized assistance. Would you like me to connect you to a live agent, or is there something else I can help you with regarding your NorthCrest Bank accounts?";
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
        text: getAIResponse(newMessage, messages),
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
