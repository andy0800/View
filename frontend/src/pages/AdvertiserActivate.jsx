import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  Grid, 
  Chip,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Container,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  InputAdornment
} from '@mui/material';
import { 
  Add, 
  CloudUpload, 
  Campaign, 
  Payment,
  Visibility,
  Schedule,
  AttachMoney
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { formatKWD, filsToKwd } from '../utils/currencyUtils';

export default function AdvertiserActivate() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [packages, setPackages] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();

  // Form data
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedSection, setSelectedSection] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDescription, setCampaignDescription] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [ctaText, setCtaText] = useState(t('common.learnMore'));
  const [ctaEnabled, setCtaEnabled] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasedPackagesRes, sectionsRes] = await Promise.all([
        api.get('/api/advertiser/packages/purchased'),
        api.get('/api/sections')
      ]);
      
      const purchasedPackages = purchasedPackagesRes.data.purchasedPackages || [];
      setPackages(purchasedPackages);
      setSections(sectionsRes.data || []);
    } catch (err) {
      setError(t('errors.failedToLoadData'));
    }
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setActiveStep(1);
  };

  const handleSectionSelect = (sectionKey) => {
    setSelectedSection(sectionKey);
  };

  const handleMediaUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMediaFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPackage || !mediaFile || !campaignTitle || !selectedSection) {
      setError(t('errors.allFieldsRequired'));
      return;
    }

    // Enhanced package validation
    if (!selectedPackage.package || !selectedPackage.package.id) {
      setError('Invalid package structure. Please try selecting the package again.');
      return;
    }

    // Validate package has sufficient budget
    if (!selectedPackage.remaining_budget || selectedPackage.remaining_budget <= 0) {
      setError('Selected package has no remaining budget. Please select a different package or purchase a new one.');
      return;
    }

    // Validate package is active
    if (selectedPackage.status !== 'active') {
      setError('Selected package is not active or has already been used. Each package can only be used to create one ad.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('packageId', selectedPackage.package.id);
      formData.append('purchasedPackageId', selectedPackage.id);
      formData.append('media', mediaFile);
      formData.append('title', campaignTitle);
      formData.append('description', campaignDescription);
      formData.append('budget', selectedPackage.remaining_budget);
      formData.append('section', selectedSection);
      formData.append('cta_link', ctaLink);
      formData.append('cta_text', ctaText);
      formData.append('cta_enabled', ctaEnabled);

      const response = await api.post('/api/advertiser/ads/create', formData);
      setSuccess(t('success.campaignCreated'));
      
      // Refresh the purchased packages list to show updated status
      await fetchData();
      
      // Reset form
      setSelectedPackage(null);
      setSelectedSection('');
      setMediaFile(null);
      setCampaignTitle('');
      setCampaignDescription('');
      setCtaLink('');
      setCtaText(t('common.learnMore'));
      setCtaEnabled(true);
      setActiveStep(0);
    } catch (err) {
      setError(err.response?.data?.message || t('errors.failedToCreateCampaign'));
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('ads.selectPackage')}
            </Typography>
            
            {packages.filter(pkg => pkg.status === 'active' && pkg.remaining_budget > 0).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  {t('ads.noAvailablePackages')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  All purchased packages have been used. Each package can only create one ad.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => navigate('/advertiser/packages')}
                >
                  {t('ads.buyNewPackages')}
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {packages
                  .filter(pkg => pkg.status === 'active' && pkg.remaining_budget > 0) // Only show active packages with remaining budget
                  .map((pkg) => (
                  <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                    <Card 
                      onClick={() => handlePackageSelect(pkg)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { boxShadow: theme.shadows[4] }
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {pkg.package.name} Package
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Chip 
                            label={`${pkg.package.duration}s duration`}
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                          <Chip 
                            label={`${pkg.remaining_budget} ${t('currency.kwd')} available`}
                            color="success"
                          />
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {t('ads.remainingBudget')}: {pkg.remaining_budget} {t('currency.kwd')}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {t('ads.estimatedViews')}: {pkg.estimated_views} {t('ads.views')}
                        </Typography>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" color="primary">
                            {pkg.remaining_budget} {t('currency.kwd')} {t('ads.available')}
                          </Typography>
                          <Chip 
                            label={pkg.status === 'active' ? 'Available for Ad Creation' : 'Already Used'}
                            color={pkg.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('ads.uploadMedia')}
            </Typography>
            <Box sx={{ mb: 3 }}>
              <input
                type="file"
                accept="video/*"
                onChange={handleMediaUpload}
                style={{ display: 'none' }}
                id="media-upload"
              />
              <label htmlFor="media-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ py: 3 }}
                >
                  {t('ads.clickToUpload')}
                </Button>
              </label>
            </Box>
            {mediaFile && (
              <Alert severity="info">
                {t('ads.fileSelected')}: {mediaFile.name}
              </Alert>
            )}
            <Typography variant="caption" color="textSecondary">
              {t('ads.supportedFormats')}: MP4, AVI, MOV
            </Typography>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('ads.configureCampaign')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('ads.campaignTitle')}
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('ads.campaignDescription')}
                  value={campaignDescription}
                  onChange={(e) => setCampaignDescription(e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('ads.budget')}
                  type="number"
                  value={selectedPackage ? selectedPackage.remaining_budget : ''}
                  disabled
                  helperText={t('ads.budgetAlreadyPurchased')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{t('currency.kwd')}</InputAdornment>,
                  }}
                />
              </Grid>
                             <Grid item xs={12} sm={6}>
                 <TextField
                   fullWidth
                   label={t('ads.estimatedViews')}
                   type="number"
                   value={selectedPackage && selectedPackage.package && (selectedPackage.package.pricePerView || selectedPackage.package.price_per_view) ? 
                     Math.floor(parseFloat(selectedPackage.remaining_budget) / parseFloat(selectedPackage.package.pricePerView || selectedPackage.package.price_per_view)) : ''}
                   disabled
                   InputProps={{
                     startAdornment: <InputAdornment position="start">{t('ads.views')}</InputAdornment>,
                   }}
                 />
               </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>{t('ads.selectTargetSection')}</InputLabel>
                  <Select
                    value={selectedSection}
                    onChange={(e) => handleSectionSelect(e.target.value)}
                    label={t('ads.selectTargetSection')}
                  >
                    {sections.map((section) => (
                      <MenuItem key={section.key} value={section.key}>
                        {section.title || section.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* CTA Configuration */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Call-to-Action (CTA) Configuration
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('advertiser.ctaLinkUrl')}
                      value={ctaLink}
                      onChange={(e) => setCtaLink(e.target.value)}
                      placeholder="https://example.com"
                      helperText={t('advertiser.ctaLinkHelper')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label={t('advertiser.ctaButtonText')}
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      placeholder={t('common.learnMore')}
                      helperText={t('advertiser.ctaButtonHelper')}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={ctaEnabled}
                          onChange={(e) => setCtaEnabled(e.target.checked)}
                        />
                      }
                      label={t('advertiser.enableCtaButton')}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('ads.reviewAndPublish')}
            </Typography>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('ads.selectedPackage')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedPackage?.package.name} Package - {selectedPackage?.package.duration}s duration
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('ads.remainingBudget')}: {selectedPackage?.remaining_budget} {t('currency.kwd')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {t('ads.estimatedViews')}: {selectedPackage?.estimated_views} {t('ads.views')}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('ads.campaignTitle')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {campaignTitle}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('ads.campaignDescription')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {campaignDescription}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('ads.budget')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {selectedPackage?.remaining_budget} {t('currency.kwd')} {t('ads.available')}
              </Typography>
            </Paper>
            
                         <Paper sx={{ p: 2, mb: 2 }}>
               <Typography variant="subtitle2" color="textSecondary">
                 {t('ads.estimatedViews')}
               </Typography>
               <Typography variant="body1" gutterBottom>
                 {selectedPackage?.estimated_views || 0} {t('ads.views')}
               </Typography>
             </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('ads.targetSection')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {(() => {
                  const section = sections.find(s => s.key === selectedSection);
                  return section?.title || section?.name || selectedSection || t('ads.noSectionSelected');
                })()}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                {t('advertiser.ctaSettings')}
              </Typography>
              <Typography variant="body1" gutterBottom>
                {ctaEnabled ? (
                  <>
                    <strong>{t('advertiser.ctaButton')}:</strong> {ctaText}<br/>
                    <strong>{t('advertiser.ctaLink')}:</strong> {ctaLink || t('advertiser.notSpecified')}
                  </>
                ) : (
                  t('advertiser.ctaButtonDisabled')
                )}
              </Typography>
            </Paper>
          </Box>
        );

      default:
        return t('advertiser.unknownStep');
    }
  };

  const steps = [t('ads.selectPackage'), t('ads.uploadMedia'), t('ads.configureCampaign'), t('ads.reviewAndPublish')];

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        {t('ads.createNewAd')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ mt: 4 }}>
        {getStepContent(activeStep)}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          disabled={activeStep === 0}
          onClick={() => setActiveStep((prevActiveStep) => prevActiveStep - 1)}
        >
          {t('common.back')}
        </Button>
        <Box>
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Campaign />}
            >
              {loading ? t('common.processing') : t('ads.publishCampaign')}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setActiveStep((prevActiveStep) => prevActiveStep + 1)}
              disabled={!selectedPackage || (activeStep === 1 && !mediaFile)}
            >
              {t('common.next')}
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}