import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAccounts } from '../store/slices/accountSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useInView as useIntersectionInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  Box, Typography, Grid, Avatar, Chip, Divider, IconButton, Tooltip
} from '@mui/material';
import {
  CreditCard, AttachMoney, ArrowForward, Visibility, VisibilityOff, SwapHoriz,
  TrendingUp, Security, MonitorHeart, Person, Settings
} from '@mui/icons-material';
import PremiumCard from '../components/PremiumCard';
import PremiumStatCard from '../components/PremiumStatCard';
import PremiumButton from '../components/PremiumButton';

const Accounts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, loading } = useSelector((state) => state.accounts);
  const [ref, inView] = useIntersectionInView({ threshold: 0.1 });
  const containerRef = useRef(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [revealedAccount, setRevealedAccount] = useState(null);
  
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  const accountIcons = {
    checking: <CreditCard sx={{ fontSize: 40 }} />,
    savings: <TrendingUp sx={{ fontSize: 40 }} />,
    investment: <MonitorHeart sx={{ fontSize: 40 }} />,
    default: <AttachMoney sx={{ fontSize: 40 }} />
  };

  const accountGradients = {
    checking: 'linear-gradient(135deg, #021024 0%, #063970 100%)',
    savings: 'linear-gradient(135deg, #063970 0%, #0066FF 100%)',
    investment: 'linear-gradient(135deg, #00C896 0%, #00BFFF 100%)',
    default: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
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

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch, location.pathname]);

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
              My Accounts
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              View and manage all your bank accounts in one place
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Balance Across All Accounts</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {inView && (
                    hideBalance ? '••••••••' : (
                      <CountUp
                        start={0}
                        end={totalBalance}
                        duration={2.5}
                        prefix="$"
                        separator=","
                        decimals={2}
                      />
                    )
                  )}
                </Typography>
              </Box>
              <Tooltip title={hideBalance ? 'Show balance' : 'Hide balance'}>
                <IconButton 
                  onClick={() => setHideBalance(!hideBalance)}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.15)', 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  {hideBalance ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
              <Chip 
                label="All Accounts Secure" 
                icon={<Security sx={{ color: 'inherit' }} />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  backdropFilter: 'blur(10px)'
                }} 
              />
            </Box>
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

      {/* Accounts Grid */}
      <Grid container spacing={4} ref={ref}>
         {accounts.map((account, index) => (
           <Grid item xs={12} md={6} key={account._id}>
            <motion.div variants={itemVariants}>
              <PremiumCard
                sx={{
                  p: 0,
                  overflow: 'hidden',
                  background: accountGradients[account.type?.toLowerCase()] || accountGradients.default,
                }}
              >
                <Box sx={{ p: 4, position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{
                    position: 'absolute',
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                  }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, position: 'relative', zIndex: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: 'white', 
                        width: 56, 
                        height: 56,
                        mr: 3
                      }}>
                        {accountIcons[account.type?.toLowerCase()] || accountIcons.default}
                      </Avatar>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: 'white' }}>
                          {account.type} Account
                        </Typography>
                         <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
                          {revealedAccount === account._id ? account.accountNumber : `****${account.accountNumber.slice(-4)}`}
                        </Typography>
                      </Box>
                    </Box>
                     <Tooltip title="Account Details">
                       <IconButton 
                         sx={{ color: 'white' }}
                         onClick={() => setRevealedAccount(revealedAccount === account._id ? null : account._id)}
                       >
                         {revealedAccount === account._id ? <VisibilityOff /> : <Visibility />}
                       </IconButton>
                     </Tooltip>
                  </Box>
                  
                  <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.2)' }} />
                  
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 2 }}>
                     <Box>
                       <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, color: 'white' }}>Current Balance</Typography>
                       <Typography variant="h3" sx={{ fontWeight: 800, color: 'white' }}>
                         {inView && (
                           hideBalance ? '••••••••' : (
                             <CountUp
                               start={0}
                               end={account.balance}
                               duration={2.5}
                               prefix="$"
                               separator=","
                               decimals={2}
                               delay={index * 0.2}
                             />
                           )
                         )}
                       </Typography>
                     </Box>
                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                       <Tooltip title={hideBalance ? 'Show balance' : 'Hide balance'}>
                         <IconButton 
                           size="small"
                           onClick={() => setHideBalance(!hideBalance)}
                           sx={{ 
                             color: 'white',
                             bgcolor: 'rgba(255,255,255,0.15)',
                             '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                           }}
                         >
                           {hideBalance ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                         </IconButton>
                       </Tooltip>
                       <Chip 
                         label="Active" 
                         size="small"
                         sx={{ 
                           bgcolor: 'rgba(0,200,150,0.9)', 
                           color: 'white',
                           fontWeight: 600
                         }} 
                       />
                     </Box>
                   </Box>
                </Box>
                <Box sx={{ p: 3, bgcolor: 'white' }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <PremiumButton 
                      variant="primary"
                      startIcon={<SwapHoriz />}
                      onClick={() => navigate('/transfer')}
                      sx={{ flex: 1 }}
                    >
                      Transfer Money
                    </PremiumButton>
                     <PremiumButton 
                       variant="outline"
                       endIcon={revealedAccount === account._id ? <VisibilityOff /> : <ArrowForward />}
                       onClick={() => setRevealedAccount(revealedAccount === account._id ? null : account._id)}
                       sx={{ px: 4 }}
                     >
                       {revealedAccount === account._id ? 'Hide Details' : 'Details'}
                     </PremiumButton>
                  </Box>
                </Box>
              </PremiumCard>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions Section */}
      <motion.div variants={itemVariants}>
        <Box sx={{ mt: 8, mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {[
              { title: 'Transfer Money', icon: <SwapHoriz sx={{ fontSize: 32 }} />, color: '#0066FF', path: '/transfer' },
              { title: 'View Transactions', icon: <CreditCard sx={{ fontSize: 32 }} />, color: '#00C896', path: '/transactions' },
              { title: 'Add Beneficiary', icon: <Person sx={{ fontSize: 32 }} />, color: '#00BFFF', path: '/beneficiaries' },
              { title: 'Account Settings', icon: <Settings sx={{ fontSize: 32 }} />, color: '#FFC857', path: '/settings' },
            ].map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <PremiumCard
                    onClick={() => navigate(action.path)}
                    sx={{ 
                      textAlign: 'center', 
                      cursor: 'pointer',
                      '&:hover': { borderColor: action.color }
                    }}
                    action={action.icon}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {action.title}
                    </Typography>
                  </PremiumCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </motion.div>
    </motion.div>
  );
};

export default Accounts;
