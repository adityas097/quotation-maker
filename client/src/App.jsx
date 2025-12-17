import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import { API_BASE_URL } from './apiConfig';

// Lazy Load Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ItemMaster = lazy(() => import('./pages/ItemMaster'));
const QuotationsList = lazy(() => import('./pages/QuotationsList'));
const ClientMaster = lazy(() => import('./pages/ClientMaster'));
const CreateQuote = lazy(() => import('./pages/CreateQuote'));
const QuotationView = lazy(() => import('./pages/QuotationView'));
const Billbook = lazy(() => import('./pages/Billbook'));
const CompanySettings = lazy(() => import('./pages/CompanySettings'));
const Users = lazy(() => import('./pages/Users'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const SetupWizard = lazy(() => import('./pages/SetupWizard'));

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <div className="p-4 text-center">
      <h2>Access Denied</h2>
      <p>You do not have permission to view this page.</p>
    </div>;
  }

  return children;
};

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/setup" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="items" element={<ItemMaster />} />
          <Route path="clients" element={<ClientMaster />} />
          <Route path="quotations" element={<QuotationsList />} />
          <Route path="/quotations/new" element={<CreateQuote />} />
          <Route path="/quotations/:id/edit" element={<CreateQuote />} />
          <Route path="/quotations/:id" element={<QuotationView />} />
          <Route path="/billbook" element={<Billbook />} />
          <Route path="/settings" element={<CompanySettings />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/users" element={
            <PrivateRoute roles={['admin']}>
              <Users />
            </PrivateRoute>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
