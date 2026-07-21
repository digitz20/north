import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import AdminLogin from './pages/Login';
import AdminDashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Users from './pages/Users';
import KYCReview from './pages/KYCReview';
import Transactions from './pages/Transactions';
import Transfers from './pages/Transfers';
import Accounts from './pages/Accounts';
import Loans from './pages/Loans';
import Investments from './pages/Investments';
import SupportTickets from './pages/SupportTickets';
import Reports from './pages/Reports';
import TaxRefunds from './pages/TaxRefunds';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';
import { SocketProvider } from './contexts/SocketContext';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { getCurrentAdmin } from './store/slices/authSlice';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, restoring } = useSelector((state) => state.auth);
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';
  const hasRestoredRef = useRef(false);
  const [fallbackReady, setFallbackReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
      const timeout = setTimeout(() => {
        dispatch(getCurrentAdmin());
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [dispatch]);

  useEffect(() => {
    if (restoring) {
      const fallback = setTimeout(() => {
        setFallbackReady(true);
      }, 8000);
      return () => clearTimeout(fallback);
    }
  }, [restoring]);

  if (restoring && !fallbackReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (restoring) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <SocketProvider>
      <Routes>
        {/* Auth routes (public) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<AdminLogin />} />
        </Route>

        {/* Protected admin routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} isAdmin={isAdmin} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/kyc" element={<KYCReview />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transfers" element={<Transfers />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/support" element={<SupportTickets />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/tax-refunds" element={<TaxRefunds />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Catch-all redirect to admin login */}
        <Route path="*" element={<AdminLogin />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;