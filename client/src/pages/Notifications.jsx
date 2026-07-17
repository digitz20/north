import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, ListItemIcon, Chip, Divider } from '@mui/material';
import { Notifications as NotificationsIcon, Payment, Security, AccountBalance } from '@mui/icons-material';

const Notifications = () => {
  const notifications = [
    {
      id: 1,
      type: 'payment',
      title: 'Payment Received',
      message: 'You received $1,200 from John Doe',
      date: '2026-07-15',
      read: false
    },
    {
      id: 2,
      type: 'security',
      title: 'New Login Detected',
      message: 'A new login was detected from Chrome on Windows',
      date: '2026-07-14',
      read: false
    },
    {
      id: 3,
      type: 'account',
      title: 'Account Update',
      message: 'Your profile information was updated successfully',
      date: '2026-07-10',
      read: true
    },
    {
      id: 4,
      type: 'payment',
      title: 'Bill Paid',
      message: 'Your electricity bill of $85 was paid successfully',
      date: '2026-07-05',
      read: true
    }
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'payment': return <Payment color="primary" />;
      case 'security': return <Security color="error" />;
      case 'account': return <AccountBalance color="info" />;
      default: return <NotificationsIcon />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Notifications</Typography>
        {unreadCount > 0 && (
          <Chip label={`${unreadCount} unread`} color="primary" />
        )}
      </Box>

      <Paper>
        <List>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem sx={{ backgroundColor: notification.read ? 'transparent' : 'rgba(0, 0, 0, 0.04)' }}>
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
                      <Typography variant="caption" color="text.secondary">{notification.date}</Typography>
                    </>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Notifications;