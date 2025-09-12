// frontend/src/App.jsx

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/browserCompatibility.css';
import './styles/mobile.css';
import { initConsoleErrorSuppression } from './utils/consoleUtils';
import CreativeMainPage from './components/CreativeMainPage.jsx';
import AuthForms from './components/AuthForms.jsx';

import MainPage from './pages/MainPage.jsx';
import VideoPage from './pages/VideoPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import CreditPage from './pages/CreditPage.jsx';
import AdvertiserDashboard from './pages/AdvertiserDashboard.jsx';
import AdvertiserAds from './pages/AdvertiserAds.jsx';
import AdvertiserProfile from './pages/AdvertiserProfile.jsx';
import AdvertiserCredit from './pages/AdvertiserCredit.jsx';
import AdvertiserPackages from './pages/AdvertiserPackages.jsx';
import AdvertiserActivate from './pages/AdvertiserActivate.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminVideos from './pages/AdminVideos.jsx';
import AdminTransactions from './pages/AdminTransactions.jsx';
import AdminWithdrawals from './pages/AdminWithdrawals.jsx';
import AdminAppeals from './pages/AdminAppeals.jsx';
import AdminVerify from './pages/AdminVerify.jsx';
import AdminVerificationDashboard from './components/AdminVerificationDashboard.jsx';
import CompanyDashboard from './pages/CompanyDashboard.jsx';
import AdminSettings from './pages/AdminSettings.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import ViewerLayout from './components/ViewerLayout.jsx';
import AdvertiserLayout from './components/AdvertiserLayout.jsx';
import { useTranslation } from 'react-i18next';
import SectionVideos from './components/SectionVideos';

export default function App() {
  console.log('App component rendering...');
  const { t } = useTranslation();
  
  // Initialize console error suppression
  useEffect(() => {
    initConsoleErrorSuppression();
  }, []);
  
  return (
    <Routes>
             {/* Public routes */}
       <Route path="/" element={<CreativeMainPage />} />
       <Route path="/auth" element={<AuthForms />} />
      
      {/* Viewer routes with nested layout */}
      <Route path="/viewer" element={
        <PrivateRoute allowedRoles={['viewer']}>
          <ViewerLayout />
        </PrivateRoute>
      }>
        <Route index element={<MainPage />} />
        <Route path="section/:sectionKey" element={<SectionVideos />} />
        <Route path="ad/:adId" element={<VideoPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="credit" element={<CreditPage />} />
      </Route>
      
      {/* Profile and Credits routes (these should be nested under viewer) */}
      <Route path="/profile" element={
        <PrivateRoute allowedRoles={['viewer']}>
          <ViewerLayout />
        </PrivateRoute>
      }>
        <Route index element={<ProfilePage />} />
      </Route>
      
      <Route path="/credits" element={
        <PrivateRoute allowedRoles={['viewer']}>
          <ViewerLayout />
        </PrivateRoute>
      }>
        <Route index element={<CreditPage />} />
      </Route>
      
      {/* Advertiser routes with nested layout */}
      <Route path="/advertiser" element={
        <PrivateRoute allowedRoles={['advertiser']}>
          <AdvertiserLayout />
        </PrivateRoute>
      }>
        <Route index element={<AdvertiserDashboard />} />
        <Route path="ads" element={<AdvertiserAds />} />
        <Route path="profile" element={<AdvertiserProfile />} />
        <Route path="credit" element={<AdvertiserCredit />} />
        <Route path="packages" element={<AdvertiserPackages />} />
        <Route path="activate" element={<AdvertiserActivate />} />
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={
        <PrivateRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </PrivateRoute>
      }>
        <Route index element={<div>{t('admin.adminDashboard')} - {t('admin.selectOptionFromMenu')}</div>} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="videos" element={<AdminVideos />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="withdrawals" element={<AdminWithdrawals />} />
        <Route path="appeals" element={<AdminAppeals />} />
        <Route path="verify" element={<AdminVerify />} />
        <Route path="ad-verification" element={<AdminVerificationDashboard />} />
        <Route path="company" element={<CompanyDashboard />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      
      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}