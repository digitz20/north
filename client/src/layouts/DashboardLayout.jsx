import React, { useState, useEffect, Suspense, lazy } from 'react';
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
  Divider,
  SvgIcon
} from '@mui/material';

// Lazy load the chat widget to implement code splitting
const LiveSupportChat = lazy(() => import('../components/support/LiveSupportChat'));
import FrozenAccountModal from '../components/common/FrozenAccountModal';
import {
  Dashboard as DashboardIcon,
  AccountBalance as AccountsIcon,
  Receipt as TransactionsIcon,
  Send as TransferIcon,
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

const noBlueBgItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', color: '#0066FF' },
  { text: 'Accounts', icon: <AccountsIcon />, path: '/accounts', color: '#00C896' },
  { text: 'Transactions', icon: <TransactionsIcon />, path: '/transactions', color: '#00BFFF' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications', color: '#FF4081' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', color: '#B0BEC5' }
];

const lightBlueBgItems = [
  { text: 'Transfer', icon: <TransferIcon />, path: '/transfer', color: '#7C4DFF' },
  { text: 'Deposit', icon: <DepositIcon />, path: '/deposit', color: '#FF6B6B' },
  { text: 'Cards', icon: <CardsIcon />, path: '/cards', color: '#FF9100' },
  { text: 'Investments', icon: <InvestmentsIcon />, path: '/investments', color: '#00E5FF' },
  { text: 'Loans/IRS Taxrefund', icon: <LoansIcon />, path: '/loans', color: '#FFC857' },
  { text: 'Beneficiaries', icon: <BeneficiariesIcon />, path: '/beneficiaries', color: '#E040FB' },
  { text: 'Profile', icon: <ProfileIcon />, path: '/profile', color: '#64FFDA' }
];

const allMenuItems = [...noBlueBgItems, ...lightBlueBgItems];

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
  const [frozenModalOpen, setFrozenModalOpen] = useState(false);

  // Close mobile drawer when navigating to a new page
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const frozenRestrictedPaths = [
      '/transfer',
      '/transfer/local',
      '/transfer/international',
      '/deposit',
      '/cards',
      '/investments',
      '/loans',
      '/beneficiaries'
    ];
    if (user?.isFrozen && frozenRestrictedPaths.includes(location.pathname)) {
      setFrozenModalOpen(true);
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, user?.isFrozen, navigate]);

  useEffect(() => {
    // Show frozen modal when redirected from a restricted page
    if (location.state?.frozenRedirect && user?.isFrozen) {
      setFrozenModalOpen(true);
    }
  }, [location.state?.frozenRedirect, user?.isFrozen]);

  useEffect(() => {
    const handleFrozenAccount = () => {
      setFrozenModalOpen(true);
    };
    window.addEventListener('frozen-account', handleFrozenAccount);
    return () => window.removeEventListener('frozen-account', handleFrozenAccount);
  }, []);

  useEffect(() => {
    if (user?.isFrozen) {
      setFrozenModalOpen(true);
    }
  }, [user?.isFrozen]);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
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
        {noBlueBgItems.map((item) => {
          const isFrozenRoute = ['/transfer', '/transfer/local', '/transfer/international', '/deposit', '/cards', '/investments', '/loans', '/beneficiaries'].includes(item.path);
          return (
            <ListItem
              button
              key={item.text}
              component={isFrozenRoute && user?.isFrozen ? 'div' : Link}
              to={isFrozenRoute && user?.isFrozen ? undefined : item.path}
              selected={location.pathname === item.path}
              onClick={(e) => {
                if (isFrozenRoute && user?.isFrozen) {
                  e.preventDefault();
                  setFrozenModalOpen(true);
                }
              }}
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
                  background: '#ffffff',
                  color: '#021024',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '& .MuiListItemIcon-root': {
                    color: '#021024'
                  }
                }
              }}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: location.pathname === item.path ? 'transparent' : `linear-gradient(135deg, ${item.color}, ${item.color}88)`,
                    color: location.pathname === item.path ? item.color : 'white',
                    boxShadow: location.pathname === item.path ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.18)'
                    }
                  }}
                >
                  {item.icon}
                </Avatar>
              </ListItemIcon>
              <Typography variant="body1" sx={{ fontWeight: location.pathname === item.path ? 600 : 400 }}>{item.text}</Typography>
            </ListItem>
          );
        })}
        <Divider sx={{ my: 1, mx: 2 }} />
        {lightBlueBgItems.map((item) => {
          const isFrozenRoute = ['/transfer', '/transfer/local', '/transfer/international', '/deposit', '/cards', '/investments', '/loans', '/beneficiaries'].includes(item.path);
          return (
            <ListItem
              button
              key={item.text}
              component={isFrozenRoute && user?.isFrozen ? 'div' : Link}
              to={isFrozenRoute && user?.isFrozen ? undefined : item.path}
              selected={location.pathname === item.path}
              onClick={(e) => {
                if (isFrozenRoute && user?.isFrozen) {
                  e.preventDefault();
                  setFrozenModalOpen(true);
                }
              }}
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
                  background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                  color: '#0d47a1',
                  boxShadow: '0 2px 8px rgba(13,71,161,0.15)',
                  '& .MuiListItemIcon-root': {
                    color: '#0d47a1'
                  }
                }
              }}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    background: location.pathname === item.path ? 'transparent' : `linear-gradient(135deg, ${item.color}, ${item.color}88)`,
                    color: location.pathname === item.path ? '#0d47a1' : 'white',
                    boxShadow: location.pathname === item.path ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.18)'
                    }
                  }}
                >
                  {item.icon}
                </Avatar>
              </ListItemIcon>
              <Typography variant="body1" sx={{ fontWeight: location.pathname === item.path ? 600 : 400 }}>{item.text}</Typography>
            </ListItem>
          );
        })}
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
            disableScrollLock: true,
            disableEnforceFocus: true,
            disableAutoFocus: true,
            closeAfterTransition: true,
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'transparent !important',
              opacity: '0 !important',
            },
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            '& .MuiBackdrop-root': {
              backgroundColor: 'transparent !important',
              opacity: '0 !important',
            },
          }}
          TransitionProps={{ timeout: 250 }}
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
          background: ['/dashboard', '/accounts', '/notifications', '/settings'].includes(location.pathname)
            ? 'white'
            : '#48CAE4',
          position: 'relative',
          minHeight: '100vh',
          overflowX: 'hidden'
        }}
        onClick={() => setMobileOpen(false)}
      >
        <Box
          sx={{
            position: 'fixed',
            top: '-10%',
            right: '-15%',
            width: 700,
            height: 700,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,200,150,0.25) 0%, rgba(0,200,150,0) 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0,
            display: { xs: 'none', md: 'block' }
          }}
        />
        <Box
          sx={{
            position: 'fixed',
            bottom: '-15%',
            left: '-10%',
            width: 800,
            height: 800,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,102,255,0.2) 0%, rgba(0,102,255,0) 70%)',
            filter: 'blur(90px)',
            pointerEvents: 'none',
            zIndex: 0,
            display: { xs: 'none', md: 'block' }
          }}
        />
        <Toolbar />
        <Box sx={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
          <Outlet key={location.pathname} />
        </Box>
      </Box>
      
      {/* Live Support Chat Widget - lazy loaded for performance */}
      <Suspense fallback={null}>
        <LiveSupportChat />
      </Suspense>

      <FrozenAccountModal
        open={frozenModalOpen}
        onClose={() => setFrozenModalOpen(false)}
      />
    </Box>
  );
};

export default DashboardLayout;