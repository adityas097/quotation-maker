import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ItemMaster from './pages/ItemMaster';
import QuotationsList from './pages/QuotationsList';
import ClientMaster from './pages/ClientMaster';
import CreateQuote from './pages/CreateQuote';
import QuotationView from './pages/QuotationView';
import Billbook from './pages/Billbook';
import CompanySettings from './pages/CompanySettings';
import Users from './pages/Users';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserProfile from './pages/UserProfile';
import SetupWizard from './pages/SetupWizard';
import { API_BASE_URL } from './apiConfig';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Loading...</div>;
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
  const [isSetup, setIsSetup] = useState(true);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/setup/status`)
      .then(async res => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("Setup check failed - Invalid JSON:", text);
          throw new Error(`Server Error: ${res.status} ${res.statusText}`);
        }
      })
      .then(data => {
        if (data.isSetup === false) {
          setIsSetup(false);
        }
      })
      .catch((err) => {
        console.error("Setup check failed", err);
        // If we can't reach the server, assume setup is done (to show login) or show error?
        // Let's assume setup is done so we fall through to Login/Layout which handle their own errors.
        setCheckingSetup(false);
      })
      .finally(() => setCheckingSetup(false));
  }, []);

  if (checkingSetup) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Routes>
      {!isSetup ? (
        <>
          <Route path="/setup" element={<SetupWizard />} />
          <Route path="*" element={<Navigate to="/setup" />} />
        </>
      ) : (
        <>
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
        </>
      )}
    </Routes>
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
