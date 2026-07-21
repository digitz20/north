import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid, Paper, Card, CardContent,
  IconButton, Tooltip, AppBar, Toolbar, Drawer, Accordion, AccordionSummary,
  AccordionDetails, Avatar, Chip, TextField, Divider, Menu, MenuItem, List,
  ListItem, ListItemText, ListItemIcon, InputAdornment, Select, FormControl,
  Dialog, DialogContent
} from '@mui/material';
import {
  Menu as MenuIcon, Search, Language, Login, Person, Business, TrendingUp,
  Security, Smartphone, Shield, Lock, Fingerprint, CreditCard, ArrowForward,
  ArrowDownward, ExpandMore, Star, PlayCircle, Twitter, Facebook, Instagram,
  LinkedIn, YouTube, Email, Phone, LocationOn, Apple, Google, ChevronRight,
  Check, Notifications, Savings, ShowChart, Money, ArrowUpward, Close
} from '@mui/icons-material';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import NorthCrestLogo from '../components/common/NorthCrestLogo';
import { useNavigationWithSplash } from '../hooks/useNavigationWithSplash';
import AIChatBot from '../components/support/AIChatBot';
import { translations, languages } from '../utils/translations';

gsap.registerPlugin(ScrollTrigger);

const Landing = () => {
  const navigate = useNavigate();
  const { navigateWithSplash, NavigationSplash } = useNavigationWithSplash();
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'en';
  });
  
  const t = (key) => {
    const lang = translations[selectedLanguage] || translations.en;
    return lang[key] || translations.en[key] || key;
  };
  const [activeSection, setActiveSection] = useState('home');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  // Hero section image slideshow - slow, smooth transitions
  useEffect(() => {
    const totalImages = 20; // We have 20 high-quality images in the slideshow
    const imageTimer = setInterval(() => {
      setCurrentHeroImage(prev => (prev + 1) % totalImages);
    }, 6000); // Wait 6 seconds on each image before transitioning (slow & smooth)
    
    return () => clearInterval(imageTimer);
  }, []);

  // Show initial loading splash screen with logo before page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Update document language when selection changes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = selectedLanguage.toLowerCase();
      localStorage.setItem('selectedLanguage', selectedLanguage);
    }
  }, [selectedLanguage]);

  // Optimized mouse parallax with throttle to prevent excessive re-renders
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    let isThrottled = false;
    const handleMouseMove = (e) => {
      if (!isThrottled) {
        setMousePosition({
          x: (e.clientX - window.innerWidth / 2) / 80, // Reduced movement intensity
          y: (e.clientY - window.innerHeight / 2) / 80
        });
        isThrottled = true;
        setTimeout(() => { isThrottled = false; }, 32); // Throttle to ~30fps instead of 60fps
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Dynamic hero section cards data - real-time updating
  const [totalBalance, setTotalBalance] = useState(124580.00);
  const [transferAmount, setTransferAmount] = useState(2450.00);
  const [cardHolder, setCardHolder] = useState('ALEXANDER SMITH');
  const [transferTime, setTransferTime] = useState('2 minutes ago');
  
  // Random data arrays for dynamic updates
  const cardHolders = [
    'ALEXANDER SMITH', 'EMMA WILSON', 'JAMES JOHNSON', 'OLIVIA DAVIS', 'WILLIAM BROWN',
    'SOPHIA TAYLOR', 'LUCAS MILLER', 'MIA ANDERSON', 'NOAH THOMAS', 'CHARLOTTE JACKSON'
  ];
  
  const transferNames = [
    'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim', 'Lisa Thompson',
    'James Wilson', 'Anna Lee', 'Robert Garcia', 'Jennifer Martinez', 'Chris Anderson'
  ];
  
  const transferAvatars = [
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100'
  ];
  
  const [currentTransferAvatar, setCurrentTransferAvatar] = useState(transferAvatars[0]);
  const [currentTransferName, setCurrentTransferName] = useState('Sarah Johnson');

  // Real-time updates for hero section metrics
  useEffect(() => {
    // Update total balance randomly every 5-8 seconds (simulates market fluctuations)
    const balanceInterval = setInterval(() => {
      const change = (Math.random() - 0.45) * 1500; // Small positive bias to simulate growth
      setTotalBalance(prev => Math.max(110000, Math.min(140000, parseFloat((prev + change).toFixed(2)))));
    }, Math.random() * 3000 + 5000);

    // Update transfer notification randomly every 15-30 seconds
    const transferInterval = setInterval(() => {
      const amount = Math.floor(Math.random() * 5000) + 500;
      setTransferAmount(amount);
      setCurrentTransferName(transferNames[Math.floor(Math.random() * transferNames.length)]);
      setCurrentTransferAvatar(transferAvatars[Math.floor(Math.random() * transferAvatars.length)]);
      // Set random time ago
      const minutes = Math.floor(Math.random() * 10) + 1;
      setTransferTime(`${minutes} minute${minutes > 1 ? 's' : ''} ago`);
    }, Math.random() * 15000 + 15000);

    // Change card holder name randomly every 30-60 seconds
    const cardHolderInterval = setInterval(() => {
      setCardHolder(cardHolders[Math.floor(Math.random() * cardHolders.length)]);
    }, Math.random() * 30000 + 30000);

    return () => {
      clearInterval(balanceInterval);
      clearInterval(transferInterval);
      clearInterval(cardHolderInterval);
    };
  }, []);

  // Statistics in-view trigger
  const [statsRef, statsInView] = useInView({ threshold: 0.3, triggerOnce: true });

  // GSAP animations on scroll
  useEffect(() => {
    const sections = document.querySelectorAll('.animate-section');
    sections.forEach((section) => {
      gsap.fromTo(section,
        { opacity: 0, y: 100 },
        {
          opacity: 1, y: 0, duration: 1,
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }, []);

   const services = [
     { title: t('personal'), icon: <Person sx={{ fontSize: 48 }} />, description: 'Manage your personal finances with our comprehensive banking solutions designed for everyday life.', image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600' },
     { title: t('business'), icon: <Business sx={{ fontSize: 48 }} />, description: 'Empower your business with tailored financial solutions that drive growth and success.', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600' },
     { title: t('investments'), icon: <TrendingUp sx={{ fontSize: 48 }} />, description: 'Grow your wealth with expert investment strategies and personalized financial guidance.', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600' },
    { title: 'Insurance Services', icon: <Security sx={{ fontSize: 48 }} />, description: 'Protect what matters most with our comprehensive insurance coverage options.', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600' },
    { title: 'Private Banking', icon: <CreditCard sx={{ fontSize: 48 }} />, description: 'Exclusive banking services for high-net-worth individuals with personalized attention.', image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600' },
    { title: 'Corporate Banking', icon: <Business sx={{ fontSize: 48 }} />, description: 'Comprehensive financial solutions for large corporations and institutional clients.', image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600' }
  ];

  const securityFeatures = [
    { title: 'Bank-Level Encryption', description: '256-bit SSL encryption protects all your transactions and data', icon: <Lock sx={{ fontSize: 40, color: '#00C896' }} /> },
    { title: 'Biometric Login', description: 'Secure access with fingerprint and facial recognition', icon: <Fingerprint sx={{ fontSize: 40, color: '#00BFFF' }} /> },
    { title: 'Fraud Detection', description: 'Real-time fraud monitoring and alerts for enhanced security', icon: <Shield sx={{ fontSize: 40, color: '#0066FF' }} /> },
    { title: '2FA Authentication', description: 'Additional layer of security with two-factor authentication', icon: <Security sx={{ fontSize: 40, color: '#FFC857' }} /> }
  ];

  const testimonials = [
    { name: 'Sarah Johnson', role: 'CEO, TechStart Inc.', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', text: 'NorthCrest Bank transformed how we manage our corporate finances. The platform is intuitive, secure, and their team is incredibly responsive.', rating: 5 },
    { name: 'Michael Chen', role: 'Private Investor', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', text: 'Their investment services have helped me grow my portfolio significantly. The analytics tools are best-in-class.', rating: 5 },
    { name: 'Emily Rodriguez', role: 'Small Business Owner', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', text: 'As a small business owner, I needed a bank that understands my needs. NorthCrest delivers on every level.', rating: 5 }
  ];

  const faqs = [
    { question: 'How do I open an account with NorthCrest Bank?', answer: 'Opening an account is simple. Click the "Open Account" button, complete our online application with your personal information, verify your identity, and start banking in minutes.' },
    { question: 'What security measures are in place to protect my account?', answer: 'We employ bank-level 256-bit SSL encryption, biometric authentication options, real-time fraud detection, and mandatory 2FA for all accounts. Your security is our highest priority.' },
    { question: 'Can I access my account from multiple devices?', answer: 'Absolutely! Our platform works seamlessly across web, iOS, and Android devices. Your data syncs in real-time across all your devices for consistent access.' },
    { question: 'What are the fees associated with your services?', answer: 'We believe in transparent pricing. Our standard personal accounts have no monthly maintenance fees. Business and premium accounts have tiered pricing detailed during the application process.' },
    { question: 'How quickly can I get a credit card approved?', answer: 'Credit card applications are typically processed within 24 hours. Approved cards are shipped within 3-5 business days. You can start using your virtual card immediately after approval.' }
  ];

  const news = [
    { title: 'NorthCrest Announces Record Q4 Earnings', category: 'Financial', date: 'Dec 15, 2024', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600' },
    { title: 'New Sustainable Investment Funds Launched', category: 'Investment', date: 'Dec 10, 2024', image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600' },
    { title: 'Mobile App Update Brings Enhanced Customer Insights', category: 'Technology', date: 'Dec 5, 2024', image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600' }
  ];

  const trustedLogos = ['Visa', 'Mastercard', 'SWIFT', 'Apple Pay', 'Google Pay', 'Reuters', 'Bloomberg'];

  return (
    <>
      {/* Initial Page Loading Splash with NorthCrest Logo */}
      <AnimatePresence>
        {isPageLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'linear-gradient(135deg, #1a365d 0%, #021024 50%, #1a365d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <NorthCrestLogo />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Navigation splash screen for smooth transitions */}
      <NavigationSplash />
      
      <Box sx={{ overflow: 'hidden', bgcolor: '#F5F7FA', minHeight: '100vh' }}>
        {/* Scroll Progress Bar */}
      <motion.div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #0066FF, #00BFFF, #00C896)',
          transformOrigin: '0%',
          scaleX: scrollYProgress,
          zIndex: 9999
        }}
      />

      {/* Transparent Glass Navbar */}
      <AppBar
        position="fixed"
        sx={{
          background: 'rgba(2, 16, 36, 0.7)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <NorthCrestLogo color="white" />
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4, alignItems: 'center' }}>
              {['Personal', 'Business', 'Investments', 'Cards', 'About'].map((item) => {
                const routeMap = {
                  'Personal': '/personal-banking',
                  'Business': '/business-banking',
                  'Investments': '/investments',
                  'Cards': '/credit-cards',
                  'About': '/about-us'
                };
                return (
                  <motion.div
                    key={item}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Typography
                      sx={{
                        color: 'white',
                        cursor: 'pointer',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: -4,
                          left: 0,
                          width: activeSection === item.toLowerCase() ? '100%' : '0%',
                          height: 2,
                          background: 'linear-gradient(90deg, #00BFFF, #00C896)',
                          transition: 'width 0.3s ease',
                          borderRadius: 2
                        },
                        '&:hover::after': { width: '100%' }
                       }}
                       onClick={() => {
                         setActiveSection(item.toLowerCase());
                         navigate(routeMap[item]);
                       }}
                     >
                       {t(item.toLowerCase())}
                     </Typography>
                  </motion.div>
                );
              })}
            </Box>

            {/* Nav Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Search">
                <IconButton
                  sx={{ color: 'white' }}
                  onClick={(e) => setSearchAnchor(e.currentTarget)}
                >
                  <Search />
                </IconButton>
              </Tooltip>
              <Tooltip title="Language">
                <IconButton
                  sx={{ color: 'white' }}
                  onClick={(e) => setLanguageAnchor(e.currentTarget)}
                >
                  <Language />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.1)' },
                  display: { xs: 'none', sm: 'flex' }
                }}
                 startIcon={<Login />}
               >
                 {t('signIn')}
               </Button>
               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(135deg, #0066FF, #00BFFF)',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(0, 102, 255, 0.4)',
                  '&:hover': { boxShadow: '0 6px 30px rgba(0, 102, 255, 0.6)' },
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  Open Account
                </Button>
              </motion.div>
              <IconButton
                sx={{ color: 'white', display: { xs: 'flex', md: 'none' } }}
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Search Menu */}
      <Menu
        anchorEl={searchAnchor}
        open={Boolean(searchAnchor)}
        onClose={() => setSearchAnchor(null)}
        sx={{ mt: 2 }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <TextField
            fullWidth
            placeholder="Search services, accounts, support..."
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                // Handle search submission
                console.log('Searching for:', e.target.value);
                setSearchAnchor(null);
              }
            }}
          />
        </Box>
      </Menu>

      {/* Language Menu */}
      <Menu
        anchorEl={languageAnchor}
        open={Boolean(languageAnchor)}
        onClose={() => setLanguageAnchor(null)}
        sx={{ mt: 2 }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} onClick={() => { setSelectedLanguage(lang.code); setLanguageAnchor(null); }}>
            {lang.flag} {lang.name}
          </MenuItem>
        ))}
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 300,
            background: 'rgba(2, 16, 36, 0.98)',
            backdropFilter: 'blur(20px)',
            color: 'white'
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <NorthCrestLogo color="white" />
            <IconButton sx={{ color: 'white' }} onClick={() => setMobileOpen(false)}>
              <Close />
            </IconButton>
          </Box>
          <List>
            {['Personal', 'Business', 'Investments', 'Cards', 'About'].map((item) => {
              const routeMap = {
                'Personal': '/personal-banking',
                'Business': '/business-banking',
                'Investments': '/investments',
                'Cards': '/credit-cards',
                'About': '/about-us'
              };
              return (
                 <ListItem
                   key={item}
                   onClick={() => { 
                     setActiveSection(item.toLowerCase()); 
                     setMobileOpen(false);
                     navigate(routeMap[item]);
                   }}
                   sx={{ borderRadius: 2, mb: 1, '&:hover': { background: 'rgba(255,255,255,0.1)' } }}
                 >
                   <ListItemText primary={t(item.toLowerCase())} />
                  <ChevronRight />
                </ListItem>
              );
            })}
          </List>
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => { navigate('/login'); setMobileOpen(false); }}
              sx={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
            >
              {t('signIn')}
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => { navigate('/register'); setMobileOpen(false); }}
              sx={{ background: 'linear-gradient(135deg, #0066FF, #00BFFF)' }}
            >
              Open Account
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Hero Section - 100vh with image slideshow */}
      <Box
        ref={heroRef}
        sx={{
          minHeight: '100vh',
          width: '100vw',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1,
          }
        }}
      >
        {/* Background Image Slideshow - 20 mixed high-quality HD images */}
        {[
          // Skyscrapers & cityscapes
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920', // NYC Skyscraper
          'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1920', // City Skyline
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920', // NYC at night
          'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1920', // Business district
          
          // People on computers/working
          'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920', // Business people working on computers
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920', // Team collaborating on laptops
          'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1920', // Professionals working in office
          'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1920', // Person using computer for banking
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920', // Business team at computers
          
          // People with credit cards & banking
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920', // Person holding credit card shopping online
          'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1920', // Customer using credit card to pay
          'https://images.unsplash.com/photo-1570126014405-76402d9b9811?w=1920', // Person using phone with digital banking
          'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1920', // Woman holding credit card using laptop
          
          // Money & finance
          'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1920', // US dollars cash in hand
          'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=1920', // Stack of money, coins and bills
          'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1920', // Different world currencies
          
          // Forex, stock market & trading
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920', // Stock market charts & trading screen
          'https://images.unsplash.com/photo-1590283603385-17ffb3a7f28f?w=1920', // Forex trading charts on monitor
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920', // Financial analytics dashboard
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920'  // Stock market data visualizations
        ].map((src, index) => (
          <motion.div
            key={index}
            initial={{ x: '100%', opacity: 0 }}
            animate={{ 
              x: currentHeroImage === index ? '0%' : '-100%',
              opacity: currentHeroImage === index ? 1 : 0,
              transition: { duration: 1.2, ease: 'easeInOut' }
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              zIndex: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        ))}

        {/* Removed 20 animated particles to drastically improve performance - they were causing major lag */}

        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, pt: 10 }}>
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} lg={7}>
              <motion.div
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <Chip
                  label="Premium Banking Redefined"
                  sx={{
                    background: 'rgba(0, 200, 150, 0.2)',
                    color: '#00C896',
                    border: '1px solid rgba(0, 200, 150, 0.5)',
                    mb: 3,
                    fontSize: '0.9rem',
                    fontWeight: 600
                  }}
                />
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '3rem', md: '5rem', lg: '5.5rem' },
                    fontWeight: 800,
                    color: 'white',
                    lineHeight: 1.1,
                    mb: 3,
                    textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.6)' // Enhanced text shadow for readability
                  }}
                >
                  Bank Without
                  <br />
                  <span 
                    style={{ 
                      background: 'linear-gradient(90deg, #00BFFF, #00C896)', 
                      WebkitBackgroundClip: 'text', 
                      WebkitTextFillColor: 'transparent',
                      textShadow: 'none' // Remove shadow from gradient text to let colors show properly
                    }}
                  >
                    Boundaries
                  </span>
                </Typography>
                 <Typography
                   variant="h5"
                   sx={{
                     color: 'rgba(255,255,255,0.95)',
                     mb: 6,
                     maxWidth: 600,
                     lineHeight: 1.6,
                     textShadow: '0 1px 4px rgba(0,0,0,0.8)' // Subtle shadow for subtitle readability
                   }}
                 >
                   {t('heroSubtitle')}
                 </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => navigate('/register')}
                      sx={{
                        background: 'linear-gradient(135deg, #0066FF, #00BFFF)',
                        color: 'white',
                        fontWeight: 700,
                        px: 6,
                        py: 2,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        boxShadow: '0 8px 40px rgba(0, 102, 255, 0.5)',
                        '&:hover': { boxShadow: '0 12px 60px rgba(0, 102, 255, 0.7)' }
                       }}
                       endIcon={<ArrowForward />}
                     >
                       {t('getStarted')}
                     </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => setVideoModalOpen(true)}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        fontWeight: 700,
                        px: 6,
                        py: 2,
                        borderRadius: 2,
                        fontSize: '1.1rem',
                        '&:hover': { borderColor: 'white', background: 'rgba(255,255,255,0.1)' }
                      }}
                      startIcon={<PlayCircle />}
                    >
                      Watch Video
                    </Button>
                  </motion.div>
                </Box>
              </motion.div>
            </Grid>

            {/* Hero Right Side - Only credit card and transfer card remaining */}
            <Grid item xs={12} lg={5} sx={{ position: 'relative', minHeight: { xs: 700, lg: 450 }, mt: { xs: 10, lg: 0 } }}>
              {/* 1. DEBIT CARD MOCKUP - RECTANGULAR & CENTERED AT THE TOP */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: { xs: 20, lg: 30 },
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: { xs: 320, lg: 340 },
                  height: { xs: 200, lg: 220 },
                  background: 'linear-gradient(135deg, #0066FF, #063970)',
                  borderRadius: 20,
                  padding: 28,
                  boxShadow: '0 30px 60px rgba(0,102,255,0.4)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
                animate={{
                  y: [0, 10, 0],
                  x: mousePosition.x * 1
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                  <NorthCrestLogo color="white" />
                  <CreditCard sx={{ color: 'white', fontSize: 40 }} />
                </Box>
                <Typography sx={{ color: 'white', fontSize: '1.4rem', letterSpacing: 4, mb: 3 }}>4532 •••• •••• 8901</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>VALID THRU</Typography>
                    <Typography sx={{ color: 'white', fontSize: '1rem' }}>08/28</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>CARD HOLDER</Typography>
                    <Typography sx={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>{cardHolder}</Typography>
                  </Box>
                </Box>
              </motion.div>

              {/* 2. TRANSFER CARD - PLACED BELOW THE CREDIT CARD PROPERLY SPACED */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: { xs: 300, lg: 280 },
                  left: { xs: '50%', lg: 0 },
                  transform: { xs: 'translateX(-50%)', lg: 'none' },
                  width: { xs: 240, lg: 240 },
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 16,
                  padding: 20,
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
                animate={{
                  y: [0, 12, 0],
                  x: mousePosition.x * 1.2
                }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar src={currentTransferAvatar} sx={{ width: 40, height: 40 }} />
                  <Box>
                    <Typography sx={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>Transfer Sent to {currentTransferName}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>{transferTime}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ color: '#00C896', fontSize: '1.2rem', fontWeight: 700 }}>
                  -${transferAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </motion.div>
            </Grid>
          </Grid>

          {/* Scroll Indicator */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.6)' }}>
              <Typography sx={{ fontSize: '0.85rem', mb: 1 }}>Scroll to explore</Typography>
              <ArrowDownward />
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Trusted By Section - Scrolling Logos */}
      <Box sx={{ py: 8, bgcolor: 'white', overflow: 'hidden' }} className="animate-section">
        <Container maxWidth="xl">
          <Typography textAlign="center" sx={{ color: '#0F172A', fontSize: '1rem', mb: 4, fontWeight: 500 }}>TRUSTED BY LEADING COMPANIES WORLDWIDE</Typography>
          <motion.div
            style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap' }}
            animate={{ x: [0, -1000] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {[...trustedLogos, ...trustedLogos].map((logo, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 150,
                  opacity: 0.6,
                  filter: 'grayscale(100%)',
                  transition: 'all 0.3s',
                  '&:hover': { filter: 'grayscale(0%)', opacity: 1 }
                }}
              >
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#021024' }}>{logo}</Typography>
              </Box>
            ))}
          </motion.div>
        </Container>
      </Box>

      {/* Banking Services Section */}
      <Box sx={{ py: 15, bgcolor: '#F5F7FA' }} className="animate-section">
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
             <Chip label="Our Services" sx={{ background: 'rgba(0, 102, 255, 0.1)', color: '#0066FF', mb: 3, fontSize: '0.9rem' }} />
             <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, color: '#0F172A', mb: 3 }}>{t('features')}</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '1.25rem', maxWidth: 600, margin: '0 auto' }}>Everything you need to manage, grow, and protect your wealth in one powerful platform.</Typography>
          </Box>

          <Grid container spacing={4}>
            {services.map((service, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card sx={{
                    height: '100%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    border: '1px solid rgba(0,0,0,0.05)',
                    background: 'white',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #0066FF, #00BFFF)'
                    }
                  }}>
                    <Box sx={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                      <img src={service.image} alt={service.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ color: '#0066FF', mb: 2 }}>{service.icon}</Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', mb: 2 }}>{service.title}</Typography>
                      <Typography sx={{ color: '#64748B', lineHeight: 1.7, mb: 3 }}>{service.description}</Typography>
                      <Button endIcon={<ArrowForward />} sx={{ color: '#0066FF', fontWeight: 600, p: 0, '&:hover': { background: 'transparent' } }}>
                        {t('learnMore')}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Dashboard Preview Section */}
      <Box sx={{ py: 15, bgcolor: '#021024', overflow: 'hidden' }} className="animate-section">
        <Container maxWidth="xl">
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} lg={5}>
              <Chip label="Live Dashboard" sx={{ background: 'rgba(0, 191, 255, 0.1)', color: '#00BFFF', mb: 3, fontSize: '0.9rem' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, color: 'white', mb: 3 }}>Your Financial Command Center</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', lineHeight: 1.7, mb: 6 }}>
                Get a complete overview of your finances with real-time updates, beautiful analytics, and powerful insights all in one place.
              </Typography>
              <Grid container spacing={3}>
                {[
                  { icon: <Money sx={{ color: '#00C896' }} />, label: 'Real-time Balance', desc: 'Always know your net worth' },
                  { icon: <Savings sx={{ color: '#00BFFF' }} />, label: 'Smart Savings Goals', desc: 'Automatically save more' },
                  { icon: <TrendingUp sx={{ color: '#FFC857' }} />, label: 'Portfolio Tracking', desc: 'Watch your investments grow' },
                  { icon: <Notifications sx={{ color: '#FF6B6B' }} />, label: 'Smart Alerts', desc: 'Never miss an important update' }
                ].map((item, i) => (
                  <Grid item xs={12} key={i}>
                    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                      <Box sx={{ p: 2, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }}>{item.icon}</Box>
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>{item.label}</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} lg={7}>
              <motion.div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  padding: 4,
                  border: '1px solid rgba(255,255,255,0.1)'
                }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200"
                  alt="Dashboard Preview"
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Statistics Section */}
      <Box ref={statsRef} sx={{ py: 15, background: 'linear-gradient(135deg, #063970, #021024)' }} className="animate-section">
        <Container maxWidth="xl">
          <Grid container spacing={4}>
            {[
              { value: 18, suffix: 'M+', label: t('stat1'), icon: <Person /> },
              { value: 120, suffix: '+', label: t('stat3'), icon: <Language /> },
              { value: 420, suffix: 'B+', label: 'Assets Under Management', icon: <Money /> },
               { value: 99.99, suffix: '%', label: t('stat4'), icon: <Check /> },
               { value: 8, suffix: 'M+', label: t('stat2'), icon: <TrendingUp /> }
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={2.4} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={statsInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        fontSize: { xs: '3rem', md: '4rem' },
                        fontWeight: 800,
                        background: 'linear-gradient(90deg, #00BFFF, #00C896)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      {statsInView && <CountUp start={0} end={stat.value} duration={2.5} separator="," />}
                      {stat.suffix}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', fontWeight: 500 }}>{stat.label}</Typography>
                  </motion.div>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Credit Cards Section */}
      <Box sx={{ py: 15, bgcolor: '#F5F7FA' }} className="animate-section">
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Chip label="Credit Cards" sx={{ background: 'rgba(255, 200, 87, 0.2)', color: '#FFC857', mb: 3, fontSize: '0.9rem' }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, color: '#0F172A', mb: 3 }}>Cards That Work As Hard As You</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '1.25rem', maxWidth: 600, margin: '0 auto' }}>Premium credit cards with cashback, travel rewards, and exclusive perks.</Typography>
          </Box>

          <Grid container spacing={6} justifyContent="center">
            {[
              { name: 'NorthCrest Platinum', gradient: 'linear-gradient(135deg, #021024, #063970)', features: ['3% Cashback on all purchases', 'Airport lounge access', 'Comprehensive travel insurance'] },
              { name: 'NorthCrest Signature', gradient: 'linear-gradient(135deg, #0066FF, #00BFFF)', features: ['2% Unlimited cashback', 'Premium concierge service', 'Hotel upgrade benefits'] },
              { name: 'NorthCrest Gold', gradient: 'linear-gradient(135deg, #FFC857, #D4A03C)', features: ['4% Dining & entertainment', 'Purchase protection', 'Extended warranties'] }
            ].map((card, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  style={{ perspective: 1000 }}
                  whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Box
                    sx={{
                      height: 420,
                      borderRadius: 4,
                      background: card.gradient,
                      padding: 4,
                      color: 'white',
                      boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Reflection effect */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: '50%',
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)',
                    }} />
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <NorthCrestLogo color="white" />
                      <Box sx={{ mt: 8 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 4 }}>{card.name}</Typography>
                        <Typography sx={{ fontSize: '1.4rem', letterSpacing: 3, mb: 4 }}>4532 •••• •••• 8901</Typography>
                        <Box sx={{ mt: 4 }}>
                          {card.features.map((feature, i) => (
                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Check sx={{ fontSize: 18, color: '#00C896' }} />
                              <Typography sx={{ fontSize: '0.95rem' }}>{feature}</Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Mobile Banking Section */}
      <Box sx={{ py: 15, bgcolor: 'white' }} className="animate-section">
        <Container maxWidth="xl">
          <Grid container spacing={12} alignItems="center">
            <Grid item xs={12} lg={6}>
              <motion.div
                style={{ position: 'relative' }}
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <Box sx={{
                  width: 320,
                  height: 640,
                  margin: '0 auto',
                  borderRadius: 50,
                  padding: 2,
                  background: '#021024',
                  boxShadow: '0 50px 100px rgba(0,0,0,0.3)'
                }}>
                  <img
                    src="https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600"
                    alt="Mobile App"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 46 }}
                  />
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} lg={6}>
              <Chip label="Mobile Banking" sx={{ background: 'rgba(0, 200, 150, 0.1)', color: '#00C896', mb: 3, fontSize: '0.9rem' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, color: '#0F172A', mb: 3 }}>Bank From Your Pocket</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '1.25rem', lineHeight: 1.7, mb: 6 }}>
                The full power of NorthCrest Bank in your smartphone. Send money, pay bills, track investments, and manage your cards from anywhere in the world.
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, mb: 6, flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      background: '#021024',
                      color: 'white',
                      py: 2,
                      px: 4,
                      borderRadius: 2,
                      '&:hover': { background: '#063970' }
                    }}
                    startIcon={<Apple sx={{ fontSize: 28 }} />}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                       <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>Download on the</Box>
                       <Box sx={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('appStore')}</Box>
                    </Box>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      background: '#021024',
                      color: 'white',
                      py: 2,
                      px: 4,
                      borderRadius: 2,
                      '&:hover': { background: '#063970' }
                    }}
                    startIcon={<Google sx={{ fontSize: 28 }} />}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                       <Box sx={{ fontSize: '0.75rem', opacity: 0.8 }}>Get it on</Box>
                       <Box sx={{ fontSize: '1.2rem', fontWeight: 700 }}>{t('googlePlay')}</Box>
                    </Box>
                  </Button>
                </motion.div>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{
                  width: 100,
                  height: 100,
                  border: '2px dashed #021024',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.75rem' }}>Scan QR Code</Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: '#0F172A', fontWeight: 600 }}>Scan to download</Typography>
                  <Typography sx={{ color: '#64748B' }}>Point your camera at the QR code to get the app</Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Security Section */}
      <Box sx={{ py: 15, bgcolor: '#021024', position: 'relative', overflow: 'hidden' }} className="animate-section">
        {/* Animated background */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: `rgba(0, 179, 255, ${Math.random() * 0.5 + 0.2})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Chip label="Bank-Grade Security" sx={{ background: 'rgba(0, 102, 255, 0.2)', color: '#0066FF', mb: 3, fontSize: '0.9rem' }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, color: 'white', mb: 3 }}>Your Security Is Our Priority</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.25rem', maxWidth: 600, margin: '0 auto' }}>Industry-leading protection for your assets with multiple layers of security.</Typography>
          </Box>

          <Grid container spacing={4}>
            {securityFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div whileHover={{ y: -10 }} transition={{ duration: 0.3 }}>
                  <Box sx={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 4,
                    padding: 4,
                    border: '1px solid rgba(255,255,255,0.1)',
                    textAlign: 'center'
                  }}>
                    <Box sx={{ mb: 3 }}>{feature.icon}</Box>
                    <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.2rem', mb: 2 }}>{feature.title}</Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>{feature.description}</Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 8, flexWrap: 'wrap' }}>
            {['PCI DSS Certified', 'SSL Encrypted', '2FA Enabled', 'FDIC Insured'].map((badge, i) => (
              <Chip key={i} label={badge} sx={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', px: 2 }} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: 15, bgcolor: '#F5F7FA' }} className="animate-section">
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Chip label="Testimonials" sx={{ background: 'rgba(0, 200, 150, 0.1)', color: '#00C896', mb: 3, fontSize: '0.9rem' }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, color: '#0F172A', mb: 3 }}>Loved By Millions Worldwide</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '1.25rem', maxWidth: 600, margin: '0 auto' }}>See what our customers have to say about their NorthCrest experience.</Typography>
          </Box>

          <Grid container spacing={6}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                  <Card sx={{ p: 5, borderRadius: 4, height: '100%', background: 'white', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                    <Box sx={{ display: 'flex', mb: 3 }}>
                      {[...Array(testimonial.rating)].map((_, i) => <Star key={i} sx={{ color: '#FFC857', fontSize: 20 }} />)}
                    </Box>
                    <Typography sx={{ color: '#0F172A', fontSize: '1.1rem', lineHeight: 1.8, mb: 4, fontStyle: 'italic' }}>"{testimonial.text}"</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Avatar src={testimonial.image} sx={{ width: 56, height: 56 }} />
                      <Box>
                        <Typography sx={{ color: '#0F172A', fontWeight: 700 }}>{testimonial.name}</Typography>
                        <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>{testimonial.role}</Typography>
                      </Box>
                    </Box>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Financial News Section */}
      <Box sx={{ py: 15, bgcolor: 'white' }} className="animate-section">
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 10, flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Chip label="Latest News" sx={{ background: 'rgba(0, 102, 255, 0.1)', color: '#0066FF', mb: 3, fontSize: '0.9rem' }} />
              <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, color: '#0F172A' }}>Financial Insights</Typography>
            </Box>
            <Button endIcon={<ArrowForward />} sx={{ color: '#0066FF', fontWeight: 600, fontSize: '1.1rem' }}>{t('viewAll')}</Button>
          </Box>

          <Grid container spacing={6}>
            {news.map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
                  <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
                    <Box sx={{ height: 260, overflow: 'hidden' }}>
                      <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', '&:hover': { transform: 'scale(1.1)' } }} />
                    </Box>
                    <CardContent sx={{ p: 4 }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Chip size="small" label={item.category} sx={{ background: 'rgba(0,102,255,0.1)', color: '#0066FF' }} />
                        <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{item.date}</Typography>
                      </Box>
                      <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 700, lineHeight: 1.5, mb: 2 }}>{item.title}</Typography>
                      <Button sx={{ color: '#0066FF', p: 0, fontWeight: 600 }}>{t('readMore')}</Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box sx={{ py: 15, bgcolor: '#F5F7FA' }} className="animate-section">
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 10 }}>
            <Chip label="FAQ" sx={{ background: 'rgba(255, 200, 87, 0.2)', color: '#FFC857', mb: 3, fontSize: '0.9rem' }} />
            <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' }, fontWeight: 800, color: '#0F172A', mb: 3 }}>Frequently Asked Questions</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '1.25rem', maxWidth: 600, margin: '0 auto' }}>Everything you need to know about NorthCrest Bank.</Typography>
          </Box>

          <Grid container justifyContent="center">
            <Grid item xs={12} lg={8}>
              {faqs.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    '&:before': { display: 'none' },
                    '&.Mui-expanded': { margin: '0 0 16px 0' }
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMore />} sx={{ '& .MuiAccordionSummary-content': { my: 2 } }}>
                    <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.15rem' }}>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography sx={{ color: '#64748B', lineHeight: 1.8 }}>{faq.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 15, background: 'linear-gradient(135deg, #0066FF, #063970)', position: 'relative', overflow: 'hidden' }} className="animate-section">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 30 + 10,
              height: Math.random() * 30 + 10,
              borderRadius: '50%',
              background: `rgba(255,255,255,${Math.random() * 0.15})`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{ y: [0, -50, 0], x: [0, Math.random() * 20 - 10, 0] }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '2.5rem', md: '4rem' }, fontWeight: 800, color: 'white', mb: 4 }}>{t('ctaTitle')}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.4rem', maxWidth: 700, margin: '0 auto', mb: 8 }}>{t('ctaSubtitle')}</Typography>
            <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigateWithSplash('/register')}
                  sx={{
                    background: 'white',
                    color: '#0066FF',
                    fontWeight: 700,
                    px: 8,
                    py: 2.5,
                    borderRadius: 2,
                    fontSize: '1.2rem',
                    boxShadow: '0 10px 40px rgba(255,255,255,0.3)',
                    '&:hover': { background: '#f8f9fa', boxShadow: '0 15px 50px rgba(255,255,255,0.4)' }
                   }}
                   endIcon={<ArrowForward />}
                 >
                   {t('createAccount')}
                 </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 700,
                    px: 8,
                    py: 2.5,
                    borderRadius: 2,
                    fontSize: '1.2rem',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.1)' }
                   }}
                 >
                   {t('contactUs')}
                 </Button>
              </motion.div>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Footer Section */}
      <Box sx={{ bgcolor: '#021024', py: 12, color: 'white' }}>
        <Container maxWidth="xl">
          <Grid container spacing={8}>
             <Grid item xs={12} md={4}>
               <NorthCrestLogo color="white" />
               <Typography sx={{ color: 'rgba(255,255,255,0.6)', mt: 3, lineHeight: 1.8, mb: 4 }}>
                 {t('footerDesc')}
               </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {[Twitter, Facebook, Instagram, LinkedIn, YouTube].map((Icon, i) => (
                  <IconButton key={i} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', background: 'rgba(255,255,255,0.1)' } }}>
                    <Icon />
                  </IconButton>
                ))}
              </Box>
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <Typography sx={{ fontWeight: 700, mb: 4, fontSize: '1.1rem' }}>Products</Typography>
              <List sx={{ p: 0 }}>
                {['Personal Banking', 'Business Accounts', 'Credit Cards', 'Loans & Mortgages', 'Investments'].map((item, i) => (
                  <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' }, cursor: 'pointer' }}>{item}</Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <Typography sx={{ fontWeight: 700, mb: 4, fontSize: '1.1rem' }}>Company</Typography>
              <List sx={{ p: 0 }}>
                {['About Us', 'Careers', 'Press', 'Blog', 'Contact Us'].map((item, i) => (
                  <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' }, cursor: 'pointer' }}>{item}</Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <Typography sx={{ fontWeight: 700, mb: 4, fontSize: '1.1rem' }}>Support</Typography>
              <List sx={{ p: 0 }}>
                {['Help Center', 'Safety Center', 'Community', 'Report Fraud', 'Accessibility'].map((item, i) => (
                  <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' }, cursor: 'pointer' }}>{item}</Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={6} sm={6} md={2}>
              <Typography sx={{ fontWeight: 700, mb: 4, fontSize: '1.1rem' }}>Legal</Typography>
              <List sx={{ p: 0 }}>
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR', 'Security'].map((item, i) => (
                  <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' }, cursor: 'pointer' }}>{item}</Typography>
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 8, borderColor: 'rgba(255,255,255,0.1)' }} />
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                © 2024 NorthCrest Bank. All rights reserved. Member FDIC. Equal Housing Lender.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', mr: 2 }}>Subscribe to our newsletter:</Typography>
                 <TextField
                   size="small"
                   placeholder={t('emailPlaceholder')}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Handle newsletter subscription
                      console.log('Subscribing email:', newsletterEmail);
                      setNewsletterEmail('');
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                    },
                    '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.5)' }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          sx={{ color: '#00BFFF' }} 
                          onClick={() => {
                            // Handle newsletter subscription
                            console.log('Subscribing email:', newsletterEmail);
                            setNewsletterEmail('');
                          }}
                        >
                          <ArrowForward />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Video Modal */}
      <Dialog
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setVideoModalOpen(false)}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              color: 'white',
              bgcolor: 'rgba(0,0,0,0.5)',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              zIndex: 10
            }}
          >
            <Close />
          </IconButton>
          <video
            controls
            autoPlay
            style={{ width: '100%', borderRadius: 8 }}
          >
            <source src="https://static.vecteezy.com/system/resources/previews/072/006/495/watermarked/downtown-raleigh-north-carolina-cityscape-on-a-sunny-day-free-video.mp4" type="video/mp4" />
          </video>
        </DialogContent>
      </Dialog>

      {/* AI Chat Widget */}
      <AIChatBot />

    </Box>
    </>
  );
};

export default Landing;