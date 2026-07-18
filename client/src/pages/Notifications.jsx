import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, Divider, CircularProgress, Alert, Button } from '@mui/material';
import { Notifications as NotificationsIcon, Payment, Security, AccountBalance } from '@mui/icons-material';
import { getNotifications, markAsRead, markAllAsRead } from '../store/slices/notificationSlice';

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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">Notifications</Typography>
        <Box display="flex" gap={2} alignItems="center">
          {unreadCount > 0 && (
            <>
              <Chip label={`${unreadCount} unread`} color="primary" />
              <Button size="small" onClick={handleMarkAllAsRead}>Mark all as read</Button>
            </>
          )}
        </Box>
      </Box>

      <Paper>
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
    </Box>
  );
};

export default Notifications;