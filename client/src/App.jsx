import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { SocketProvider } from './contexts/SocketContext';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Transfer = lazy(() => import('./pages/Transfer'));
const LocalTransfer = lazy(() => import('./pages/LocalTransfer'));
const InternationalTransfer = lazy(() => import('./pages/InternationalTransfer'));
const Cards = lazy(() => import('./pages/Cards'));
const Investments = lazy(() => import('./pages/Investments'));
const Loans = lazy(() => import('./pages/Loans'));
const Beneficiaries = lazy(() => import('./pages/Beneficiaries'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Deposit = lazy(() => import('./pages/Deposit'));

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <SocketProvider>
      <Suspense fallback={<LoadingSpinner fullPage size={60} />}>
        <Routes>
        {/* Public landing page */}
        <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to="/dashboard" replace />} />
        
        {/* Auth routes (public) - redirect to dashboard if already authenticated */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} />
          <Route path="/verify-email" element={!isAuthenticated ? <VerifyEmail /> : <Navigate to="/dashboard" replace />} />
        </Route>

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transfer/local" element={<LocalTransfer />} />
            <Route path="/transfer/international" element={<InternationalTransfer />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/beneficiaries" element={<Beneficiaries />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />} />
        </Routes>
      </Suspense>
    </SocketProvider>
  );
}

export default App;