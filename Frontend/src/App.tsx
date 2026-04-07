import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NotificationProvider } from './hooks/useNotifications';
import Layout from './components/layout/Layout';

// Lazy load pages for performance
const LoginPage = lazy(() => import('./pages/Login'));
const MemberDashboard = lazy(() => import('./pages/member/MemberDashboard'));
const Profile = lazy(() => import('./pages/member/Profile'));
const Savings = lazy(() => import('./pages/member/Savings'));
const Loans = lazy(() => import('./pages/member/Loans'));
const History = lazy(() => import('./pages/member/History'));
const Documents = lazy(() => import('./pages/member/Documents'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const MemberManagement = lazy(() => import('./pages/admin/MemberManagement'));
const FinancialManagement = lazy(() => import('./pages/admin/FinancialManagement'));
const Approvals = lazy(() => import('./pages/admin/Approvals'));
const AdminDocuments = lazy(() => import('./pages/admin/Documents'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-900">
    <div className="w-10 h-10 border-4 border-imigrasi-primary/20 border-t-imigrasi-primary rounded-full animate-spin"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'admin' | 'member' }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/member'} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated 
              ? <Navigate to={user?.role === 'admin' ? '/admin' : '/member'} replace /> 
              : <LoginPage />
          } 
        />
        
        {/* Member Routes */}
        <Route path="/member" element={
          <ProtectedRoute role="member">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<MemberDashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="savings" element={<Savings />} />
          <Route path="loans" element={<Loans />} />
          <Route path="history" element={<History />} />
          <Route path="documents" element={<Documents />} />
          <Route path="*" element={<Navigate to="/member" replace />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<MemberManagement />} />
          <Route path="finance" element={<FinancialManagement />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-log" element={<AuditLog />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
