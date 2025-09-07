// frontend/src/components/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Settings,
  Notifications,
  Security,
  Business,
  Save,
  Refresh,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import api from '../api';

// Tab Panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Setting Field component
function SettingField({ setting, onUpdate, disabled = false }) {
  const [value, setValue] = useState(setting.value);
  const [error, setError] = useState('');

  const handleChange = (newValue) => {
    setValue(newValue);
    setError('');
    
    // Validate based on setting type
    if (setting.key === 'companyFeePercentage' && (newValue < 0 || newValue > 100)) {
      setError('Percentage must be between 0 and 100');
      return;
    }
    
    if (setting.key === 'minimumWithdrawal' && newValue < 0) {
      setError('Minimum withdrawal must be positive');
      return;
    }
    
    if (setting.key === 'maximumWithdrawal' && newValue < 0) {
      setError('Maximum withdrawal must be positive');
      return;
    }
    
    if (setting.key === 'sessionTimeout' && (newValue < 1 || newValue > 1440)) {
      setError('Session timeout must be between 1 and 1440 minutes');
      return;
    }
    
    if (setting.key === 'maxLoginAttempts' && (newValue < 1 || newValue > 20)) {
      setError('Login attempts must be between 1 and 20');
      return;
    }
    
    if (setting.key === 'passwordExpiry' && (newValue < 1 || newValue > 365)) {
      setError('Password expiry must be between 1 and 365 days');
      return;
    }
    
    if (setting.key === 'maxVideoDuration' && (newValue < 1 || newValue > 300)) {
      setError('Video duration must be between 1 and 300 seconds');
      return;
    }
    
    if (setting.key === 'maxFileSize' && (newValue < 1 || newValue > 1000)) {
      setError('File size must be between 1 and 1000 MB');
      return;
    }
    
    onUpdate(setting.key, newValue);
  };

  const renderField = () => {
    if (typeof setting.value === 'boolean') {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={value}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
            />
          }
          label={setting.description || setting.key}
        />
      );
    }
    
    if (typeof setting.value === 'number') {
      return (
        <TextField
          fullWidth
          type="number"
          label={setting.description || setting.key}
          value={value}
          onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
          error={!!error}
          helperText={error}
          disabled={disabled}
          variant="outlined"
          size="small"
        />
      );
    }
    
    return (
      <TextField
        fullWidth
        label={setting.description || setting.key}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        error={!!error}
        helperText={error}
        disabled={disabled}
        variant="outlined"
        size="small"
      />
    );
  };

  return (
    <Box sx={{ mb: 2 }}>
      {renderField()}
      {setting.updated_at && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Last updated: {new Date(setting.updated_at).toLocaleString()}
        </Typography>
      )}
    </Box>
  );
}

export default function AdminSettings() {
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/admin/settings');
      
      if (response.data.success) {
        setSettings(response.data.data);
        setOriginalSettings(response.data.data);
        setHasChanges(false);
      } else {
        setError('Failed to fetch settings');
      }
    } catch (error) {
      setError('Failed to fetch settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingUpdate = (key, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      
      // Find the category containing this setting
      for (const category of Object.keys(newSettings)) {
        if (newSettings[category][key]) {
          newSettings[category][key] = {
            ...newSettings[category][key],
            value: value
          };
          break;
        }
      }
      
      return newSettings;
    });
    
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await api.put('/api/admin/settings', settings);
      
      if (response.data.success) {
        setSuccess('Settings saved successfully!');
        setOriginalSettings(settings);
        setHasChanges(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (error) {
      setError('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setHasChanges(false);
    setError('');
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getTabIcon = (index) => {
    const icons = [<Notifications key="notifications" />, <Settings key="system" />, <Security key="security" />, <Business key="business" />];
    return icons[index] || <Settings />;
  };

  const getTabLabel = (index) => {
    const labels = ['Notifications', 'System', 'Security', 'Business'];
    return labels[index] || 'Settings';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 4,
          p: 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'text.primary' }}>
          Admin Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Configure system settings, notifications, security policies, and business rules
        </Typography>
        
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            onClick={handleSave}
            disabled={!hasChanges || saving}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReset}
            disabled={!hasChanges}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Reset Changes
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSettings}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Success/Error Messages */}
      {success && (
        <Alert 
          severity="success" 
          icon={<CheckCircle />}
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          icon={<Warning />}
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Settings Tabs */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 4,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                minHeight: 64,
                px: 4
              },
              '& .Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            }}
          >
            {[0, 1, 2, 3].map((index) => (
              <Tab 
                key={index}
                icon={getTabIcon(index)}
                label={getTabLabel(index)}
                iconPosition="start"
              />
            ))}
          </Tabs>
        </Box>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            Notification Settings
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(settings.notification || {}).map(([key, setting]) => (
              <Grid item xs={12} md={6} key={key}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <SettingField
                      setting={setting}
                      onUpdate={handleSettingUpdate}
                      disabled={saving}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* System Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            System Settings
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(settings.system || {}).map(([key, setting]) => (
              <Grid item xs={12} md={6} key={key}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <SettingField
                      setting={setting}
                      onUpdate={handleSettingUpdate}
                      disabled={saving}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            Security Settings
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(settings.security || {}).map(([key, setting]) => (
              <Grid item xs={12} md={6} key={key}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <SettingField
                      setting={setting}
                      onUpdate={handleSettingUpdate}
                      disabled={saving}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Business Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
            Business Settings
          </Typography>
          <Grid container spacing={3}>
            {Object.entries(settings.business || {}).map(([key, setting]) => (
              <Grid item xs={12} md={6} key={key}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <SettingField
                      setting={setting}
                      onUpdate={handleSettingUpdate}
                      disabled={saving}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Change Indicator */}
      {hasChanges && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="warning.contrastText" sx={{ fontWeight: 600 }}>
            ⚠️ You have unsaved changes. Click "Save Changes" to apply them.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
