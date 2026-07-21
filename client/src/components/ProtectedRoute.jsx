import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getCurrentUser } from '../store/slices/authSlice';
import { CircularProgress, Box } from '@mui/material';

const isSessionExpired = () => {
  const sessionExpiry = localStorage.getItem('sessionExpiry');
  if (!sessionExpiry) return false;
  return Date.now() > parseInt(sessionExpiry);
};

const ProtectedRoute = ({ isAuthenticated }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const verifyAuth = async () => {
      if (isSessionExpired()) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionExpiry');
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

  return <Outlet />;
};

export default ProtectedRoute;