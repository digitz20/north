import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  Box, Typography, Grid, Avatar, Chip, Divider, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, CircularProgress, Alert, InputAdornment, Paper
} from '@mui/material';
import {
  CreditCard, Add, Visibility, VisibilityOff, Lock, Delete, Refresh, Security,
  Payment, ConfirmationNumber, CardGiftcard, ArrowForward, Person
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserCards, createCard, freezeCard, unfreezeCard, deleteCard } from '../store/slices/cardSlice';
import PremiumCard from '../components/PremiumCard';
import PremiumStatCard from '../components/PremiumStatCard';
import PremiumButton from '../components/PremiumButton';
import NorthCrestLogo from '../components/common/NorthCrestLogo';

const Cards = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { cards, loading, error } = useSelector(state => state.cards);
  const { user } = useSelector(state => state.auth);
  const [open, setOpen] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.1 });
  const containerRef = useRef(null);
  const [flippedCard, setFlippedCard] = useState(null);
  const [detailsHidden, setDetailsHidden] = useState({});
  const [newCardData, setNewCardData] = useState({
    accountId: '',
    cardType: 'debit',
    cardNetwork: 'visa',
    cardholderName: '',
    billingAddress: {},
    creditLimit: ''
  });

  const { accounts } = useSelector(state => state.accounts);
  
  useEffect(() => {
    if (accounts.length > 0 && !newCardData.accountId) {
      setNewCardData(prev => ({ ...prev, accountId: accounts[0]._id }));
    }
  }, [accounts, newCardData.accountId]);

  useEffect(() => {
    dispatch(getUserCards());
  }, [dispatch, location.pathname]);

  const handleCreateCard = async () => {
    if (!newCardData.accountId || !newCardData.cardType || !newCardData.cardNetwork || !newCardData.cardholderName) {
      console.error('Failed to create card: Please fill in all required fields');
      return;
    }
    try {
      await dispatch(createCard(newCardData)).unwrap();
      setOpen(false);
      setNewCardData({ accountId: accounts[0]?._id || '', cardType: 'debit', cardNetwork: 'visa', cardholderName: '', billingAddress: {}, creditLimit: '' });
    } catch (err) {
      console.error('Failed to create card:', err);
    }
  };

  const handleToggleFreezeCard = async (id, isCurrentlyFrozen) => {
    try {
      if (isCurrentlyFrozen) {
        await dispatch(unfreezeCard(id)).unwrap();
      } else {
        await dispatch(freezeCard(id)).unwrap();
      }
    } catch (err) {
      console.error('Failed to toggle card freeze status:', err);
    }
  };

  const handleDeleteCard = async (id) => {
    try {
      await dispatch(deleteCard(id)).unwrap();
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  };

  const cardActions = [
    { 
      title: 'Request New Card', 
      icon: <Add sx={{ fontSize: 28 }} />, 
      color: '#0066FF', 
      gradient: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
      bgColor: 'rgba(0,102,255,0.08)',
      borderColor: 'rgba(0,102,255,0.2)',
      action: () => setOpen(true) 
    },
    { 
      title: 'Card Settings', 
      icon: <Security sx={{ fontSize: 28 }} />, 
      color: '#9333EA', 
      gradient: 'linear-gradient(135deg, #9333EA 0%, #E040FB 100%)',
      bgColor: 'rgba(147,51,234,0.08)',
      borderColor: 'rgba(147,51,234,0.2)',
      action: () => navigate('/settings') 
    },
    { 
      title: 'Freeze Cards', 
      icon: <Lock sx={{ fontSize: 28 }} />, 
      color: '#FF6B6B', 
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #ff8e8e 100%)',
      bgColor: 'rgba(255,107,107,0.08)',
      borderColor: 'rgba(255,107,107,0.2)',
      action: () => {}
    },
    { 
      title: 'Card Support', 
      icon: <CreditCard sx={{ fontSize: 28 }} />, 
      color: '#00C896', 
      gradient: 'linear-gradient(135deg, #00C896 0%, #33d8b0 100%)',
      bgColor: 'rgba(0,200,150,0.08)',
      borderColor: 'rgba(0,200,150,0.2)',
      action: () => {}
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
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

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const totalSpending = cards.reduce((sum, card) => sum + (card.balance || 0), 0);
  const totalLimit = cards.reduce((sum, card) => sum + (card.limit || 0), 0);

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
          background: 'linear-gradient(135deg, #00C896 0%, #00BFFF 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,200,150,0.3)'
        }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3}>
              <Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 800, 
                  color: '#0066FF',
                  mb: 2
                }}>
                  My Cards
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                  Manage all your payment cards in one secure dashboard
                </Typography>
              </Box>
              <PremiumButton
                variant="primary"
                startIcon={<Add />}
                onClick={handleClickOpen}
                sx={{ bgcolor: 'white', color: '#0066FF', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              >
                Request New Card
              </PremiumButton>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, mt: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Available Balance</Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {inView && (
                    <CountUp
                      start={0}
                      end={totalSpending}
                      duration={2.5}
                      prefix="$"
                      separator=","
                      decimals={2}
                    />
                  )}
                </Typography>
              </Box>
              {totalLimit > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Credit Limit</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {inView && (
                      <CountUp
                        start={0}
                        end={totalLimit}
                        duration={2.5}
                        prefix="$"
                        separator=","
                        decimals={2}
                      />
                    )}
                  </Typography>
                </Box>
              )}
              <Chip 
                label={`${cards.length} Active Cards`} 
                icon={<Payment sx={{ color: 'inherit' }} />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  fontSize: '1rem',
                  py: 2
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

      {/* Error State */}
      {error && (
        <motion.div variants={itemVariants}>
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: 2 }}>
          <NorthCrestLogo variant="full" color="#0066FF" />
          <CircularProgress size={60} sx={{ color: '#0066FF' }} />
        </Box>
      )}

      {/* Cards Grid - only show when not loading */}
      {!loading && (
        <Grid container spacing={4} ref={ref}>
          {cards.length === 0 ? (
            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 6,
                    textAlign: 'center',
                    borderRadius: 5,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,247,255,0.85) 100%)',
                    backdropFilter: 'blur(30px)',
                    border: '1px solid rgba(0,102,255,0.1)',
                    boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)'
                  }}
                >
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      mb: 3,
                      boxShadow: '0 15px 35px -8px rgba(0,102,255,0.4)'
                    }}
                  >
                    <CreditCard sx={{ fontSize: 50, color: 'white' }} />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#0f2744' }}>No cards found</Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: '#64748b', maxWidth: 400, margin: '0 auto 24px' }}>You don't have any cards yet. Request your first card to get started with secure payments!</Typography>
                  <PremiumButton variant="primary" startIcon={<Add />} onClick={handleClickOpen} sx={{ px: 4, py: 1.5, borderRadius: 3 }}>
                    Request Your First Card
                  </PremiumButton>
                </Paper>
              </motion.div>
            </Grid>
          ) : (
            cards.map((card, index) => (
              <Grid item xs={12} md={6} key={card.id}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                  style={{ perspective: 1000 }}
                >
                  <Box
                    onClick={() => setFlippedCard(flippedCard === card.id ? null : card.id)}
                    sx={{
                      cursor: 'pointer',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.8s',
                      transform: flippedCard === card.id ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* Card Front */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 0,
                        height: 340,
                        borderRadius: 5,
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset',
                        backfaceVisibility: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <Box sx={{ 
                        height: '100%',
                        p: 4, 
                        background: card.gradient,
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          position: 'absolute',
                          top: -60,
                          right: -60,
                          width: 220,
                          height: 220,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.12)',
                        }} />
                        <Box sx={{
                          position: 'absolute',
                          bottom: -80,
                          left: -80,
                          width: 240,
                          height: 240,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.08)',
                        }} />
                        <Box sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 300,
                          height: 300,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.03)',
                        }} />
                        
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {card.type}
                              </Typography>
                              <Chip 
                                label={card.status} 
                                size="small"
                                sx={{ 
                                  bgcolor: card.status === 'Active' ? 'rgba(0,200,150,0.9)' : 'rgba(255,107,107,0.9)', 
                                  color: 'white',
                                  fontWeight: 600,
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(255,255,255,0.2)'
                                }} 
                              />
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 2, opacity: 0.9, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                {card.network}
                              </Typography>
                              <Box sx={{ 
                                bgcolor: 'rgba(255,255,255,0.15)', 
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.5,
                                ml: 'auto',
                                mt: 1,
                                display: 'inline-block'
                              }}>
                                <CreditCard sx={{ fontSize: 24 }} />
                              </Box>
                            </Box>
                          </Box>
                           
                           <Box>
                             {detailsHidden[card.id] !== false ? (
                               <Typography variant="h4" sx={{ 
                                 fontWeight: 600, 
                                 letterSpacing: 3,
                                 mb: 3,
                                 color: 'rgba(255,255,255,0.7)',
                                 textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                               }}>
                                 •••• •••• •••• ••••
                               </Typography>
                             ) : (
                               <Typography variant="h4" sx={{ 
                                 fontWeight: 600, 
                                 letterSpacing: 3,
                                 mb: 3,
                                 textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                               }}>
                                 {card.maskedNumber}
                               </Typography>
                             )}
                             {detailsHidden[card.id] !== false ? (
                               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', opacity: 0.5 }}>
                                 <Box>
                                   <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Card Holder</Typography>
                                   <Typography variant="h6" sx={{ fontWeight: 600 }}>••••</Typography>
                                 </Box>
                                 <Box sx={{ textAlign: 'right' }}>
                                   <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Expires</Typography>
                                   <Typography variant="h6" sx={{ fontWeight: 600 }}>••/••</Typography>
                                 </Box>
                               </Box>
                             ) : (
                               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                 <Box>
                                   <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Card Holder</Typography>
                                   <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{card.holder}</Typography>
                                 </Box>
                                 <Box sx={{ textAlign: 'right' }}>
                                   <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Expires</Typography>
                                   <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{card.expiry}</Typography>
                                 </Box>
                               </Box>
                             )}
                           </Box>
                        </Box>
                      </Box>
                    </Paper>

                    {/* Card Back */}
                    <Paper
                      elevation={0}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: 340,
                        borderRadius: 5,
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1) inset',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <Box sx={{ 
                        height: '100%',
                        p: 4, 
                        background: card.gradient,
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <Box sx={{
                          position: 'absolute',
                          top: -40,
                          right: -40,
                          width: 180,
                          height: 180,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                        }} />
                        <Box sx={{ width: '100%', height: 55, bgcolor: 'rgba(0,0,0,0.4)', mt: 4, borderRadius: 1 }} />
                        <Box sx={{ mt: 4, textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>CVV</Typography>
                          <Box sx={{ 
                            bgcolor: 'white', 
                            color: '#333',
                            p: 1.5, 
                            px: 3, 
                            borderRadius: 2,
                            display: 'inline-block',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 3 }}>{card.cvv}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 5 }}>
                          <Typography variant="body1" sx={{ opacity: 0.8, fontStyle: 'italic', lineHeight: 1.6 }}>
                            "This card is the property of NorthCrest Bank. Unauthorized use is prohibited."
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>

                  {/* Card Actions */}
                  <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Tooltip title={detailsHidden[card.id] ? "Show Card Details" : "Hide Card Details"}>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsHidden(prev => ({
                            ...prev,
                            [card.id]: !prev[card.id]
                          }));
                        }}
                        sx={{ 
                          bgcolor: 'rgba(0,102,255,0.1)', 
                          color: '#0066FF',
                          border: '1px solid rgba(0,102,255,0.2)',
                          '&:hover': { bgcolor: 'rgba(0,102,255,0.2)', transform: 'translateY(-2px)' },
                          transition: 'all 0.2s ease'
                        }}>
                        {(detailsHidden[card.id] !== false) ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={card.status === 'Active' ? "Freeze Card" : "Unfreeze Card"}>
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFreezeCard(card.id, card.status === 'Frozen');
                        }}
                        sx={{ 
                          bgcolor: card.status === 'Active' ? 'rgba(255,107,107,0.1)' : 'rgba(0,200,150,0.1)', 
                          color: card.status === 'Active' ? '#FF6B6B' : '#00C896',
                          border: `1px solid ${card.status === 'Active' ? 'rgba(255,107,107,0.2)' : 'rgba(0,200,150,0.2)'}`,
                          '&:hover': { 
                            bgcolor: card.status === 'Active' ? 'rgba(255,107,107,0.2)' : 'rgba(0,200,150,0.2)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s ease'
                        }}>
                        <Lock />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Card">
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id);
                        }}
                        sx={{ 
                          bgcolor: 'rgba(255,152,0,0.1)', 
                          color: '#FF9800',
                          border: '1px solid rgba(255,152,0,0.2)',
                          '&:hover': { bgcolor: 'rgba(255,152,0,0.2)', transform: 'translateY(-2px)' },
                          transition: 'all 0.2s ease'
                        }}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </motion.div>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Quick Actions Section */}
      <motion.div variants={itemVariants}>
        <Box sx={{ mt: 10, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              borderRadius: 2, 
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(0,102,255,0.3)'
            }}>
              <CreditCard sx={{ fontSize: 22, color: 'white' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#0f2744' }}>
              Card Management
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {cardActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Box
                    onClick={action.action}
                    sx={{
                      cursor: 'pointer',
                      p: 3,
                      height: '100%',
                      background: 'white',
                      borderRadius: 3,
                      border: `1px solid ${action.borderColor}`,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '4px',
                        background: action.gradient,
                        transition: 'all 0.3s ease'
                      },
                      '&:hover': {
                        boxShadow: `0 20px 40px ${action.color}25`,
                        transform: 'translateY(-4px)',
                        '&::before': {
                          height: '6px'
                        }
                      }
                    }}
                  >
                    <Box sx={{ 
                      width: 56, 
                      height: 56, 
                      borderRadius: 2, 
                      background: action.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      mb: 2,
                      boxShadow: `0 8px 20px ${action.color}40`
                    }}>
                      {action.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f2744', mb: 1 }}>
                      {action.title}
                    </Typography>
                    <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', color: action.color, fontWeight: 600 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>Get Started</Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>
      </motion.div>

      {/* New Card Request Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
          color: 'white',
          fontWeight: 700
        }}>
          Request New Card
        </DialogTitle>
        <DialogContent sx={{ pt: 4 }}>
          <Stack spacing={3}>
            <TextField
              label="Card Type"
              select
              fullWidth
              value={newCardData.cardType}
              onChange={(e) => setNewCardData({...newCardData, cardType: e.target.value})}
              SelectProps={{
                native: true,
              }}
            >
              <option value="debit">Debit Card</option>
              <option value="credit">Credit Card</option>
              <option value="prepaid">Prepaid Card</option>
            </TextField>
            <TextField
              label="Card Network"
              select
              fullWidth
              value={newCardData.cardNetwork}
              onChange={(e) => setNewCardData({...newCardData, cardNetwork: e.target.value})}
              SelectProps={{
                native: true,
              }}
            >
              <option value="visa">VISA</option>
              <option value="mastercard">Mastercard</option>
              <option value="amex">American Express</option>
              <option value="discover">Discover</option>
            </TextField>
            <TextField
              label="Cardholder Name"
              fullWidth
              value={newCardData.cardholderName}
              onChange={(e) => setNewCardData({...newCardData, cardholderName: e.target.value})}
              required
            />
            <TextField
              label="Link to Account"
              select
              fullWidth
              value={newCardData.accountId}
              onChange={(e) => setNewCardData({...newCardData, accountId: e.target.value})}
              SelectProps={{
                native: true,
              }}
            >
              {accounts.map(account => (
                <option key={account._id} value={account._id}>
                  {account.accountType} - ****{account.accountNumber.slice(-4)}
                </option>
              ))}
            </TextField>
            {newCardData.cardType === 'credit' && (
              <TextField
                label="Credit Limit"
                type="number"
                fullWidth
                value={newCardData.creditLimit}
                onChange={(e) => setNewCardData({...newCardData, creditLimit: e.target.value})}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <PremiumButton variant="ghost" onClick={handleClose}>Cancel</PremiumButton>
          <PremiumButton 
            onClick={handleCreateCard} 
            variant="primary"
          >
            Submit Request
          </PremiumButton>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default Cards;
