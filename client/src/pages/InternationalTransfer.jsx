import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { 
  AccountBalance, CurrencyBitcoin, Payments, 
  Money, Send, MoreHoriz, Lock
} from '@mui/icons-material';

// Reuse the same crypto addresses from Investments to maintain consistency
const cryptoOptions = [
  { 
    id: 'btc', 
    name: 'Bitcoin', 
    symbol: 'BTC',
    address: 'bc1qcxturvvyrjqnj3vkundmt5kaukqw28qe7z0l4y',
    network: 'Bitcoin (BTC)'
  },
  { 
    id: 'eth', 
    name: 'Ethereum', 
    symbol: 'ETH',
    address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8',
    network: 'Ethereum (ERC20)'
  },
  { 
    id: 'trx', 
    name: 'TRON', 
    symbol: 'TRX',
    address: 'TCYjqLQFCfyRzrZ5nFSAYRh259we2VqRdg',
    network: 'TRON (TRX)'
  },
  { 
    id: 'sol', 
    name: 'Solana', 
    symbol: 'SOL',
    address: '36rAEqtck9UfSx8WJTVLvsZkQ6htUfcUXBUrbJjb73JA',
    network: 'Solana'
  },
  { 
    id: 'bnb', 
    name: 'BNB Chain', 
    symbol: 'BNB',
    address: '0x87d04fc72ae68086eab7662b2ca27823f8b42eb8',
    network: 'BNB Smart Chain'
  },
  { 
    id: 'ltc', 
    name: 'Litecoin', 
    symbol: 'LTC',
    address: 'ltc1q5ddt0k53v9manzudx8sfvhte2xad3z82g4xlks',
    network: 'Litecoin'
  },
  { 
    id: 'doge', 
    name: 'Dogecoin', 
    symbol: 'DOGE',
    address: 'DHcr7Au8ETffaNNzToYzoGWV6k95czyNTX',
    network: 'Dogecoin'
  }
];

const transferMethods = [
  {
    id: 'wire',
    title: 'Wire Transfer',
    description: 'Transfer funds directly to international bank accounts.',
    icon: <AccountBalance sx={{ fontSize: 40 }} />,
    color: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)'
  },
  {
    id: 'crypto',
    title: 'Cryptocurrency',
    description: 'Send funds to your cryptocurrency wallet.',
    icon: <CurrencyBitcoin sx={{ fontSize: 40 }} />,
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    cryptoAddresses: cryptoOptions
  },
  {
    id: 'paypal',
    title: 'PayPal',
    description: 'Transfer funds to your PayPal account.',
    icon: <Payments sx={{ fontSize: 40 }} />,
    color: 'linear-gradient(135deg, #003087 0%, #009cde 100%)'
  },
  {
    id: 'wise',
    title: 'Wise Transfer',
    description: 'Transfer with lower fees using Wise.',
    icon: <Money sx={{ fontSize: 40 }} />,
    color: 'linear-gradient(135deg, #00b86d 0%, #80e0bb 100%)'
  },
  {
    id: 'cashapp',
    title: 'Cash App',
    description: 'Quick transfers to your Cash App account.',
    icon: <Send sx={{ fontSize: 40 }} />,
    color: 'linear-gradient(135deg, #00d632 0%, #55f57a 100%)'
  },
  {
    id: 'more',
    title: 'More Options',
    description: 'Zelle, Venmo, Revolut, and more.',
    icon: <MoreHoriz sx={{ fontSize: 40 }} />,
    color: 'linear-gradient(135deg, #64748b 0%, #94a3b8 100%)'
  }
];

const InternationalTransfer = () => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState(null);

  return (
    <Box sx={{ 
      position: 'relative', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
      minHeight: '100vh',
      p: { xs: 2, md: 0 }
    }}>
      {/* Premium ambient background effects */}
      <Box sx={{
        position: 'fixed',
        top: '-5%',
        right: '-10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,200,150,0.1) 0%, rgba(0,200,150,0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <Box sx={{
        position: 'fixed',
        bottom: '-10%',
        left: '-5%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,102,255,0.08) 0%, rgba(0,102,255,0) 70%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={() => navigate('/transfer')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0
          }}>
            Dashboard / International Transfer
          </Typography>
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper sx={{ 
            p: 4, 
            maxWidth: 1200,
            borderRadius: 5,
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(15,39,68,0.08)',
            boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)',
            mx: 'auto'
          }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>Select Transfer Method</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Choose from our secure international transfer options
            </Typography>

            <Grid container spacing={3}>
              {transferMethods.map((method, index) => (
                <Grid item xs={12} md={6} key={method.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <Card 
                      sx={{ 
                        borderRadius: 4,
                        cursor: 'pointer',
                        border: selectedMethod === method.id ? '3px solid #0066FF' : '1px solid rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                      }}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <Box sx={{ 
                        p: 0.5, 
                        background: method.color,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 3
                      }}>
                        {method.icon}
                      </Box>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                          {method.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.description}
                        </Typography>
                        
                        {/* Show crypto addresses if cryptocurrency method is selected */}
                        {method.id === 'crypto' && selectedMethod === 'crypto' && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                              Available Cryptocurrencies & Wallet Addresses:
                            </Typography>
                            {method.cryptoAddresses.map((crypto) => (
                              <Paper key={crypto.id} sx={{ p: 2, mb: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {crypto.name} ({crypto.symbol})
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block' }}>
                                  {crypto.address}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Network: {crypto.network}
                                </Typography>
                              </Paper>
                            ))}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            {/* Security Notice */}
            <Paper sx={{ 
              mt: 5,
              p: 3, 
              borderRadius: 5,
              background: 'rgba(0,102,255,0.05)',
              border: '1px solid rgba(0,102,255,0.1)',
              textAlign: 'center'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                <Lock sx={{ fontSize: 18, color: '#0066FF' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Secure Transaction</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                All transfers are encrypted and processed securely. Never share your PIN with anyone.
              </Typography>
            </Paper>
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default InternationalTransfer;