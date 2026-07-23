import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { Chat as ChatIcon } from '@mui/icons-material';

const FrozenAccountModal = ({ open, onClose }) => {
  const handleChatClick = () => {
    onClose();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-support-chat'));
    }, 350);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          textAlign: 'center',
          py: 2
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#d32f2f' }}>
          Account on Hold
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ mb: 2, color: '#555', lineHeight: 1.6 }}>
          Sorry, your account is on hold for now. Please chat with support for steps to continue using our service.
        </Typography>
        <Box sx={{ 
          bgcolor: '#f5f5f5', 
          borderRadius: 2, 
          p: 2, 
          mb: 2,
          border: '1px solid #e0e0e0'
        }}>
          <Typography variant="body2" sx={{ color: '#333', fontWeight: 500 }}>
            Your funds are safe and secured.
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#888' }}>
          Thank you for choosing NorthCrestBank.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          variant="contained"
          startIcon={<ChatIcon />}
          onClick={handleChatClick}
          sx={{
            background: 'linear-gradient(135deg, #0066FF 0%, #00BFFF 100%)',
            borderRadius: 2,
            px: 4,
            py: 1.2,
            fontWeight: 600
          }}
        >
          Chat with Support
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FrozenAccountModal;
