// frontend/src/App.jsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthForms        from './components/AuthForms';

// layouts
import ViewerLayout     from './components/ViewerLayout';
import AdvertiserLayout from './components/AdvertiserLayout';

// new viewer pages
import MainPage    from './pages/MainPage';
import VideoPage   from './pages/VideoPage';
import CreditPage  from './pages/CreditPage';
import ProfilePage from './pages/ProfilePage';

// advertiser pages
import AdvertiserAds      from './pages/AdvertiserAds';
import AdvertiserActivate from './pages/AdvertiserActivate';
import AdvertiserPackages from './pages/AdvertiserPackages';
import AdvertiserCredit   from './pages/AdvertiserCredit';
import AdvertiserProfile  from './pages/AdvertiserProfile';

// admin pages
import AdminLogin        from './pages/AdminLogin';
import AdminDashboard    from './pages/AdminDashboard';
import AdminUsers        from './pages/AdminUsers';
import AdminVerify       from './pages/AdminVerify';
import AdminWithdrawals  from './pages/AdminWithdrawals';
import AdminTransactions from './pages/AdminTransactions';
import AdminVideos       from './pages/AdminVideos';

function PrivateRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
        <Routes>

          {/* Public landing / login / register */}
          <Route path="/" element={<AuthForms />} />

          {/* Viewer Dashboard */}
          <Route
            path="/viewer/*"
            element={
              <PrivateRoute role="viewer">
                <ViewerLayout />
              </PrivateRoute>
            }
          >
            {/* entry → MainPage */}
            <Route index             element={<MainPage />} />

            {/* video‐browsing flow */}
            <Route path="browse/:id" element={<VideoPage />} />

            {/* wallet → CreditPage */}
            <Route path="wallet"     element={<CreditPage />} />

            {/* profile → ProfilePage */}
            <Route path="profile"    element={<ProfilePage />} />

            {/* any other → back to /viewer */}
            <Route path="*"          element={<Navigate to="" replace />} />
          </Route>

          {/* Advertiser Dashboard */}
          <Route
            path="/advertiser/*"
            element={
              <PrivateRoute role="advertiser">
                <AdvertiserLayout />
              </PrivateRoute>
            }
          >
            <Route index               element={<Navigate to="ads" replace />} />
            <Route path="ads"          element={<AdvertiserAds />} />
            <Route path="activate"     element={<AdvertiserActivate />} />
            <Route path="packages"     element={<AdvertiserPackages />} />
            <Route path="credit"       element={<AdvertiserCredit />} />
            <Route path="profile"      element={<AdvertiserProfile />} />
            <Route path="*"            element={<Navigate to="ads" replace />} />
          </Route>

          {/* Admin Login */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Admin Console */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            }
          >
            <Route index               element={<Navigate to="users" replace />} />
            <Route path="users"        element={<AdminUsers />} />
            <Route path="kyc"          element={<AdminVerify />} />
            <Route path="withdrawals"  element={<AdminWithdrawals />} />
            <Route path="transactions" element={<AdminTransactions />} />
            <Route path="videos"       element={<AdminVideos />} />
            <Route path="*"            element={<Navigate to="users" replace />} />
          </Route>

          {/* catch‐all → home */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
    </AuthProvider>
  );
}