// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import { NotificationProvider } from './hooks/useNotifications';

// Simple test component untuk sementara
const SimpleDashboard = () => (
  <div className="p-8">
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
    <p className="text-gray-500 mt-4">Konten dashboard akan muncul di sini.</p>
  </div>
);

// Lazy load pages
const LoginPage = lazy(() => import('./pages/Login'));

// Member Pages
const MemberDashboard = lazy(() => import('./pages/member/MemberDashboard'));
const MemberSavings = lazy(() => import('./pages/member/Savings'));
const MemberLoans = lazy(() => import('./pages/member/Loans'));
const MemberHistory = lazy(() => import('./pages/member/History'));
const MemberSHU = lazy(() => import('./pages/member/SHU'));
const MemberDocuments = lazy(() => import('./pages/member/Documents'));
const MemberProfile = lazy(() => import('./pages/member/Profile'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const MemberManagement = lazy(() => import('./pages/admin/MemberManagement'));
const FinancialManagement = lazy(() => import('./pages/admin/FinancialManagement'));
const Approvals = lazy(() => import('./pages/admin/Approvals'));
const LoanArchives = lazy(() => import('./pages/admin/LoanArchives'));
const DeductionExport = lazy(() => import('./pages/admin/DeductionExport'));
const AdminDocuments = lazy(() => import('./pages/admin/Documents'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-900">
    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles?: string[] 
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  console.log('ProtectedRoute - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  const userRole = user?.role?.name || user?.role || 'member';
  console.log('User role:', userRole, 'Allowed roles:', allowedRoles);
  
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log('Role not allowed, redirecting');
    const defaultRoute = userRole === 'member' ? '/member' : '/admin';
    return <Navigate to={defaultRoute} replace />;
  }
  
  console.log('Access granted to protected route');
  return <>{children}</>;
};

// Layout wrapper yang lebih sederhana untuk test
const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  console.log('LayoutWrapper rendering');
  return <Layout>{children}</Layout>;
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  console.log('AppContent - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);

  if (isLoading) {
    return <PageLoader />;
  }

  const getDefaultRoute = () => {
    const role = user?.role?.name || user?.role;
    if (['admin', 'ketua', 'bendahara', 'sekretaris', 'pengawas'].includes(role || '')) {
      return '/admin';
    }
    return '/member';
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />
        } />
        
        {/* Member Routes dengan Layout */}
        <Route path="/member" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Layout>
              <MemberDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/member/savings" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Layout>
              <MemberSavings />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/member/loans" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Layout>
              <MemberLoans />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/member/history" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Layout>
              <MemberHistory />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/member/shu" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Layout>
              <MemberSHU />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/member/documents" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Layout>
              <MemberDocuments />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/member/profile" element={
          <ProtectedRoute allowedRoles={['member']}>
            <Layout>
              <MemberProfile />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Admin Routes dengan Layout */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin', 'ketua', 'bendahara', 'sekretaris']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/members" element={
          <ProtectedRoute allowedRoles={['admin', 'ketua', 'sekretaris', 'bendahara']}>
            <Layout>
              <MemberManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/financial" element={
          <ProtectedRoute allowedRoles={['admin', 'ketua', 'bendahara']}>
            <Layout>
              <FinancialManagement />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/approvals" element={
          <ProtectedRoute allowedRoles={['admin', 'ketua', 'bendahara']}>
            <Layout>
              <Approvals />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/loan-archives" element={
          <ProtectedRoute allowedRoles={['admin', 'ketua', 'sekretaris']}>
            <Layout>
              <LoanArchives />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/deductions" element={
          <ProtectedRoute allowedRoles={['admin', 'bendahara']}>
            <Layout>
              <DeductionExport />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/documents" element={
          <ProtectedRoute allowedRoles={['admin', 'ketua', 'sekretaris']}>
            <Layout>
              <AdminDocuments />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRoles={['admin', 'ketua', 'bendahara']}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/audit" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AuditLog />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin', 'ketua', 'bendahara', 'sekretaris']}>
            <Layout>
              <AdminSettings />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;