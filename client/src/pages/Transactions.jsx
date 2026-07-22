import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Grid, Chip, Avatar, Divider, TextField, MenuItem, InputAdornment, CircularProgress, Alert } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchTransactions } from '../store/slices/transactionSlice';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  Search, FilterList, TrendingUp, TrendingDown, CreditCard,
  ShoppingCart, Restaurant, Home, Flight, LocalHospital,
  MoreHoriz, GetApp, PictureAsPdf, ArrowUpward, ArrowDownward,
  Payment, AccountBalance
} from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import PremiumCard from '../components/PremiumCard';
import PremiumStatCard from '../components/PremiumStatCard';
import PremiumButton from '../components/PremiumButton';

const Transactions = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { transactions, loading } = useSelector((state) => state.transactions);
  const [ref, inView] = useInView({ threshold: 0.1 });
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch, location.pathname]);

  const totalIncome = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netSavings = totalIncome - totalExpenses;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentDate = new Date();
  const monthlyData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate.getMonth() === date.getMonth() && transactionDate.getFullYear() === date.getFullYear();
    });
    
    const income = monthTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
    
    monthlyData.push({
      name: monthNames[date.getMonth()],
      income,
      expenses
    });
  }

  const categorySpending = {};
  transactions.filter(t => t.type === 'debit').forEach(t => {
    const category = t.category || 'Other';
    if (!categorySpending[category]) {
      categorySpending[category] = 0;
    }
    categorySpending[category] += t.amount;
  });

  const categoryColors = {
    Shopping: '#0066FF',
    'Food & Dining': '#00BFFF',
    Housing: '#00C896',
    Transport: '#FFC857',
    Healthcare: '#FF6B6B',
    Other: '#808080'
  };

  const categoryData = Object.entries(categorySpending).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || categoryColors.Other
  }));

  const categoryIcons = {
    shopping: <ShoppingCart />,
    food: <Restaurant />,
    housing: <Home />,
    travel: <Flight />,
    healthcare: <LocalHospital />,
    default: <Payment />
  };

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
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || transaction.type === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return null;

  return (
    <motion.div
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ minHeight: '100vh' }}
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants}>
        <Box sx={{ 
          mb: 6, 
          p: { xs: 3, md: 5 }, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,102,255,0.3)'
        }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Transaction History
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Track, analyze, and manage all your financial transactions
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ArrowUpward sx={{ fontSize: 20, mr: 1, color: '#00C896' }} />
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Income</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {inView && (
                      <CountUp
                        start={0}
                        end={totalIncome}
                        duration={2.5}
                        prefix="$"
                        separator=","
                        decimals={2}
                      />
                    )}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ArrowDownward sx={{ fontSize: 20, mr: 1, color: '#FF6B6B' }} />
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Expenses</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {inView && (
                      <CountUp
                        start={0}
                        end={totalExpenses}
                        duration={2.5}
                        prefix="$"
                        separator=","
                        decimals={2}
                      />
                    )}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ 
                  p: 3, 
                  bgcolor: 'rgba(255,255,255,0.15)', 
                  borderRadius: 3,
                  backdropFilter: 'blur(10px)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp sx={{ fontSize: 20, mr: 1, color: '#FFC857' }} />
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Net Savings</Typography>
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {inView && (
                      <CountUp
                        start={0}
                        end={netSavings}
                        duration={2.5}
                        prefix="$"
                        separator=","
                        decimals={2}
                      />
                    )}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: { xs: 'none', md: 'block' }
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -80,
          right: 100,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          display: { xs: 'none', md: 'block' }
        }} />
        </Box>
      </motion.div>

      {/* Charts Section */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} lg={8}>
          <motion.div variants={itemVariants}>
            <PremiumCard title="Income vs Expenses" subtitle="Monthly financial overview">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <RechartsTooltip 
                    contentStyle={{ 
                      borderRadius: 8, 
                      border: 'none',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="income" 
                    stackId="1"
                    stroke="#00C896" 
                    fill="#00C896" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stackId="2"
                    stroke="#FF6B6B" 
                    fill="#FF6B6B" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </PremiumCard>
          </motion.div>
        </Grid>
        <Grid item xs={12} lg={4}>
          <motion.div variants={itemVariants}>
            <PremiumCard title="Spending by Category" sx={{ height: '100%' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {categoryData.map((cat, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: cat.color,
                      mr: 2
                    }} />
                    <Typography variant="body2" sx={{ flex: 1 }}>{cat.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>${cat.value}</Typography>
                  </Box>
                ))}
              </Box>
            </PremiumCard>
          </motion.div>
        </Grid>
      </Grid>

      {/* Transactions List */}
      <motion.div variants={itemVariants} ref={ref}>
        <PremiumCard>
          {/* Filters */}
          <Box sx={{ 
            p: { xs: 2, md: 4 }, 
            bgcolor: '#fafafa', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Search transactions..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#999' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 300 }}
              />
              <TextField
                select
                size="small"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                sx={{ minWidth: 150 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterList sx={{ color: '#999' }} />
                    </InputAdornment>
                  ),
                }}
              >
                <MenuItem value="all">All Transactions</MenuItem>
                <MenuItem value="credit">Income Only</MenuItem>
                <MenuItem value="debit">Expenses Only</MenuItem>
              </TextField>
            </Box>
            <PremiumButton variant="outline" startIcon={<PictureAsPdf />}>
              Export PDF
            </PremiumButton>
          </Box>

          {/* Transactions List */}
          <Box sx={{ p: 0 }}>
            {filteredTransactions.length === 0 ? (
              <Box sx={{ p: 8, textAlign: 'center' }}>
                <CreditCard sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#666' }}>No transactions found</Typography>
              </Box>
            ) : (
              filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  variants={itemVariants}
                  whileHover={{ bgcolor: 'rgba(0,102,255,0.02)' }}
                  transition={{ duration: 0.2 }}
                >
                  <Box sx={{ 
                    p: 3, 
                    borderBottom: index < filteredTransactions.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    <Avatar sx={{ 
                      bgcolor: transaction.type === 'credit' ? 'rgba(0,200,150,0.1)' : 'rgba(255,107,107,0.1)',
                      color: transaction.type === 'credit' ? '#00C896' : '#FF6B6B',
                      width: 48,
                      height: 48
                    }}>
                      {transaction.type === 'credit' ? <ArrowUpward /> : <ArrowDownward />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {transaction.description}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#666' }}>
                        {new Date(transaction.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700,
                        color: transaction.type === 'credit' ? '#00C896' : '#FF6B6B',
                        mb: 0.5
                      }}>
                        {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toLocaleString()}
                      </Typography>
                      <Chip 
                        label={transaction.status}
                        size="small"
                        sx={{ 
                          bgcolor: transaction.status === 'Completed' ? 'rgba(0,200,150,0.1)' : 'rgba(255,200,87,0.1)',
                          color: transaction.status === 'Completed' ? '#00C896' : '#FFC857',
                          fontWeight: 600
                        }}
                      />
                    </Box>
                    <IconButton>
                      <MoreHoriz sx={{ color: '#999' }} />
                    </IconButton>
                  </Box>
                </motion.div>
              ))
            )}
          </Box>

          {/* Load More */}
          {filteredTransactions.length > 0 && (
            <Box sx={{ p: 3, textAlign: 'center', borderTop: '1px solid #f0f0f0' }}>
              <PremiumButton variant="primary" size="large">
                Load More Transactions
              </PremiumButton>
            </Box>
          )}
        </PremiumCard>
      </motion.div>
    </motion.div>
  );
};

export default Transactions;
