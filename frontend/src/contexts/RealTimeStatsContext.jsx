import React, { createContext, useContext, useState, useEffect } from 'react';

const RealTimeStatsContext = createContext();

export function RealTimeStatsProvider({ children }) {
  const [stats, setStats] = useState({
    totalViews: 0,
    totalEarnings: 0,
    activeAds: 0,
    totalUsers: 0
  });

  const [loading, setLoading] = useState(false);

  // Update stats function
  const updateStats = (newStats) => {
    setStats(prev => ({ ...prev, ...newStats }));
  };

  // Reset stats function
  const resetStats = () => {
    setStats({
      totalViews: 0,
      totalEarnings: 0,
      activeAds: 0,
      totalUsers: 0
    });
  };

  const value = {
    stats,
    loading,
    updateStats,
    resetStats,
    setLoading
  };

  return (
    <RealTimeStatsContext.Provider value={value}>
      {children}
    </RealTimeStatsContext.Provider>
  );
}

export function useRealTimeStats() {
  const context = useContext(RealTimeStatsContext);
  if (!context) {
    throw new Error('useRealTimeStats must be used within a RealTimeStatsProvider');
  }
  return context;
}
