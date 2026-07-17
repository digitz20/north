import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Avatar,
  Chip, Divider, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack
} from '@mui/material';
import {
  CreditCard, Add, Visibility, Lock, Delete, Refresh, Security,
  Payment, ConfirmationNumber, CardGiftcard, ArrowForward, Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Cards = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [ref, inView] = useInView({ threshold: 0.1 });
  const containerRef = useRef(null);
  const [flippedCard, setFlippedCard] = useState(null);

  const cards = [
    {
      id: 1,
      type: 'Debit Card',
      number: '4532 1234 5678 1234',
      maskedNumber: '**** **** **** 1234',
      expiry: '12/28',
      cvv: '456',
      status: 'Active',
      holder: 'John Smith',
      balance: 12450.50,
      gradient: 'linear-gradient(135deg, #021024 0%, #063970 100%)',
      network: 'VISA'
    },
    {
      id: 2,
      type: 'Credit Card',
      number: '5412 8765 4321 5678',
      maskedNumber: '**** **** **** 5678',
      expiry: '08/27',
      cvv: '789',
      status: 'Active',
      holder: 'John Smith',
      balance: 5000.00,
      limit: 15000.00,
      gradient: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
      network: 'MASTERCARD'
    }
  ];

  const cardActions = [
    { title: 'Request New Card', icon: <Add sx={{ fontSize: 32 }} />, color: '#0066FF', action: () => setOpen(true) },
    { title: 'Freeze Card', icon: <Lock sx={{ fontSize: 32 }} />, color: '#FF6B6B', action: () => {} },
    { title: 'Replace Card', icon: <Refresh sx={{ fontSize: 32 }} />, color: '#00C896', action: () => {} },
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
          p: 5, 
          borderRadius: 4,
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
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={handleClickOpen}
                sx={{
                  bgcolor: 'white',
                  color: '#0066FF',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 15px 30px rgba(0,0,0,0.2)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Request New Card
              </Button>
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
          {/* Decorative Elements */}
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

      {/* Cards Grid */}
      <Grid container spacing={5} ref={ref}>
        {cards.map((card, index) => (
          <Grid item xs={12} md={6} lg={6} key={card.id}>
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -15, scale: 1.02 }}
              transition={{ duration: 0.4 }}
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
                    borderRadius: 4,
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
                    {/* Card Decorations */}
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
                    
                    <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {card.type}
                          </Typography>
                          <Chip 
                            label={card.status} 
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(0,200,150,0.9)', 
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
                    </CardContent>
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
                    borderRadius: 4,
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
                <Tooltip title="Lock Card">
                  <IconButton sx={{ 
                    bgcolor: 'rgba(255,107,107,0.1)', 
                    color: '#FF6B6B',
                    '&:hover': { bgcolor: 'rgba(255,107,107,0.2)' }
                  }}>
                    <Lock />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Card">
                  <IconButton sx={{ 
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
        ))}
      </Grid>

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
                  whileHover={{ y: -8, scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper
                    elevation={0}
                    onClick={action.action}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      border: '2px solid #f0f0f0',
                      '&:hover': {
                        borderColor: action.color,
                        boxShadow: `0 20px 40px ${action.color}20`
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Avatar sx={{ 
                      bgcolor: `${action.color}15`, 
                      color: action.color,
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2
                    }}>
                      {action.icon}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {action.title}
                    </Typography>
                  </Paper>
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
              defaultValue="debit"
              SelectProps={{
                native: true,
              }}
            >
              <option value="debit">Debit Card</option>
              <option value="credit">Credit Card</option>
              <option value="premium">Premium Credit Card</option>
            </TextField>
            <TextField
              label="Delivery Address"
              multiline
              rows={3}
              fullWidth
              placeholder="Enter your full delivery address"
            />
            <TextField
              label="Additional Notes"
              multiline
              rows={2}
              fullWidth
              placeholder="Any special requests?"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose} sx={{ color: '#666' }}>Cancel</Button>
          <Button 
            onClick={handleClose} 
            variant="contained"
            sx={{ 
              background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
              textTransform: 'none',
              fontWeight: 600,
              px: 4
            }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default Cards;