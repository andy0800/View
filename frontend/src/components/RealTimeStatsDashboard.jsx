import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip, 
  IconButton, 
  Tooltip, 
  useTheme, 
  useMediaQuery,
  Fade,
  LinearProgress
} from '@mui/material';
import { 
  Refresh, 
  TrendingUp, 
  TrendingDown, 
  Visibility, 
  AttachMoney, 
  Campaign,
  Timer,
  Speed,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useRealTimeStats } from '../contexts/RealTimeStatsContext';

const RealTimeStatsDashboard = ({ 
  type = 'all', // 'all', 'dashboard', 'ads', 'profile', 'credit'
  showRefresh = true,
  showAlerts = true,
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { 
    stats, 
    isActive, 
    lastUpdate, 
    refreshStats, 
    refreshAllStats 
  } = useRealTimeStats();

  const handleRefresh = () => {
    if (type === 'all') {
      refreshAllStats();
    } else {
      refreshStats(type);
    }
  };

  const getStatsToShow = () => {
    if (type === 'all') {
      return stats;
    }
    return { [type]: stats[type] };
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toFixed(3) + ' KWD';
  };

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const renderDashboardStats = () => {
    const data = stats.dashboard;
    if (!data) return null;

    return (
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', bgcolor: 'primary.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Visibility sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                {formatNumber(data.totalViews)}
              </Typography>
              <Typography variant="caption">Total Views</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', bgcolor: 'success.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Campaign sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                {data.activeAds}
              </Typography>
              <Typography variant="caption">Active Campaigns</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', bgcolor: 'warning.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <AttachMoney sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                {formatCurrency(data.totalSpent)}
              </Typography>
              <Typography variant="caption">Total Spent</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={6} sm={3}>
          <Card sx={{ height: '100%', bgcolor: 'info.light', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <TrendingUp sx={{ fontSize: 30, mb: 1 }} />
              <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
                {data.todayViews}
              </Typography>
              <Typography variant="caption">Today's Views</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderAdsStats = () => {
    const data = stats.ads;
    if (!data) return null;

    return (
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Campaign Overview</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Active:</Typography>
                <Chip label={data.activeAds} color="success" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Paused:</Typography>
                <Chip label={data.pausedAds} color="warning" size="small" />
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Completed:</Typography>
                <Chip label={data.completedAds} color="info" size="small" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Performance</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Views:</Typography>
                <Typography variant="h6">{formatNumber(data.totalViews)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Spent:</Typography>
                <Typography variant="h6">{formatCurrency(data.totalSpent)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Avg. ROI:</Typography>
                <Typography variant="h6" color="success.main">{data.averageROI}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Budget Alerts</Typography>
              {data.budgetAlerts && data.budgetAlerts.length > 0 ? (
                <Box>
                  {data.budgetAlerts.slice(0, 3).map((alert, index) => (
                    <Box key={index} display="flex" alignItems="center" gap={1} mb={1}>
                      <Warning color="warning" fontSize="small" />
                      <Typography variant="body2" noWrap>
                        {alert.title} ({alert.usage}%)
                      </Typography>
                    </Box>
                  ))}
                  {data.budgetAlerts.length > 3 && (
                    <Typography variant="caption" color="textSecondary">
                      +{data.budgetAlerts.length - 3} more alerts
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main">
                    No budget alerts
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderProfileStats = () => {
    const data = stats.profile;
    if (!data) return null;

    return (
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Business Metrics</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Views:</Typography>
                <Typography variant="h6">{formatNumber(data.totalViews)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Active Campaigns:</Typography>
                <Typography variant="h6">{data.activeAds}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Spent:</Typography>
                <Typography variant="h6">{formatCurrency(data.totalSpent)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">KYC Status:</Typography>
                <Chip 
                  label={data.kycStatus} 
                  color={getStatusColor(data.kycStatus)}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Performance Metrics</Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Conversion Rate</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {data.conversionRate}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={parseFloat(data.conversionRate)} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Average ROI</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {data.averageROI}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(parseFloat(data.averageROI) * 10, 100)} 
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderCreditStats = () => {
    const data = stats.credit;
    if (!data) return null;

    return (
      <Grid container spacing={isMobile ? 1.5 : 2}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Credit Overview</Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Current Balance:</Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(data.currentBalance)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Total Spent:</Typography>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(data.totalSpent)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Active Campaigns:</Typography>
                <Typography variant="h6">{data.activeCampaigns}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Daily Avg. Spend:</Typography>
                <Typography variant="h6">{formatCurrency(data.averageDailySpend)}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Spending Analysis</Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Credit Utilization</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {data.creditUtilization.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={data.creditUtilization}
                  color={data.creditUtilization > 80 ? 'warning' : 'success'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Monthly Projection</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(data.projectedMonthlySpend)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Based on current spending patterns
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderAlerts = () => {
    if (!showAlerts) return null;

    const allAlerts = [];
    
    // Collect alerts from all stat types
    if (stats.ads?.budgetAlerts) {
      allAlerts.push(...stats.ads.budgetAlerts.map(alert => ({
        ...alert,
        type: 'budget',
        severity: 'warning'
      })));
    }
    
    if (stats.credit?.creditAlerts) {
      allAlerts.push(...stats.credit.creditAlerts);
    }

    if (allAlerts.length === 0) return null;

    return (
      <Box mb={3}>
        {allAlerts.slice(0, 3).map((alert, index) => (
          <Box 
            key={index}
            display="flex" 
            alignItems="center" 
            gap={1}
            p={2}
            border={1}
            borderColor="divider"
            borderRadius={1}
            mb={1}
            bgcolor={alert.severity === 'error' ? 'error.light' : 'warning.light'}
          >
            <Warning color={alert.severity} fontSize="small" />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {alert.message}
            </Typography>
          </Box>
        ))}
        {allAlerts.length > 3 && (
          <Typography variant="caption" color="textSecondary">
            +{allAlerts.length - 3} more alerts
          </Typography>
        )}
      </Box>
    );
  };

  const renderStats = () => {
    const statsToShow = getStatsToShow();
    
    if (type === 'all' || type === 'dashboard') {
      return renderDashboardStats();
    } else if (type === 'ads') {
      return renderAdsStats();
    } else if (type === 'profile') {
      return renderProfileStats();
    } else if (type === 'credit') {
      return renderCreditStats();
    }
    
    return null;
  };

  return (
    <Box sx={sx}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            📊 Real-time Statistics
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Live campaign performance and analytics
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Chip 
            label={isActive ? 'Live Updates ON' : 'Live Updates OFF'} 
            color={isActive ? 'success' : 'default'}
            size="small"
          />
          {showRefresh && (
            <Tooltip title="Refresh statistics">
              <IconButton onClick={handleRefresh} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Last Updated */}
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Typography variant="caption" color="textSecondary">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Alerts */}
      {renderAlerts()}

      {/* Statistics */}
      <Fade in={true} timeout={500}>
        <Box>
          {renderStats()}
        </Box>
      </Fade>
    </Box>
  );
};

export default RealTimeStatsDashboard;
