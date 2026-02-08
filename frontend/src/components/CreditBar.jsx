import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, RefreshCw, Info, X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useCredit } from '../contexts/CreditContext';
import { formatKWD } from '../utils/currencyUtils';
import { cn } from '../lib/utils';

export default function CreditBar() {
  const {
    credit,
    creditMicro,
    loading,
    error,
    lastUpdated,
    refreshCredit,
    getCreditFormatted,
    getCreditFormattedMicro
  } = useCredit();

  const [showDetails, setShowDetails] = useState(false);
  const [showError, setShowError] = useState(false);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleRefresh = async () => {
    try {
      await refreshCredit();
    } catch (err) {
      console.error('Failed to refresh credit:', err);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const diff = now - lastUpdated;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return lastUpdated.toLocaleDateString();
  };

  /* ── Loading skeleton ── */
  if (loading && credit === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 ring-1 ring-white/20">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
        <span className="text-xs text-white/60">Loading credit...</span>
      </div>
    );
  }

  return (
    <div className="relative flex items-center">

      {/* ── Error toast ── */}
      <AnimatePresence>
        {showError && error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full mt-2 right-0 z-50 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 shadow-lg ring-1 ring-red-200"
          >
            <span className="truncate max-w-[200px]">{error}</span>
            <button onClick={() => setShowError(false)} className="shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main credit pill ── */}
      <motion.div
        layout
        className="flex items-center gap-1.5 rounded-xl bg-white/10 ring-1 ring-white/20 transition-colors hover:bg-white/[0.14]"
      >
        {/* Balance section */}
        <div className="flex items-center gap-1.5 py-1.5 pl-3 pr-1">
          <Wallet className="h-4 w-4 text-amber-400" />
          <motion.span
            key={getCreditFormatted()}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-sm font-semibold text-white tabular-nums"
          >
            {getCreditFormatted()}
          </motion.span>

          {/* Micro units badge – desktop only */}
          <span className="hidden lg:inline-flex items-center rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/60 ring-1 ring-white/20">
            {getCreditFormattedMicro()}
          </span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-white/20" />

        {/* Last updated – desktop only */}
        <span className="hidden md:block px-1 text-[10px] text-white/50 tabular-nums">
          {formatLastUpdated()}
        </span>

        {/* Refresh */}
        <motion.button
          whileTap={{ rotate: 180 }}
          transition={{ duration: 0.3 }}
          onClick={handleRefresh}
          disabled={loading}
          aria-label="Refresh credit"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
            'text-white/50 hover:bg-white/10 hover:text-amber-400',
            loading && 'pointer-events-none'
          )}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </motion.button>

        {/* Info toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowDetails(!showDetails)}
          aria-label="Show details"
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-colors mr-1',
            showDetails
              ? 'bg-amber-500/20 text-amber-400'
              : 'text-white/50 hover:bg-white/10 hover:text-amber-400'
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </motion.button>
      </motion.div>

      {/* ── Details popover ── */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          >
            <p className="mb-3 text-xs font-semibold text-slate-800">Credit Details</p>
            <div className="space-y-2.5">
              <DetailRow label="Balance (KWD)" value={getCreditFormatted()} highlight />
              <DetailRow label="Balance (Micro)" value={getCreditFormattedMicro()} />
              <DetailRow
                label="Last Updated"
                value={lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Status</span>
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
                    loading
                      ? 'bg-amber-50 text-amber-700 ring-amber-200'
                      : error
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  )}
                >
                  {loading ? 'Loading' : error ? 'Error' : 'Active'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span
        className={cn(
          'text-[11px] font-medium tabular-nums',
          highlight ? 'text-blue-700' : 'text-slate-700'
        )}
      >
        {value}
      </span>
    </div>
  );
}
