// frontend/src/api/viewer.js
import axios from 'axios';

// Base API URL (from .env or fallback to localhost)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';

/** Optional fallback for fetch requests (if needed) */
function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** ✅ Axios instance configured to send cookies automatically */
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true // ✅ REQUIRED for cookie-based auth
});

// ----------------------------
// WALLET + CREDIT OPERATIONS
// ----------------------------

/** Get the current wallet balance (confirmed & pending) */
export async function getWalletBalance() {
  const res = await api.get('/api/wallet');
  return res.data;
}

/** Submit a withdrawal request (redeem points) */
export async function withdrawCredit(amount) {
  const res = await api.post('/api/wallet/withdraw', { amount });
  return res.data;
}

/** Start watching an ad (creates view event with proof token) */
export async function startWatchingAd(adId) {
  try {
    const res = await api.post(`/api/viewer/ads/${adId}/start`);
    return res.data;
  } catch (error) {
    console.error('Error starting ad watch:', error);
    throw error;
  }
}

/** Complete watching an ad and process rewards */
export async function completeWatchingAd(adId, proofToken, watchedDurationMs) {
  try {
    const res = await api.post(`/api/viewer/ads/${adId}/complete`, {
      adId,
      proofToken,
      watchedDurationMs
    });
    return res.data;
  } catch (error) {
    console.error('Error completing ad watch:', error);
    throw error;
  }
}

/** ✅ UPDATED: Use new viewer wallet reward endpoint */
// Deprecated: use startWatchingAd + completeWatchingAd instead

/** Used by CreditContext to get wallet credit */
export async function getCredit() {
  return getWalletBalance(); // same result
}

/** Admin/test: manually add credits (if endpoint exists) */
export async function addCredits(amount) {
  const res = await api.post('/api/wallet/credit', { amount });
  return res.data;
}

// ----------------------------
// SECTION + VIDEO OPERATIONS
// ----------------------------

/** ✅ Fetch all available business sections */
export async function getSections() {
  const res = await api.get('/api/viewer/sections');
  return res.data;
}

/** ✅ Fetch all videos inside a section */
export async function getVideos(sectionKey) {
  const res = await api.get(`/api/viewer/sections/${sectionKey}/videos`);
  return res.data;
}

/** ✅ Fetch all uploaded ads randomly (for the "All Ads" tab) */
export async function getAllAdsRandomly(page = 1, limit = 20) {
  const res = await api.get(`/api/viewer/all-ads?page=${page}&limit=${limit}`);
  return res.data;
}

export const getVideosBySection = async (sectionKey) => {
  try {
    const res = await api.get(`/api/viewer/sections/${sectionKey}/videos`);
    return res.data;
  } catch (error) {
    console.error('Error fetching videos by section:', error);
    throw error;
  }
};

// ----------------------------
// PROFILE OPERATIONS
// ----------------------------

/** Get viewer profile information */
export async function getViewerProfile() {
  const res = await api.get('/api/viewer/profile');
  return res.data;
}

/** Get viewer statistics */
export async function getViewerStats() {
  const res = await api.get('/api/viewer/stats');
  return res.data;
}

// ----------------------------
// TRANSACTION OPERATIONS
// ----------------------------

/** Get wallet transactions */
export async function getWalletTransactions() {
  const res = await api.get('/api/wallet/transactions');
  return res.data;
}