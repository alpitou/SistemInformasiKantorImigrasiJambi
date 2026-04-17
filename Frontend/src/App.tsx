// src/App.tsx
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import { NotificationProvider } from './hooks/useNotifications';

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

// Role definitions
const MEMBER_ROLES = ['anggota'];  // Hanya 'anggota' untuk member
const ADMIN_ROLES = ['admin', 'ketua', 'bendahara', 'sekretaris'];  // Semua role admin

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
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  let userRole = user?.role?.name || user?.role || 'anggota';
  if (userRole === 'anggota') {
    userRole = 'member';
  }
  
  // Jika tidak ada allowedRoles, izinkan semua
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }
  
  // Cek apakah user role termasuk dalam allowedRoles
  if (allowedRoles.includes(userRole)) {
    return <>{children}</>;
  }
  
  // Redirect jika tidak memiliki akses
  const isMember = MEMBER_ROLES.includes(userRole);
  const defaultRoute = isMember ? '/member' : '/admin';
  return <Navigate to={defaultRoute} replace />;
};

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  const getDefaultRoute = () => {
    let role = user?.role?.name || user?.role;
    if (role === 'anggota') role = 'member';
    
    if (ADMIN_ROLES.includes(role || '')) {
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
        
        {/* Layout membungkus semua route yang membutuhkan sidebar */}
        <Route element={<Layout />}>
          {/* Member Routes - hanya untuk role member */}
          <Route path="/member" element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/member/savings" element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberSavings />
            </ProtectedRoute>
          } />
          
          <Route path="/member/loans" element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberLoans />
            </ProtectedRoute>
          } />
          
          <Route path="/member/history" element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberHistory />
            </ProtectedRoute>
          } />
          
          <Route path="/member/shu" element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberSHU />
            </ProtectedRoute>
          } />
          
          <Route path="/member/documents" element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberDocuments />
            </ProtectedRoute>
          } />
          
          <Route path="/member/profile" element={
            <ProtectedRoute allowedRoles={['member']}>
              <MemberProfile />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes - untuk semua role admin */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/members" element={
            <ProtectedRoute allowedRoles={['admin', 'ketua', 'sekretaris']}>
              <MemberManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/financial" element={
            <ProtectedRoute allowedRoles={['admin', 'ketua', 'bendahara']}>
              <FinancialManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/approvals" element={
            <ProtectedRoute allowedRoles={['admin', 'ketua', 'bendahara']}>
              <Approvals />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/loan-archives" element={
            <ProtectedRoute allowedRoles={['admin', 'ketua', 'sekretaris', 'pengawas']}>
              <LoanArchives />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/deductions" element={
            <ProtectedRoute allowedRoles={['admin', 'bendahara']}>
              <DeductionExport />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/documents" element={
            <ProtectedRoute allowedRoles={['admin', 'ketua', 'sekretaris']}>
              <AdminDocuments />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <Reports />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/audit" element={
            <ProtectedRoute allowedRoles={['admin', 'pengawas']}>
              <AuditLog />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <AdminSettings />
            </ProtectedRoute>
          } />
        </Route>
        
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