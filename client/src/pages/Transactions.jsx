import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography, Grid, Chip, Avatar, Divider, TextField, MenuItem, InputAdornment, CircularProgress, Alert, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { fetchTransactions, getTransactionById } from '../store/slices/transactionSlice';
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
import NorthCrestLogo from '../components/common/NorthCrestLogo';

const Transactions = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { transactions, loading, error } = useSelector((state) => state.transactions);
  const [ref, inView] = useInView({ threshold: 0.1 });
  const containerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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
    'Food & Dining': '#FF6B6B',
    Housing: '#00C896',
    Transport: '#FFC857',
    Healthcare: '#9333EA',
    Entertainment: '#FF4081',
    Utilities: '#00BFFF',
    Education: '#FF9800',
    Travel: '#00E5FF',
    Other: '#78909C'
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

  const handleTransactionClick = async (transaction) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const result = await dispatch(getTransactionById(transaction._id || transaction.id)).unwrap();
      setSelectedTransaction(result);
    } catch (err) {
      setSelectedTransaction(transaction);
    } finally {
      setDetailLoading(false);
    }
  };

  const downloadTransactionReceipt = (tx) => {
    const receipt = {
      transactionId: tx.transactionId || tx._id,
      date: new Date(tx.createdAt).toLocaleString(),
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      description: tx.description,
      reference: tx.reference,
      sender: tx.sender,
      recipient: tx.recipient
    };

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const width = 720;
    const padding = 36;
    const contentWidth = width - padding * 2;
    let y = padding;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, 1200);

    ctx.fillStyle = '#0f2744';
    ctx.fillRect(0, 0, width, 110);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NORTHCREST BANK OF USA', width / 2, 52);

    ctx.font = '18px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    ctx.fillStyle = '#e5f2ff';
    ctx.fillText('Transaction Receipt', width / 2, 88);

    y = 150;

    const drawRow = (label, value, highlight = false) => {
      if (y > 1120) return;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(label, padding, y);

      ctx.fillStyle = highlight ? '#0066FF' : '#334155';
      ctx.font = `${highlight ? 'bold' : 'normal'} 18px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif`;
      ctx.textAlign = 'right';
      const text = String(value ?? 'N/A');
      ctx.fillText(text, padding + contentWidth, y);

      y += 46;
    };

    const drawDivider = () => {
      if (y > 1120) return;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + contentWidth, y);
      ctx.stroke();
      y += 24;
    };

    drawRow('Transaction ID', receipt.transactionId);
    drawDivider();
    drawRow('Date', receipt.date);
    drawDivider();
    drawRow('Type', String(receipt.type).toUpperCase());
    drawDivider();
    drawRow('Amount', `$${parseFloat(receipt.amount).toLocaleString()}`, true);
    drawDivider();
    drawRow('Status', String(receipt.status));
    drawDivider();
    drawRow('Description', String(receipt.description));
    drawDivider();
    if (receipt.reference) {
      drawRow('Reference', String(receipt.reference));
      drawDivider();
    }
    if (receipt.sender?.user) {
      drawRow('Sender', String(receipt.sender.user));
      drawDivider();
    }
    if (receipt.recipient?.name) {
      drawRow('Recipient', String(receipt.recipient.name));
      drawDivider();
    }

    ctx.fillStyle = '#0f2744';
    ctx.fillRect(0, 1140, width, 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Keep this receipt for your records.', width / 2, 1176);

    canvas.width = width;
    canvas.height = 1200;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transaction-${receipt.transactionId || 'receipt'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
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

  if (loading) {
    return (
      <Box sx={{ 
        style: { minHeight: '100vh' }, 
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <NorthCrestLogo variant="full" color="#0066FF" />
        <CircularProgress sx={{ color: '#0066FF' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => dispatch(fetchTransactions())}>Retry</Button>
      </Box>
    );
  }

  return (
    <motion.div
      ref={containerRef}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}
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
            <Typography variant="h3" sx={{ 
              fontWeight: 800, 
              background: 'linear-gradient(90deg, #ffffff 0%, #00c896 30%, #00bfff 70%, #ffc857 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}>
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
            <PremiumCard title="Spending by Category" sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,247,255,0.9) 100%)' }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                position: 'relative',
                mb: 2
              }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        background: 'rgba(255,255,255,0.98)',
                        padding: '10px 14px'
                      }}
                      formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'block', mb: 0.5 }}>Total</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f2744' }}>
                    ${categoryData.reduce((sum, cat) => sum + cat.value, 0).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                background: 'rgba(0,0,0,0.02)', 
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.04)'
              }}>
                {categoryData.map((cat, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: index < categoryData.length - 1 ? 1.5 : 0,
                      p: 1.5,
                      borderRadius: 2,
                      background: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(0,0,0,0.03)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.9)',
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <Box sx={{ 
                      width: 14, 
                      height: 14, 
                      borderRadius: '50%', 
                      bgcolor: cat.color,
                      mr: 2,
                      boxShadow: `0 0 10px ${cat.color}50`,
                      border: `2px solid ${cat.color}30`
                    }} />
                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 600, color: '#0f2744' }}>{cat.name}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: cat.color }}>
                      ${cat.value.toLocaleString()}
                    </Typography>
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
              <Box sx={{ p: 8, textAlign: 'center', borderRadius: 3 }}>
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
                  <Box 
                    sx={{ 
                      p: 3, 
                      borderBottom: index < filteredTransactions.length - 1 ? '1px solid #f0f0f0' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleTransactionClick(transaction)}
                  >
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
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', { 
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
            <Box sx={{ p: 3, textAlign: 'center', borderTop: '1px solid #f0f0f0', borderRadius: 3 }}>
              <PremiumButton variant="primary" size="large">
                Load More Transactions
              </PremiumButton>
            </Box>
          )}
        </PremiumCard>

        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)', color: 'white' }}>
            Transaction Details
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {detailLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#0066FF' }} />
              </Box>
            ) : selectedTransaction ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Transaction ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTransaction.transactionId || selectedTransaction._id}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Date</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{new Date(selectedTransaction.createdAt).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedTransaction.type}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Amount</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>${parseFloat(selectedTransaction.amount).toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip label={selectedTransaction.status} size="small" color={selectedTransaction.status === 'Completed' ? 'success' : 'warning'} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Description</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{selectedTransaction.description}</Typography>
                </Box>
                {selectedTransaction.reference && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Reference</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{String(selectedTransaction.reference)}</Typography>
                  </Box>
                )}
                {selectedTransaction.sender && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Sender</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedTransaction.sender.user || 'N/A'}</Typography>
                  </Box>
                )}
                {selectedTransaction.recipient && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Recipient</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{selectedTransaction.recipient.name || 'N/A'}</Typography>
                  </Box>
                )}
                {selectedTransaction.metadata && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Details</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{JSON.stringify(selectedTransaction.metadata)}</Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography>No transaction details available.</Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
            {selectedTransaction && (
              <Button
                variant="contained"
                startIcon={<GetApp />}
                onClick={() => downloadTransactionReceipt(selectedTransaction)}
                sx={{
                  background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                  boxShadow: '0 8px 24px rgba(0, 102, 255, 0.35)',
                }}
              >
                Download Transaction
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </motion.div>
    </motion.div>
  );
};

export default Transactions;

