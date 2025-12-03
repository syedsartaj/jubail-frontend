
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/ui/Layout';

// Customer Pages
import Home from './pages/customer/Home';
import Shop from './pages/customer/Shop';
import Checkout from './pages/customer/Checkout';
import MyBookings from './pages/customer/MyBookings';
import CustomerLogin from './pages/customer/Login';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTickets from './pages/admin/Tickets';
import AdminSlots from './pages/admin/Slots';
import AdminScanner from './pages/admin/Scanner';
import AdminStaff from './pages/admin/Staff';
import AdminActivities from './pages/admin/Activities';

import { AuthService } from './services/auth';

const PrivateAdminRoute = ({ children }: { children: React.ReactElement }) => {
  const user = AuthService.getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

const PrivateCustomerRoute = ({ children }: { children: React.ReactElement }) => {
  const user = AuthService.getCurrentUser();
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Customer Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<CustomerLogin />} />
          
          {/* Protected Customer Routes */}
          <Route path="/my-bookings" element={
            <PrivateCustomerRoute>
              <MyBookings />
            </PrivateCustomerRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          <Route path="/admin" element={
            <PrivateAdminRoute>
              <AdminDashboard />
            </PrivateAdminRoute>
          } />
          <Route path="/admin/tickets" element={
            <PrivateAdminRoute>
              <AdminTickets />
            </PrivateAdminRoute>
          } />
          <Route path="/admin/slots" element={
            <PrivateAdminRoute>
              <AdminSlots />
            </PrivateAdminRoute>
          } />
          <Route path="/admin/scan" element={
            <PrivateAdminRoute>
              <AdminScanner />
            </PrivateAdminRoute>
          } />
          <Route path="/admin/staff" element={
            <PrivateAdminRoute>
              <AdminStaff />
            </PrivateAdminRoute>
          } />
          <Route path="/admin/activities" element={
            <PrivateAdminRoute>
              <AdminActivities />
            </PrivateAdminRoute>
          } />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
