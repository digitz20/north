import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser } from '../store/slices/authSlice';
import { CircularProgress, Box } from '@mui/material';

const isSessionExpired = () => {
  const sessionExpiry = sessionStorage.getItem('sessionExpiry');
  if (!sessionExpiry) return false;
  return Date.now() > parseInt(sessionExpiry);
};

const FROZEN_RESTRICTED_PATHS = [
  '/transfer',
  '/transfer/local',
  '/transfer/international',
  '/deposit',
  '/cards',
  '/investments',
  '/loans',
  '/beneficiaries'
];

const ProtectedRoute = ({ isAuthenticated }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const token = sessionStorage.getItem('token');
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    const verifyAuth = async () => {
      if (isSessionExpired()) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('sessionExpiry');
        setLoading(false);
        return;
      }
      
      if (token && !isAuthenticated) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          // Failed to get current user, will redirect to landing
        }
      }
      setLoading(false);
    };
    verifyAuth();
  }, [token, isAuthenticated, dispatch]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !token || isSessionExpired()) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Redirect to PIN setup if required and not already on pin-setup page
  if (user?.pinSetupRequired && location.pathname !== '/pin-setup') {
    return <Navigate to="/pin-setup" replace />;
  }

  // Redirect away from PIN setup page if PIN is already set
  if (!user?.pinSetupRequired && location.pathname === '/pin-setup') {
    return <Navigate to="/dashboard" replace />;
  }

  // Block frozen users from restricted action pages
  if (user?.isFrozen && FROZEN_RESTRICTED_PATHS.includes(location.pathname)) {
    return <Navigate to="/dashboard" state={{ frozenRedirect: true }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;