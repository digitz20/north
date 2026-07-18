import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, Divider, CircularProgress, Alert, Button } from '@mui/material';
import { Notifications as NotificationsIcon, Payment, Security, AccountBalance } from '@mui/icons-material';
import { getNotifications, markAsRead, markAllAsRead } from '../store/slices/notificationSlice';
import { motion } from 'framer-motion';

const Notifications = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { notifications, unreadCount, loading, error } = useSelector((state) => state.notifications);

  useEffect(() => {
    dispatch(getNotifications());
  }, [dispatch, location.pathname]);

  const getIcon = (type) => {
    switch(type) {
      case 'payment': return <Payment color="primary" />;
      case 'security': return <Security color="error" />;
      case 'account': return <AccountBalance color="info" />;
      default: return <NotificationsIcon />;
    }
  };

  const handleMarkAsRead = (notificationId) => {
    dispatch(markAsRead(notificationId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box mt={4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #0f2744 0%, #1e4d8a 50%, #0066ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Notifications</Typography>
          <Box display="flex" gap={2} alignItems="center">
            {unreadCount > 0 && (
              <>
                <Chip label={`${unreadCount} unread`} color="primary" />
                <Button size="small" onClick={handleMarkAllAsRead}>Mark all as read</Button>
              </>
            )}
          </Box>
        </Box>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper sx={{
            borderRadius: 5,
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(15,39,68,0.08)',
            boxShadow: '0 20px 60px -15px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {notifications.length > 0 ? (
              <List>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification._id}>
                <ListItem 
                  sx={{ 
                    backgroundColor: notification.read ? 'transparent' : 'rgba(0, 0, 0, 0.04)',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: notification.read ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.06)'
                    }
                  }}
                  onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                >
                  <ListItemIcon>
                    {getIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography>{notification.title}</Typography>
                        {!notification.read && (
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', ml: 2 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">{notification.message}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDate(notification.createdAt)}</Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">You have no notifications</Typography>
          </Box>
        )}
          </Paper>
        </motion.div>
      </Box>
    </Box>
  );
};

export default Notifications;