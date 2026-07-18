import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoadingSpinner from './components/LoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy load all page components for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Transfer = lazy(() => import('./pages/TransferMoney'));
const Cards = lazy(() => import('./pages/Cards'));
const Investments = lazy(() => import('./pages/Investments'));
const Loans = lazy(() => import('./pages/Loans'));
const Beneficiaries = lazy(() => import('./pages/Beneficiaries'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const Withdraw = lazy(() => import('./pages/Withdraw'));
const Deposit = lazy(() => import('./pages/Deposit'));

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Suspense fallback={<LoadingSpinner fullPage size={60} />}>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Landing />} />
        
        {/* Auth routes (public) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/withdraw" element={<Withdraw />} />
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

        {/* Catch-all redirect to landing page */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </Suspense>
  );
}

export default App;