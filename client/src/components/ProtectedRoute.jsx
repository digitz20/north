import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getCurrentUser } from '../store/slices/authSlice';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ isAuthenticated }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const verifyAuth = async () => {
      if (token && !isAuthenticated) {
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          // Failed to get current user, will redirect to login
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

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;