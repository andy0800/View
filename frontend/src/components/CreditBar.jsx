import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Fade,
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import {
  AccountBalanceWallet,
  Refresh,
  TrendingUp,
  TrendingDown,
  Info,
  Close
} from '@mui/icons-material';
import { useCredit } from '../contexts/CreditContext';
import { formatKWD } from '../utils/currencyUtils';

export default function CreditBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
  const [lastChange, setLastChange] = useState(null);
  const [changeDirection, setChangeDirection] = useState(null);

  // Track credit changes for animation
  useEffect(() => {
    if (lastUpdated) {
      setLastChange(new Date());
      // Determine change direction (this is a simplified approach)
      setChangeDirection('stable'); // In a real app, you'd compare with previous value
    }
  }, [credit, lastUpdated]);

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

  const getChangeIcon = () => {
    switch (changeDirection) {
      case 'up':
        return <TrendingUp color="success" fontSize="small" />;
      case 'down':
        return <TrendingDown color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const getChangeColor = () => {
    switch (changeDirection) {
      case 'up':
        return theme.palette.success.main;
      case 'down':
        return theme.palette.error.main;
      default:
        return theme.palette.text.secondary;
    }
  };

  if (loading && credit === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 1,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: '48px'
        }}
      >
        <CircularProgress size={20} />
        <Typography variant="body2" sx={{ ml: 1 }}>
          Loading credit...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Error Alert */}
      <Collapse in={showError}>
        <Alert
          severity="error"
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setShowError(false)}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 1 }}
        >
          {error}
        </Alert>
      </Collapse>

      {/* Main Credit Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: isMobile ? 1 : 1.5,
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: '48px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Left Side - Credit Display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AccountBalanceWallet 
            color="primary" 
            sx={{ fontSize: isMobile ? 20 : 24 }}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant={isMobile ? 'body2' : 'body1'}
              sx={{
                fontWeight: 600,
                color: theme.palette.primary.main,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
              }}
            >
              {getCreditFormatted()}
              {getChangeIcon()}
            </Typography>
            
            {!isMobile && (
              <Chip
                label={getCreditFormattedMicro()}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 1,
                    py: 0.2
                  }
                }}
              />
            )}
          </Box>
        </Box>

        {/* Right Side - Actions & Info */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {/* Last Updated */}
          {!isMobile && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: '0.7rem' }}
            >
              {formatLastUpdated()}
            </Typography>
          )}

          {/* Refresh Button */}
          <Tooltip title="Refresh credit">
            <IconButton
              size="small"
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main
                }
              }}
            >
              {loading ? (
                <CircularProgress size={16} />
              ) : (
                <Refresh fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* Details Toggle */}
          <Tooltip title={showDetails ? 'Hide details' : 'Show details'}>
            <IconButton
              size="small"
              onClick={() => setShowDetails(!showDetails)}
              sx={{
                color: showDetails ? theme.palette.primary.main : theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main
                }
              }}
            >
              <Info fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Change Animation Overlay */}
        {lastChange && (
          <Fade in={true} timeout={500}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: getChangeColor(),
                  fontWeight: 600,
                  textShadow: '0 0 8px rgba(0,0,0,0.3)',
                  animation: 'fadeInOut 2s ease-in-out'
                }}
              >
                {getChangeIcon()}
              </Typography>
            </Box>
          </Fade>
        )}
      </Box>

      {/* Details Panel */}
      <Collapse in={showDetails}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.default',
            borderBottom: `1px solid ${theme.palette.divider}`,
            borderTop: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Credit Details
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Balance (KWD):
              </Typography>
              <Typography variant="body2" fontWeight="600">
                {getCreditFormatted()}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Balance (Micro):
              </Typography>
              <Typography variant="body2" fontWeight="600">
                {getCreditFormattedMicro()}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Last Updated:
              </Typography>
              <Typography variant="body2">
                {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <Chip
                label={loading ? 'Loading' : error ? 'Error' : 'Active'}
                size="small"
                color={loading ? 'warning' : error ? 'error' : 'success'}
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>
      </Collapse>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
          }
        `}
      </style>
    </>
  );
}