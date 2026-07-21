import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserAccounts, getWallet } from '../store/slices/accountSlice';
import { getTransactions } from '../store/slices/transactionSlice';
import { motion, useScroll, useInView, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CountUp from 'react-countup';
import { useInView as useIntersectionInView } from 'react-intersection-observer';
import {
  Grid, Paper, Typography, Box, Button, Card, CardContent, Divider, 
  CircularProgress, Avatar, Chip, LinearProgress, IconButton,
  Tooltip, Menu, MenuItem, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import {
  ArrowUpward, ArrowDownward, SwapHoriz, TrendingUp, AccountBalance, 
  Payments, MoreHoriz, Person, ShoppingCart, Restaurant, Home,
  ShowChart, AccountTree, Security, Speed, AttachMoney, CreditCard,
  ArrowForward, Notifications, Settings, HelpOutline, ChevronRight, PlayCircle,
  LocalHospital, Flight, Payment
} from '@mui/icons-material';
// Alias for icon names used in component
const ArrowUpwardIcon = ArrowUpward;
const ArrowDownwardIcon = ArrowDownward;
import { useNavigate, useLocation } from 'react-router-dom';
import NorthCrestLogo from '../components/common/NorthCrestLogo';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, 
  RadialBar, Legend
} from 'recharts';

gsap.registerPlugin(ScrollTrigger);

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, wallet, loading: accountsLoading } = useSelector(state => state.accounts);
  const { transactions, loading: transactionsLoading } = useSelector(state => state.transactions);
  const { user } = useSelector(state => state.auth);
  
  const dashboardRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { scrollYProgress } = useScroll();
  const [ref, inView] = useIntersectionInView({ threshold: 0.1 });
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('Today');

  useEffect(() => {
    // Always refetch data when navigating to dashboard to ensure fresh data
    dispatch(getUserAccounts());
    dispatch(getWallet());
    dispatch(getTransactions({ limit: 5 }));
  }, [dispatch, location.pathname]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 10,
        y: (e.clientY / window.innerHeight - 0.5) * 10
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0) + (wallet?.balance || 0);
  
  // Get recent transactions (max 5)
  const recentTransactions = transactions.slice(0, 5);
  
  // Memoize expensive transaction calculations
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const monthlyIncome = useMemo(() => 
    transactions
      .filter(tx => new Date(tx.createdAt) >= firstDayOfMonth && tx.direction === 'credit')
      .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions, firstDayOfMonth]
  );
  
  const monthlyExpenses = useMemo(() => 
    transactions
      .filter(tx => new Date(tx.createdAt) >= firstDayOfMonth && tx.direction === 'debit')
      .reduce((sum, tx) => sum + tx.amount, 0),
    [transactions, firstDayOfMonth]
  );
  
  const categorySpending = useMemo(() => {
    const spending = {};
    transactions
      .filter(tx => new Date(tx.createdAt) >= firstDayOfMonth && tx.direction === 'debit')
      .forEach(tx => {
        if (!spending[tx.category]) {
          spending[tx.category] = 0;
        }
        spending[tx.category] += tx.amount;
      });
    return spending;
  }, [transactions, firstDayOfMonth]);
  
  // Memoize processed recent transactions
  const processedRecentTransactions = useMemo(() => {
    const iconMap = {
      shopping: <ShoppingCart />,
      food: <Restaurant />,
      housing: <Home />,
      transportation: <Flight />,
      healthcare: <LocalHospital />,
      entertainment: <PlayCircle />,
      deposit: <AttachMoney />,
      transfer: <SwapHoriz />,
      other: <MoreHoriz />
    };
    
    return recentTransactions.map((tx) => {
      const amount = tx.direction === 'debit' ? -tx.amount : tx.amount;
      const date = new Date(tx.createdAt);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);
      let time = '';
      if (diffMins < 60) time = `${diffMins} min ago`;
      else if (diffHours < 24) time = `${diffHours} hours ago`;
      else time = `${diffDays} days ago`;
      
      return {
        ...tx,
        amount,
        time,
        icon: iconMap[tx.category] || <MoreHoriz />
      };
    });
  }, [recentTransactions]);
  
  // Format spending by category for pie chart
  const categoryColors = {
    food: '#0066FF',
    transportation: '#00BFFF',
    shopping: '#00C896',
    utilities: '#FFC857',
    healthcare: '#FF6B6B',
    entertainment: '#9333EA',
    other: '#6B7280'
  };
  const spendingByCategory = Object.entries(categorySpending).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    fill: categoryColors[name] || '#6B7280'
  }));

  // Calculate real monthly data for line chart (last 6 months)
  const getLast6Months = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = date;
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const monthIncome = transactions
        .filter(tx => new Date(tx.createdAt) >= monthStart && new Date(tx.createdAt) <= monthEnd && tx.direction === 'credit')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const monthExpenses = transactions
        .filter(tx => new Date(tx.createdAt) >= monthStart && new Date(tx.createdAt) <= monthEnd && tx.direction === 'debit')
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      months.push({
        name: monthNames[date.getMonth()],
        income: monthIncome,
        expenses: monthExpenses,
        savings: monthIncome - monthExpenses
      });
    }
    return months;
  };
  const monthlyData = getLast6Months();

  const realtimeStats = [
    { 
      title: 'Total Balance', 
      value: totalBalance, 
      prefix: '$', 
      icon: <AccountBalance sx={{ fontSize: 44 }} />, 
      change: '+2.4%', 
      positive: true, 
      color: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 100%)',
      glowColor: 'rgba(0,102,255,0.4)'
    },
    { 
      title: 'Monthly Income', 
      value: monthlyIncome, 
      prefix: '$', 
      icon: <AttachMoney sx={{ fontSize: 44 }} />, 
      change: monthlyIncome > 0 ? `+${((monthlyIncome - monthlyExpenses)/monthlyExpenses*100).toFixed(1)}%` : '+0%', 
      positive: true, 
      color: 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)',
      glowColor: 'rgba(0,179,255,0.4)'
    },
    { 
      title: 'Monthly Expenses', 
      value: monthlyExpenses, 
      prefix: '$', 
      icon: <Payments sx={{ fontSize: 44 }} />, 
      change: monthlyExpenses > 0 ? `-${Math.abs(((monthlyExpenses - monthlyIncome)/monthlyIncome*100)).toFixed(1)}%` : '-0%', 
      positive: monthlyExpenses < monthlyIncome, 
      color: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)',
      glowColor: 'rgba(255,107,107,0.4)'
    },
    { 
      title: 'Net Savings', 
      value: monthlyIncome - monthlyExpenses, 
      prefix: '$', 
      icon: <TrendingUp sx={{ fontSize: 44 }} />, 
      change: monthlyIncome - monthlyExpenses > 0 ? `+${((monthlyIncome - monthlyExpenses)/monthlyExpenses*100).toFixed(1)}%` : '+0%', 
      positive: (monthlyIncome - monthlyExpenses) > 0, 
      color: 'linear-gradient(135deg, #00c896 0%, #33d8b0 100%)',
      glowColor: 'rgba(0,200,150,0.4)'
    },
  ];

  const quickActions = [
    { title: 'Transfer', icon: <SwapHoriz sx={{ fontSize: 32 }} />, path: '/transfer', color: '#0066FF', description: 'Send money instantly' },
    { title: 'Deposit', icon: <ArrowDownward sx={{ fontSize: 32 }} />, path: '/transactions', color: '#00C896', description: 'Add funds to account' },
    { title: 'Pay Bills', icon: <Payments sx={{ fontSize: 32 }} />, path: '/transactions', color: '#00BFFF', description: 'Settle your bills' },
    { title: 'Invest', icon: <ShowChart sx={{ fontSize: 32 }} />, path: '/investments', color: '#FFC857', description: 'Grow your wealth' },
  ];

  const securityCards = [
    { title: 'Account Protection', status: 'Active', icon: <Security sx={{ fontSize: 28 }} />, color: '#00C896' },
    { title: '2FA Authentication', status: 'Enabled', icon: <Person sx={{ fontSize: 28 }} />, color: '#0066FF' },
    { title: 'Fraud Monitor', status: 'Active', icon: <Speed sx={{ fontSize: 28 }} />, color: '#00BFFF' },
  ];





  // Only show full-page loading if we have no data at all
  if ((accounts.length === 0 || !wallet || transactions.length === 0) && (accountsLoading && transactionsLoading)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CircularProgress size={60} sx={{ cooulor: '#0066FF' }} />
        </motion.div>
      </Box>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  
  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <Box ref={dashboardRef} sx={{ 
      position: 'relative', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      minHeight: '100vh'
    }}>
      {/* Premium ambient background effects */}
      <Box sx={{
        position: 'fixed',
        top: '-10%',
        right: '-5%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,102,255,0.12) 0%, rgba(0,102,255,0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'fixed',
        bottom: '-15%',
        left: '-10%',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,150,0.1) 0%, rgba(0,200,150,0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      {/* Scroll Progress Bar removed to reduce GPU usage */}

      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        sx={{ position: 'relative', zIndex: 1 }}
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 5 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <NorthCrestLogo />
                </Box>
                <Box>
                  <Typography variant="h3" component="h1" sx={{ 
                    mb: 1, 
                    fontWeight: 800, 
                    background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)', 
                    WebkitBackgroundClip: 'text', 
                    WebkitTextFillColor: 'transparent',
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    letterSpacing: '-0.02em'
                  }}>
                    Welcome back, {user?.firstName || 'User'}!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ 
                    fontSize: '1.15rem',
                    color: '#64748b',
                    fontWeight: 400
                  }}>
                    Here's your comprehensive financial overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: { xs: 2, md: 0 } }}>
                {['Today', 'Week', 'Month', 'Year'].map((period) => (
                  <Button
                    key={period}
                    variant={selectedTimeframe === period ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setSelectedTimeframe(period)}
                    sx={{
                      borderRadius: 2,
                      px: 3.5,
                      py: 1.2,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      background: selectedTimeframe === period ? 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)' : 'transparent',
                      borderColor: 'rgba(0,102,255,0.4)',
                      color: selectedTimeframe === period ? 'white' : '#0066ff',
                      boxShadow: selectedTimeframe === period ? '0 10px 25px -5px rgba(0,102,255,0.4)' : 'none',
                      transform: selectedTimeframe === period ? 'translateY(-1px)' : 'none',
                      '&:hover': {
                        background: selectedTimeframe === period ? 'linear-gradient(135deg, #0052cc 0%, #0099cc 100%)' : 'rgba(0,102,255,0.06)',
                        borderColor: selectedTimeframe === period ? 'inherit' : 'rgba(0,102,255,0.6)',
                        transform: 'translateY(-2px)',
                        boxShadow: selectedTimeframe === period ? '0 12px 30px -5px rgba(0,102,255,0.5)' : '0 4px 12px rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    {period}
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        </motion.div>

        {/* Main Stats Cards */}
        <motion.div variants={itemVariants}>
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 5 }}>
            {realtimeStats.map((stat, index) => (
              <Grid item xs={12} sm={6} lg={3} key={stat.title}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 2, sm: 3, md: 4 },
                      height: '100%',
                      background: stat.color,
                      color: 'white',
                      borderRadius: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: `0 15px 35px -8px ${stat.glowColor}, 0 10px 25px rgba(0,0,0,0.15)`,
                      transform: 'translateZ(0)',
                      transition: 'all 0.2s ease',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 220,
                        height: 220,
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '50%',
                        filter: 'blur(20px)'
                      }
                    }}
                  >
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                        <Box sx={{ opacity: 0.9 }}>{stat.icon}</Box>
                        <Chip
                          label={stat.change}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontWeight: 600,
                            backdropFilter: 'blur(10px)'
                          }}
                          icon={stat.positive ? <ArrowUpwardIcon sx={{ color: '#00ff88 !important', fontSize: '0.9rem' }} /> : <ArrowDownwardIcon sx={{ color: '#ff6b6b !important', fontSize: '0.9rem' }} />}
                        />
                      </Box>
                      <Typography variant="body1" sx={{ mb: 1, opacity: 0.8 }}>{stat.title}</Typography>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {inView && (
                          <CountUp
                            start={0}
                            end={stat.value}
                            duration={2.5}
                            prefix={stat.prefix}
                            separator=","
                            decimals={2}
                          />
                        )}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                        <LinearProgress
                          variant="determinate"
                          value={78}
                          sx={{
                            flexGrow: 1,
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.2)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 'white',
                              borderRadius: 3
                            }
                          }}
                        />
                        <Typography variant="caption" sx={{ ml: 2, opacity: 0.8 }}>78%</Typography>
                      </Box>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3, md: 4 },
              mb: 5,
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(30px)',
              borderRadius: 2,
              border: '1px solid rgba(15,39,68,0.08)',
              boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h5" sx={{ 
              mb: { xs: 2, sm: 3, md: 4 }, 
              fontWeight: 700, 
              background: 'linear-gradient(135deg, #0f2744 0%, #0066ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>Quick Actions</Typography>
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {quickActions.map((action, index) => (
                <Grid item xs={12} sm={6} key={action.title}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      elevation={0}
                      onClick={() => navigate(action.path)}
                      sx={{
                        cursor: 'pointer',
                        p: { xs: 2, sm: 3, md: 4 },
                        height: '100%',
                        background: 'white',
                        borderRadius: 3,
                        border: '1px solid rgba(0,0,0,0.05)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: `0 20px 40px ${action.color}25`,
                          borderColor: `${action.color}50`
                        }
                      }}
                    >
                      <Box sx={{ color: action.color, mb: 2 }}>{action.icon}</Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{action.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{action.description}</Typography>
                      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', color: action.color }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Get Started</Typography>
                        <ChevronRight sx={{ fontSize: 18, ml: 0.5 }} />
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </motion.div>

        {/* Charts Section */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 5 }}>
          <Grid item xs={12} lg={8}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 5 },
                  height: '100%',
                  background: 'rgba(255,255,255,0.75)',
                  backdropFilter: 'blur(30px)',
                  borderRadius: 5,
                  border: '1px solid rgba(15,39,68,0.08)',
                  boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                  <Box>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      background: 'linear-gradient(135deg, #0f2744 0%, #0066ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}>Financial Overview</Typography>
                    <Typography variant="body2" color="text.secondary">Track your income, expenses, and savings over time</Typography>
                  </Box>
                  <IconButton sx={{ 
                    background: 'rgba(0,102,255,0.05)',
                    '&:hover': {
                      background: 'rgba(0,102,255,0.1)'
                    }
                  }}>
                    <MoreHoriz />
                  </IconButton>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C896" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00C896" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B6B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF6B6B" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0066FF" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 12,
                        border: '1px solid rgba(0,102,255,0.2)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area type="monotone" dataKey="income" stroke="#00C896" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expenses" stroke="#FF6B6B" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                    <Area type="monotone" dataKey="savings" stroke="#0066FF" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={4}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 5 },
                  mb: 4,
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 2,
                  border: '1px solid rgba(0,102,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#021024', mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>Account Summary</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Your accounts and balances</Typography>
                <Box sx={{ mt: 2 }}>
                  {accounts.map((account, index) => (
                    <Box key={account._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: index < accounts.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: index === 0 ? '#0066FF' : index === 1 ? '#00BFFF' : '#00C896', mr: 2 }} />
                        <Typography variant="body2">{account.nickname || `${account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account`}</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>${account.balance.toLocaleString()}</Typography>
                    </Box>
                  ))}
                  {/* Add wallet balance */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFC857', mr: 2 }} />
                      <Typography variant="body2">Digital Wallet</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>${(wallet?.balance || 0).toLocaleString()}</Typography>
                  </Box>
                </Box>
              </Paper>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, sm: 5 },
                  background: 'linear-gradient(135deg, #021024 0%, #063970 100%)',
                  color: 'white',
                  borderRadius: 4,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Security Status</Typography>
                  <Grid container spacing={2}>
                    {securityCards.map((security) => (
                      <Grid item xs={12} key={security.title}>
                        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, backdropFilter: 'blur(10px)' }}>
                          <Box sx={{ color: security.color, mr: 2 }}>{security.icon}</Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{security.title}</Typography>
                          </Box>
                          <Chip
                            label={security.status}
                            size="small"
                            sx={{ bgcolor: 'rgba(0,200,150,0.2)', color: '#00ff88', fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Live Transactions & Spending */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} sx={{ mb: 5 }}>
          <Grid item xs={12} lg={7}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  border: '1px solid rgba(0,102,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#021024', mb: 1 }}>Live Transactions</Typography>
                    <Typography variant="body2" color="text.secondary">Your recent financial activity</Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForward />}
                    onClick={() => navigate('/transactions')}
                    sx={{
                      borderRadius: 2,
                      borderColor: '#0066FF',
                      color: '#0066FF',
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: '#0052cc',
                        background: 'rgba(0,102,255,0.05)'
                      }
                    }}
                  >
                    View All
                  </Button>
                </Box>
                <List>
                  {processedRecentTransactions.map((tx, index) => {
                    const icon = tx.icon;
                    
                    return (
                      <motion.div
                        key={tx._id}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ListItem
                          sx={{
                            px: 0,
                            py: 2,
                            borderBottom: index < processedRecentTransactions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tx.description)}&background=0066FF&color=fff&size=100`} sx={{ width: 50, height: 50 }}>
                              {icon}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>{tx.description}</Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="text.secondary">{tx.category.charAt(0).toUpperCase() + tx.category.slice(1)} • {time}</Typography>
                            }
                          />
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: amount > 0 ? '#00C896' : '#FF6B6B'
                            }}
                          >
                            {amount > 0 ? '+' : ''}${amount.toFixed(2)}
                          </Typography>
                        </ListItem>
                      </motion.div>
                    );
                  })}
                </List>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} lg={5}>
            <motion.div variants={itemVariants}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  height: '100%',
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: 4,
                  border: '1px solid rgba(0,102,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#021024', mb: 1 }}>Spending by Category</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>Where your money goes this month</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="90%"
                    data={spendingByCategory}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar
                      label={{ fill: '#333', position: 'insideStart' }}
                      background={{ fill: '#eee' }}
                      dataKey="value"
                      cornerRadius={10}
                    />
                    <Legend iconSize={10} width={120} height={140} layout="vertical" verticalAlign="middle" align="right" />
                    <RechartsTooltip />
                  </RadialBarChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 3 }}>
                  {spendingByCategory.map((category, index) => (
                    <Box key={category.name} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{category.name}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{category.value}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={category.value}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'rgba(0,0,0,0.05)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: category.fill,
                            borderRadius: 4
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Your Accounts Cards */}
        <motion.div variants={itemVariants}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(20px)',
              borderRadius: 4,
              border: '1px solid rgba(0,102,255,0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600, color: '#021024', mb: 1 }}>Your Accounts</Typography>
                <Typography variant="body2" color="text.secondary">Manage all your connected accounts</Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => navigate('/accounts')}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0052cc 0%, #0099cc 100%)'
                  }
                }}
              >
                Manage Accounts
              </Button>
            </Box>
            <Grid container spacing={4}>
              {accounts.map((account, index) => (
                <Grid item xs={12} md={6} key={account._id}>
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box
                      sx={{
                        p: 4,
                        background: index % 2 === 0 
                          ? 'linear-gradient(135deg, #021024 0%, #063970 100%)' 
                          : 'linear-gradient(135deg, #063970 0%, #0066FF 100%)',
                        color: 'white',
                        borderRadius: 4,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>{account.nickname}</Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                              ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Typography>
                          </Box>
                          <CreditCard sx={{ fontSize: 40, opacity: 0.5 }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ opacity: 0.7, letterSpacing: 2 }}>
                            **** **** **** {account.accountNumber?.slice(-4) || '0000'}
                          </Typography>
                          <Chip
                            label={account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </motion.div>
      </motion.div>
    </Box>
  );
};

export default Dashboard;