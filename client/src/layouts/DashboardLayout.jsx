import React, { useState, Suspense, lazy } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  IconButton,
  Badge,
  Avatar,
  Tooltip,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';

// Lazy load the chat widget to implement code splitting
const LiveSupportChat = lazy(() => import('../components/support/LiveSupportChat'));
import {
  Dashboard as DashboardIcon,
  AccountBalance as AccountsIcon,
  Receipt as TransactionsIcon,
  Send as TransferIcon,
  Download as WithdrawIcon,
  Upload as DepositIcon,
  CreditCard as CardsIcon,
  TrendingUp as InvestmentsIcon,
  Money as LoansIcon,
  People as BeneficiariesIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import NorthCrestLogo from '../components/common/NorthCrestLogo';
import { useNavigationWithSplash } from '../hooks/useNavigationWithSplash';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Accounts', icon: <AccountsIcon />, path: '/accounts' },
  { text: 'Transactions', icon: <TransactionsIcon />, path: '/transactions' },
  { text: 'Transfer', icon: <TransferIcon />, path: '/transfer' },
  { text: 'Deposit', icon: <DepositIcon />, path: '/deposit' },
  { text: 'Cards', icon: <CardsIcon />, path: '/cards' },
  { text: 'Investments', icon: <InvestmentsIcon />, path: '/investments' },
  { text: 'Loan/IRS Taxrefund', icon: <LoansIcon />, path: '/loans' },
  { text: 'Beneficiaries', icon: <BeneficiariesIcon />, path: '/beneficiaries' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  { text: 'Profile', icon: <ProfileIcon />, path: '/profile' }
];

const DashboardLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const { navigateWithSplash, NavigationSplash } = useNavigationWithSplash();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user } = useSelector(state => state.auth);
  const { unreadCount } = useSelector(state => state.notifications);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationsAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleMenuClose();
  };

  const drawer = (
    <Box>
      <Toolbar sx={{ justifyContent: 'center', py: 1 }}>
        <NorthCrestLogo />
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            selected={location.pathname === item.path}
            sx={{
              mx: 1,
              borderRadius: 2,
              mb: 0.8,
              transition: 'all 0.3s ease',
              '&:hover:not(.Mui-selected)': {
                backgroundColor: 'rgba(0,102,255,0.08)',
                transform: 'translateX(4px)'
              },
              '&.Mui-selected': {
                background: 'linear-gradient(135deg, #0066ff 0%, #00bfff 100%)',
                color: 'white',
                boxShadow: '0 8px 20px rgba(0,102,255,0.3)',
                '& .MuiListItemIcon-root': {
                  color: 'white'
                }
              }
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <Typography variant="body1">{item.text}</Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Browser-like navigation controls */}
          <Tooltip title="Back">
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Forward">
            <IconButton onClick={() => navigate(1)} sx={{ mr: 1 }}>
              <ArrowForwardIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Go to main landing page">
            <IconButton onClick={() => navigateWithSplash('/')} sx={{ mr: 2 }}>
              <HomeIcon />
            </IconButton>
          </Tooltip>
          
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton size="large" onClick={handleNotificationsOpen}>
                <Badge badgeContent={unreadCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title={user?.fullName || 'Account'}>
              <IconButton
                size="large"
                onClick={handleProfileMenuOpen}
                sx={{ ml: 2 }}
              >
                <Avatar 
                  sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}
                  src={user?.profilePicture || ''}
                >
                  {user?.fullName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => navigateWithSplash('/profile')}>
          <ListItemIcon>
            <ProfileIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body1">Profile</Typography>
        </MenuItem>
        <MenuItem onClick={() => navigateWithSplash('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body1">Settings</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <Typography variant="body1">Logout</Typography>
        </MenuItem>
      </Menu>
      
      {/* Navigation splash screen */}
      <NavigationSplash />

      {/* Sidebar drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{
            keepMounted: true,
            disableEnforceFocus: false
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: '#f7fafc',
          minHeight: '100vh',
          overflowX: 'hidden'
        }}
      >
        <Toolbar />
        <Box sx={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Outlet key={location.pathname} />
        </Box>
      </Box>
      
      {/* Live Support Chat Widget - lazy loaded for performance */}
      <Suspense fallback={null}>
        <LiveSupportChat />
      </Suspense>
    </Box>
  );
};

export default DashboardLayout;