import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Container,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Zoom,
  CardActions,
  CardMedia,
  Avatar,
  Badge,
  Tooltip,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  CheckCircle, 
  Visibility, 
  AttachMoney, 
  Timer, 
  TrendingUp, 
  ShoppingCart,
  Star,
  Business,
  Calculate,
  PlayArrow,
  MonetizationOn,
  People,
  Speed,
  Security,
  Analytics,
  Campaign,
  FlashOn,
  LocalFireDepartment,
  Rocket,
  Bolt
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { formatKWD, isValidBudget, getNextValidBudget, getPreviousValidBudget, calculateEstimatedViews } from '../utils/currencyUtils';
import api from '../api';
import PackagePaymentModal from '../components/PackagePaymentModal';

export default function AdvertiserPackages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [budget, setBudget] = useState(300); // Start at 300 KWD as per original VIEW APP
  const [purchasedPackages, setPurchasedPackages] = useState([]);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [packageToPurchase, setPackageToPurchase] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { t } = useTranslation();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Define unique color schemes for each package at component level
  const colorSchemes = [
    {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#45B7D1',
      gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
      icon: <FlashOn />,
      name: 'Lightning'
    },
    {
      primary: '#A8E6CF',
      secondary: '#DCEDC1',
      accent: '#FFD3B6',
      gradient: 'linear-gradient(135deg, #A8E6CF, #7FCDCD)',
      icon: <LocalFireDepartment />,
      name: 'Fire'
    },
    {
      primary: '#FFB6C1',
      secondary: '#DDA0DD',
      accent: '#98FB98',
      gradient: 'linear-gradient(135deg, #FFB6C1, #FF69B4)',
      icon: <Rocket />,
      name: 'Rocket'
    },
    {
      primary: '#87CEEB',
      secondary: '#B0E0E6',
      accent: '#F0E68C',
      gradient: 'linear-gradient(135deg, #87CEEB, #4682B4)',
      icon: <Bolt />,
      name: 'Speed'
    }
  ];

  // Add optimized CSS animations
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      @keyframes float {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
        100% { transform: translateY(0px); }
      }
      @keyframes glow {
        0% { box-shadow: 0 0 5px rgba(0,0,0,0.1); }
        50% { box-shadow: 0 0 15px rgba(0,0,0,0.15); }
        100% { box-shadow: 0 0 5px rgba(0,0,0,0.1); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    setError('');
    setSuccess('');
    fetchPackages();
    
    return () => {
      setError('');
      setSuccess('');
    };
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('🔄 Fetching packages...');
      console.log('🔐 Current user:', JSON.parse(localStorage.getItem('user') || 'null'));
      
      const [packagesRes, purchasedRes] = await Promise.all([
        api.get('/api/advertiser/packages'),
        api.get('/api/advertiser/packages/purchased')
      ]);
      
      console.log('📦 Packages API Response:', packagesRes);
      console.log('📦 Packages Data:', packagesRes.data);
      console.log('📦 Purchased API Response:', purchasedRes);
      console.log('📦 Purchased Data:', purchasedRes.data);
      
      const packagesData = packagesRes.data || [];
      const purchasedData = purchasedRes.data.purchasedPackages || [];
      
      console.log('📦 Processed Packages Data:', packagesData);
      console.log('📦 Processed Purchased Data:', purchasedData);
      console.log('📦 Packages Length:', packagesData.length);
      console.log('📦 Packages Data Type:', typeof packagesData);
      console.log('📦 Is Array:', Array.isArray(packagesData));
      console.log('📦 First Package:', packagesData[0]);
      console.log('📦 Packages Keys:', packagesData.length > 0 ? Object.keys(packagesData[0]) : 'No packages');
      
      setPackages(packagesData);
      setPurchasedPackages(purchasedData);
      
      // Additional debugging after state update
      setTimeout(() => {
        console.log('📦 State after update - packages:', packages);
        console.log('📦 State after update - packages.length:', packages.length);
      }, 100);
      
      // Set initial budget to 300 KWD as per original VIEW APP
      if (packagesData.length > 0) {
        setBudget(300);
      }
    } catch (err) {
      console.error('❌ Error fetching packages:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      setError(t('errors.failedToLoadPackages'));
    } finally {
      setLoading(false);
    }
  };

  const handlePackageSelect = (pkg) => {
    setPackageToPurchase(pkg);
    setBudget(300); // Reset to 300 KWD when selecting package
    setSuccess('');
    setError('');
    setPurchaseDialogOpen(true);
  };

  // TEMPORARY: Handle package purchase through payment gateway - REVERSIBLE
  const handlePackagePurchase = (pkg) => {
    setPackageToPurchase(pkg);
    setBudget(300);
    setSuccess('');
    setError('');
    setPurchaseDialogOpen(false);
    setPaymentModalOpen(true);
  };

  // ORIGINAL VIEW APP LOGIC: Increment budget by 100 KWD
  const handleIncrementBudget = () => {
    const nextBudget = getNextValidBudget(budget);
    setBudget(nextBudget);
    setSuccess('');
    setError('');
  };

  // ORIGINAL VIEW APP LOGIC: Decrement budget by 100 KWD (minimum 300 KWD)
  const handleDecrementBudget = () => {
    const prevBudget = getPreviousValidBudget(budget);
    if (prevBudget >= 300) {
      setBudget(prevBudget);
      setSuccess('');
      setError('');
    }
  };

  // Calculate estimated views based on ORIGINAL VIEW APP LOGIC
  const calculateEstimatedViewsForPackage = (pkg, budgetAmount) => {
    if (!pkg || !budgetAmount) return 0;
    return calculateEstimatedViews(budgetAmount, pkg.pricePerViewMicro || pkg.price_per_view_micro);
  };

  const handlePurchase = async (pkg) => {
    try {
      setPurchasing(true);
      setError('');
      setSuccess('');
      
      // Validate package is selected
      if (!pkg || !pkg.id) {
        setError('Please select a package first');
        return;
      }
      
      // Validate budget is set
      if (!budget || budget === 0) {
        setError('Please set a budget amount');
        return;
      }
      
        // Enhanced budget validation with detailed feedback
      if (!isValidBudget(budget)) {
        let errorMessage = t('errors.budgetIncrementRule');
    
    if (budget < 300) {
      errorMessage = `Minimum budget is 300 KWD. You entered ${budget} KWD.`;
    } else if ((budget - 300) % 100 !== 0) {
      const nextValidBudget = getNextValidBudget(budget);
      const prevValidBudget = getPreviousValidBudget(budget);
      errorMessage = `Budget must increment by 100 KWD from 300 KWD. Valid options: ${prevValidBudget}, ${nextValidBudget}, or any multiple of 100 from 300.`;
    }
    
    setError(errorMessage);
        return;
      }
      
      // TEMPORARY: Use payment gateway modal instead of direct purchase - REVERSIBLE
      setPurchaseDialogOpen(false);
      setPackageToPurchase(pkg);
      setPaymentModalOpen(true);
      
      // ORIGINAL CODE (commented out for reversal):
      // // Call backend to purchase package with chosen budget
      // const response = await api.post('/api/advertiser/packages/purchase', {
      //   packageId: pkg.id,
      //   budget: budget
      // });
      // 
      // if (response.data.success) {
      //   setSuccess(t('success.packagePurchased', { 
      //     package: pkg.name, 
      //     budget: budget,
      //     views: response.data.purchasedPackage.estimatedViews
      //   }));
      //   
      //   // Close dialog
      //   setPurchaseDialogOpen(false);
      //   setPackageToPurchase(null);
      //   
      //   // Refresh purchased packages list
      //   await fetchPackages();
      //   
      //   // Reset form
      //   setSelectedPackage(null);
      //   setBudget(300);
      //   
      //   // Redirect to activate page after successful purchase
      //   setTimeout(() => {
      //     navigate('/advertiser/activate');
      //   }, 1500); // Give user time to see success message
      // } else {
      //   setError(response.data.message || t('errors.purchaseFailed'));
      // }
    } catch (err) {
      setError(err.response?.data?.message || t('errors.purchaseFailed'));
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" color="text.secondary">
            Loading packages...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we fetch your available packages
          </Typography>
        </Box>
      </Container>
    );
  }

  console.log('🎯 Render - packages state:', packages);
  console.log('🎯 Render - packages.length:', packages.length);
  console.log('🎯 Render - loading:', loading);
  console.log('🎯 Render - packages type:', typeof packages);
  console.log('🎯 Render - is packages array:', Array.isArray(packages));
  console.log('🎯 Render - packages content:', packages);

  if (packages.length === 0) {
    console.log('🚫 No packages found, showing empty state');
    console.log('🚫 Packages value:', packages);
    console.log('🚫 Packages length check:', packages.length === 0);
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
          <Campaign sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            {t('packages.noPackagesAvailable')}
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 500 }}>
            {t('packages.checkBackLater')}
          </Typography>
      </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4, md: 6 } }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography 
          variant="h3" 
          component="h1" 
          gutterBottom 
          sx={{ 
            mb: 2,
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {t('advertiser.packages.title')}
        </Typography>
        
        <Typography 
          variant="h6" 
          color="text.secondary" 
          sx={{ 
            mb: 4,
            maxWidth: '600px',
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          {t('advertiser.packages.subtitle')}
        </Typography>

        {/* Package Benefits */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          flexWrap: 'wrap', 
          gap: { xs: 1, sm: 2 },
          mb: 4 
        }}>
          {[
            { icon: <Speed />, text: t('advertiser.packages.packageBenefits.instantActivation') },
            { icon: <Analytics />, text: t('advertiser.packages.packageBenefits.realTimeTracking') },
            { icon: <MonetizationOn />, text: t('advertiser.packages.packageBenefits.flexibleBudget') }
          ].map((benefit, index) => (
            <Chip
              key={index}
              icon={benefit.icon}
              label={benefit.text}
              variant="outlined"
              color="primary"
              sx={{ 
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                  color: 'white'
                  }
                }}
              />
            ))}
          </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Available Packages */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            mb: 3,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Campaign sx={{ color: 'primary.main' }} />
        {t('advertiser.packages.available')}
      </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6, justifyContent: 'center' }}>
        {packages.map((pkg, index) => {
          const colors = colorSchemes[index % colorSchemes.length];
          
          return (
            <Grid item xs={12} sm={6} md={3} key={pkg.id}>
              <Zoom in={true} timeout={800 + index * 200}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: selectedPackage?.id === pkg.id ? `3px solid ${colors.primary}` : '2px solid transparent',
                    borderRadius: 4,
                    overflow: 'hidden',
                    position: 'relative',
                    background: `linear-gradient(145deg, #ffffff, #f8f9fa)`,
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.1)`,
                    animation: 'float 6s ease-in-out infinite',
                    animationDelay: `${index * 0.5}s`,
                '&:hover': {
                      transform: 'translateY(-12px) scale(1.03)',
                      boxShadow: `0 20px 40px rgba(0, 0, 0, 0.15)`,
                      borderColor: colors.primary,
                      animation: 'glow 2s ease-in-out infinite'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '6px',
                      background: colors.gradient,
                      transform: 'scaleX(0)',
                      transition: 'transform 0.4s ease',
                      transformOrigin: 'left'
                    },
                    '&:hover::before': {
                      transform: 'scaleX(1)'
                }
              }}
              onClick={() => handlePackageSelect(pkg)}
            >
                  {/* Package Header with unique gradient */}
                  <Box sx={{ 
                    background: colors.gradient,
                    color: 'white',
                    p: 3,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: '-50%',
                      right: '-50%',
                      width: '100%',
                      height: '200%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      transform: 'rotate(45deg)',
                      transition: 'all 0.3s ease'
                    },
                    '&:hover::after': {
                      transform: 'rotate(45deg) scale(1.2)'
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: 0,
                      height: 0,
                      borderStyle: 'solid',
                      borderWidth: '0 40px 40px 0',
                      borderColor: `transparent ${colors.accent} transparent transparent`,
                      opacity: 0.7
                    }
                  }}>
                    {/* Package Type Badge */}
                    <Box sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: colors.primary,
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${colors.accent}`
                    }}>
                      {colors.name}
                    </Box>
                    {/* Package Icon */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mb: 2,
                      '& svg': {
                        fontSize: '3rem',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                        animation: 'pulse 2s infinite'
                      }
                    }}>
                      {React.cloneElement(colors.icon, { 
                        sx: { color: 'white' }
                      })}
                    </Box>
                    
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                  {pkg.name}
                </Typography>
                
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      mb: 1,
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '20px',
                      px: 2,
                      py: 1,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <Timer sx={{ mr: 1, color: 'white', fontSize: '1.2rem' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>
                    {pkg.duration}s
                  </Typography>
                </Box>
                  </Box>

                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  {/* Price Section with unique styling */}
                  <Box sx={{ 
                    mb: 3,
                    background: `linear-gradient(145deg, ${colors.secondary}15, ${colors.accent}15)`,
                    borderRadius: 3,
                    p: 2,
                    border: `2px solid ${colors.secondary}30`
                  }}>
                    <Typography variant="h3" gutterBottom sx={{ 
                      fontWeight: 800,
                      background: colors.gradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: 'none'
                    }}>
                      {formatKWD(pkg.pricePerView || pkg.price_per_view || 0)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ 
                      mb: 2,
                      fontWeight: 600,
                      color: colors.primary
                    }}>
                      {t('advertiser.packages.perView')}
                    </Typography>
                  </Box>



                  {/* Description with unique styling */}
                  <Box sx={{ 
                    mb: 3,
                    background: `linear-gradient(145deg, ${colors.accent}10, ${colors.primary}10)`,
                    borderRadius: 3,
                    p: 2,
                    border: `1px solid ${colors.accent}30`,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      background: colors.gradient,
                      borderRadius: '2px'
                    }
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        lineHeight: 1.6,
                        minHeight: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.primary,
                        fontWeight: 500,
                        pl: 2
                      }}
                    >
                      {pkg.description}
                    </Typography>
                  </Box>
                </CardContent>
            </Card>
            </Zoom>
          </Grid>
        );
        })}
      </Grid>

      {/* Purchased Packages */}
      {purchasedPackages.filter(pkg => 
        // Show packages that still have budget (active or used with budget)
        pkg.status === 'active' || (pkg.status === 'used' && pkg.remaining_budget > 0)
      ).length > 0 && (
        <>
          <Divider sx={{ my: 6 }} />
            
            <Box sx={{ mb: 4 }}>
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  mb: 3,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <CheckCircle sx={{ color: 'success.main' }} />
                {t('advertiser.packages.purchased')}
                </Typography>
            </Box>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {purchasedPackages
                .filter(pkg => 
                  // Show packages that still have budget (active or used with budget)
                  pkg.status === 'active' || (pkg.status === 'used' && pkg.remaining_budget > 0)
                )
                .map((pkg, index) => (
                <Grid item xs={12} sm={6} lg={4} key={pkg.id}>
                  <Paper 
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        borderRadius: 3,
                        border: `2px solid ${pkg.status === 'active' ? theme.palette.success.light : 
                                                  pkg.status === 'used' ? theme.palette.warning.light : theme.palette.grey[300]}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8],
                          borderColor: pkg.status === 'active' ? theme.palette.success.main : 
                                      pkg.status === 'used' ? theme.palette.warning.main : theme.palette.grey[400]
                        }
                      }}
                    >
                      {/* Package Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 3,
                        pb: 2,
                        borderBottom: `1px solid ${theme.palette.divider}`
                      }}>
                        <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: 600 }}>
                          {pkg.packageName}
                        </Typography>
                        <Badge 
                          badgeContent={pkg.status === 'active' ? 'Available' : 
                                       pkg.status === 'used' && pkg.remaining_budget > 0 ? 'Active with Budget' : 
                                       pkg.status === 'used' ? 'Budget Exhausted' : pkg.status} 
                          color={pkg.status === 'active' ? 'success' : 
                                pkg.status === 'used' && pkg.remaining_budget > 0 ? 'warning' : 'default'}
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.65rem',
                              fontWeight: 600,
                              padding: '4px 8px'
                            }
                          }}
                  />
                </Box>

                      {/* Budget Information */}
                      <Stack spacing={2} sx={{ mb: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('advertiser.packages.budget')}:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatKWD(Number(pkg.budget) || 0)}
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('advertiser.packages.remaining')}:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                            {formatKWD(Number(pkg.remainingBudget) || 0)}
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: 'grey.50',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('advertiser.packages.used')}:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'warning.main' }}>
                            {formatKWD(Number(pkg.usedBudget) || 0)}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Views Information */}
                      <Stack spacing={2} sx={{ mb: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: 'primary.50',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('advertiser.packages.estimatedViews')}:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {pkg.estimatedViews}
                          </Typography>
                        </Box>

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          p: 2,
                          bgcolor: 'primary.50',
                          borderRadius: 2
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            {t('advertiser.packages.completedViews')}:
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {pkg.viewsCompleted}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Utilization */}
                      <Box sx={{ 
                        textAlign: 'center',
                        mb: 3,
                        p: 2,
                        bgcolor: 'info.50',
                        borderRadius: 2
                      }}>
                        <Typography variant="h6" color="info.main" sx={{ fontWeight: 600 }}>
                          {pkg.utilizationPercentage}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('advertiser.packages.utilized')}
                        </Typography>
                      </Box>

                      {/* Purchase Date */}
                      <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        display="block" 
                        align="center"
                        sx={{ 
                          pt: 2,
                          borderTop: `1px solid ${theme.palette.divider}`,
                          fontStyle: 'italic'
                        }}
                      >
                        {t('advertiser.packages.purchasedOn')}: {new Date(pkg.createdAt).toLocaleDateString()}
                      </Typography>
                    </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}

      {/* Purchase Dialog */}
      <Dialog 
        open={purchaseDialogOpen} 
        onClose={() => setPurchaseDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: packageToPurchase ? 
            `linear-gradient(135deg, ${colorSchemes.find((_, i) => i === packages.findIndex(p => p.id === packageToPurchase?.id))?.primary || '#1976d2'}, ${colorSchemes.find((_, i) => i === packages.findIndex(p => p.id === packageToPurchase?.id))?.secondary || '#42a5f5'})` : 
            'linear-gradient(135deg, #1976d2, #42a5f5)',
          color: 'white',
          textAlign: 'center',
          py: 3
        }}>
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
              {t('advertiser.packages.purchasePackage')}
            </Typography>
            {packageToPurchase && (
              <Typography variant="body1" component="div" sx={{ mt: 1, opacity: 0.9 }}>
                {packageToPurchase.name} - {packageToPurchase.duration}s
              </Typography>
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {packageToPurchase && (
            <>
              {/* Package Summary */}
              <Box sx={{ 
                mb: 4, 
                p: 3, 
                bgcolor: 'grey.50', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {t('advertiser.packages.packageDetails')}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('advertiser.packages.duration')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {packageToPurchase.duration} {t('time.seconds')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {t('advertiser.packages.pricePerView')}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {formatKWD(packageToPurchase.pricePerView || packageToPurchase.price_per_view || 0)} {t('advertiser.packages.perView')}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Budget Selection */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  {t('advertiser.packages.selectBudget')}
                    </Typography>
                    
                {/* Budget Controls */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  mb: 3,
                  gap: 2
                }}>
                      <Button
                    variant="outlined"
                    size="large"
                        onClick={handleDecrementBudget}
                        disabled={budget <= 300}
                    sx={{ 
                      minWidth: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        color: 'white'
                      }
                    }}
                      >
                        -
                      </Button>
                      
                  <Box sx={{ textAlign: 'center', minWidth: '120px' }}>
                      <TextField
                        value={budget}
                        onChange={(e) => setBudget(parseFloat(e.target.value) || 300)}
                        type="number"
                      size="medium"
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          fontSize: '1.2rem',
                          fontWeight: 600,
                          textAlign: 'center'
                        }
                      }}
                        inputProps={{ 
                          min: 300, 
                          step: 100,
                          style: { textAlign: 'center' }
                        }}
                      />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      KWD
                    </Typography>
                  </Box>
                      
                      <Button
                    variant="outlined"
                    size="large"
                        onClick={handleIncrementBudget}
                    sx={{ 
                      minWidth: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light,
                        color: 'white'
                      }
                    }}
                      >
                        +
                      </Button>
                    </Box>

                {/* Budget Info */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2
                }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {t('advertiser.packages.minBudget')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('advertiser.packages.budgetIncrement')}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                      {calculateEstimatedViewsForPackage(packageToPurchase, budget)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('advertiser.packages.estimatedViews')}
                    </Typography>
                  </Box>
                </Box>
                  </Box>

              {/* Error Display */}
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Success Display */}
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}
        </>
      )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setPurchaseDialogOpen(false)}
            variant="outlined"
            size="large"
            sx={{ px: 4 }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => handlePurchase(packageToPurchase)}
            variant="contained"
            size="large"
            disabled={purchasing || !packageToPurchase}
            startIcon={purchasing ? <CircularProgress size={20} /> : <ShoppingCart />}
            sx={{ 
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[8]
              }
            }}
          >
            {purchasing ? t('advertiser.packages.purchasing') : 'Proceed to Payment Gateway'} {/* TEMPORARY: Changed button text - REVERSIBLE */}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TEMPORARY: Package Payment Modal - REVERSIBLE */}
      <PackagePaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={(verification) => {
          setSuccess('Package purchased successfully!');
          setPaymentModalOpen(false);
          fetchPackages(); // Refresh packages list
          navigate('/advertiser/activate'); // Redirect to activate page
        }}
        packageData={packageToPurchase}
        budget={budget}
      />
    </Container>
  );
}