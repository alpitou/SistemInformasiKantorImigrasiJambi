import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import { NotificationProvider } from './hooks/useNotifications';

const LoginPage = lazy(() => import('./pages/Login'));
const MemberDashboard = lazy(() => import('./pages/member/MemberDashboard'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const MemberManagement = lazy(() => import('./pages/admin/MemberManagement'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-neutral-900">
    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
  </div>
);

const AppContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    console.log('AppContent - Auth state:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  const isAdminRole = () => {
    const role = user?.role?.name;
    return ['admin', 'ketua', 'bendahara', 'pengawas'].includes(role || '');
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? (
              <Navigate to={isAdminRole() ? '/admin' : '/member'} replace />
            ) : (
              <LoginPage />
            )
          } 
        />
        
        <Route path="/member" element={
          isAuthenticated && !isAdminRole() ? <Layout /> : <Navigate to="/login" replace />
        }>
          <Route index element={<MemberDashboard />} />
        </Route>

        <Route path="/admin" element={
          isAuthenticated && isAdminRole() ? <Layout /> : <Navigate to="/login" replace />
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<MemberManagement />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
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