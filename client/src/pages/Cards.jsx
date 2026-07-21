import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  Box, Typography, Grid, Avatar, Chip, Divider, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, CircularProgress, Alert, InputAdornment
} from '@mui/material';
import {
  CreditCard, Add, Visibility, Lock, Delete, Refresh, Security,
  Payment, ConfirmationNumber, CardGiftcard, ArrowForward, Person
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getUserCards, createCard, freezeCard, unfreezeCard, deleteCard } from '../store/slices/cardSlice';
import PremiumCard from '../components/PremiumCard';
import PremiumStatCard from '../components/PremiumStatCard';
import PremiumButton from '../components/PremiumButton';

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
    { title: 'Request New Card', icon: <Add sx={{ fontSize: 32 }} />, color: '#0066FF', action: () => setOpen(true) },
    { title: 'Card Settings', icon: <Security sx={{ fontSize: 32 }} />, color: '#FFC857', action: () => navigate('/settings') },
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
      style={{ minHeight: '100vh' }}
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
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
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
          }} />
          <Box sx={{
            position: 'absolute',
            bottom: -80,
            right: 100,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Cards Grid - only show when not loading */}
      {!loading && (
        <Grid container spacing={5} ref={ref}>
          {cards.length === 0 ? (
            <Grid item xs={12}>
              <PremiumCard sx={{ p: 6, textAlign: 'center' }}>
                <CreditCard sx={{ fontSize: 80, color: '#ccc', mb: 3 }} />
                <Typography variant="h5" sx={{ mb: 2, color: '#666' }}>No cards found</Typography>
                <Typography variant="body1" sx={{ mb: 4, color: '#888' }}>You don't have any cards yet. Request your first card to get started!</Typography>
                <PremiumButton variant="primary" startIcon={<Add />} onClick={handleClickOpen}>
                  Request Your First Card
                </PremiumButton>
              </PremiumCard>
            </Grid>
          ) : (
            cards.map((card, index) => (
              <Grid item xs={12} md={6} key={card.id}>
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
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
                        height: 320,
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
                        backfaceVisibility: 'hidden'
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
                          width: 160,
                          height: 160,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                        }} />
                        <Box sx={{
                          position: 'absolute',
                          bottom: -60,
                          left: -60,
                          width: 180,
                          height: 180,
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.08)',
                        }} />
                        
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {card.type}
                              </Typography>
                              <Chip 
                                label={card.status} 
                                size="small"
                                sx={{ 
                                  bgcolor: card.status === 'Active' ? 'rgba(0,200,150,0.9)' : 'rgba(255,107,107,0.9)', 
                                  color: 'white',
                                  fontWeight: 600
                                }} 
                              />
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: 2, opacity: 0.9 }}>
                                {card.network}
                              </Typography>
                              <Avatar sx={{ 
                                bgcolor: 'rgba(255,255,255,0.2)', 
                                width: 48, 
                                height: 32,
                                ml: 'auto',
                                mt: 1
                              }}>
                                <CreditCard />
                              </Avatar>
                            </Box>
                          </Box>
                          
                          <Box>
                            <Typography variant="h4" sx={{ 
                              fontWeight: 600, 
                              letterSpacing: 3,
                              mb: 3
                            }}>
                              {card.maskedNumber}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <Box>
                                <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Card Holder</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>{card.holder}</Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ opacity: 0.7, mb: 0.5 }}>Expires</Typography>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>{card.expiry}</Typography>
                              </Box>
                            </Box>
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
                        height: 320,
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
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
                        <Box sx={{ width: '100%', height: 50, bgcolor: 'rgba(0,0,0,0.4)', mt: 2 }} />
                        <Box sx={{ mt: 3, textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>CVV</Typography>
                          <Box sx={{ 
                            bgcolor: 'white', 
                            color: '#333',
                            p: 1, 
                            px: 2, 
                            borderRadius: 1,
                            display: 'inline-block'
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 3 }}>{card.cvv}</Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mt: 4 }}>
                          <Typography variant="body1" sx={{ opacity: 0.8, fontStyle: 'italic' }}>
                            "This card is the property of NorthCrest Bank. Unauthorized use is prohibited."
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>

                  {/* Card Actions */}
                  <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Tooltip title="View Details">
                      <IconButton sx={{ 
                        bgcolor: 'rgba(0,102,255,0.1)', 
                        color: '#0066FF',
                        '&:hover': { bgcolor: 'rgba(0,102,255,0.2)' }
                      }}>
                        <Visibility />
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
                          '&:hover': { bgcolor: card.status === 'Active' ? 'rgba(255,107,107,0.2)' : 'rgba(0,200,150,0.2)' }
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
                          '&:hover': { bgcolor: 'rgba(255,152,0,0.2)' }
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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
            Card Management
          </Typography>
          <Grid container spacing={3}>
            {cardActions.map((action, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <PremiumCard
                    onClick={action.action}
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
