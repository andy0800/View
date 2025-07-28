// src/api/viewer.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4001';
/** Fetch current wallet balance */
export async function getWalletBalance() {
  const res = await fetch(`${API_BASE}/viewer/wallet`);
  if (!res.ok) throw new Error("Failed to fetch wallet balance");
  const { balance } = await res.json();
  return balance;
}

/** Add credits to wallet */
export async function addCredits(amount) {
  const res = await fetch(`${API_BASE}/viewer/wallet/credit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) throw new Error("Failed to add credits");
  const { balance } = await res.json();
  return balance;
}

export async function getSections() {
  const { data } = await axios.get(`${API_BASE}/api/sections`);
  return data;
}

export async function getVideos(sectionId) {
  const { data } = await axios.get(`${API_BASE}/api/sections/${sectionId}/videos`);
  return data;
}

export async function getCredit() {
  const { data } = await axios.get(`${API_BASE}/credit`);
  return data;
}

export async function withdrawCredit(amount) {
  const { data } = await axios.post(`${API_BASE}/withdraw`, { amount });
  return data;
}