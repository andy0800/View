// frontend/src/pages/AdminSettings.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Settings,
  Notifications,
  Security,
  Business,
  SystemUpdate,
  Save,
  Refresh,
  ExpandMore,
  AdminPanelSettings,
  Visibility,
  Lock,
  Speed,
  AccountBalance
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function AdminSettings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    verificationAlerts: true,
    withdrawalAlerts: true,
    appealAlerts: true,
    
    // System Settings
    autoApproveThreshold: 100,
    maxVideoDuration: 30,
    maxFileSize: 50,
    maintenanceMode: false,
    
    // Security Settings
    requireTwoFactor: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordExpiry: 90,
    
    // Business Settings
    companyFeePercentage: 50,
    minimumWithdrawal: 10,
    maximumWithdrawal: 10000,
    autoPayoutEnabled: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch current settings from backend
      const response = await api.get('/api/admin/settings');
      
      if (response.data.success) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setError('Failed to load current settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      // Save settings to backend
      const response = await api.put('/api/admin/settings', settings);
      
      if (response.data.success) {
        setSuccess('Settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setSettings({
      emailNotifications: true,
      pushNotifications: true,
      verificationAlerts: true,
      withdrawalAlerts: true,
      appealAlerts: true,
      autoApproveThreshold: 100,
      maxVideoDuration: 30,
      maxFileSize: 50,
      maintenanceMode: false,
      requireTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      passwordExpiry: 90,
      companyFeePercentage: 50,
      minimumWithdrawal: 10,
      maximumWithdrawal: 10000,
      autoPayoutEnabled: false
    });
    setSuccess('Settings reset to defaults');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Settings sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Admin Settings
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Configure platform settings, notifications, and system preferences
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
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

      {/* Settings Grid */}
      <Grid container spacing={3}>
        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Notifications color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Notification Preferences
                </Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                  />
                }
                label="Email Notifications"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.pushNotifications}
                    onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                  />
                }
                label="Push Notifications"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.verificationAlerts}
                    onChange={(e) => handleSettingChange('verificationAlerts', e.target.checked)}
                  />
                }
                label="Verification Alerts"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.withdrawalAlerts}
                    onChange={(e) => handleSettingChange('withdrawalAlerts', e.target.checked)}
                  />
                }
                label="Withdrawal Alerts"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.appealAlerts}
                    onChange={(e) => handleSettingChange('appealAlerts', e.target.checked)}
                  />
                }
                label="Appeal Alerts"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* System Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <SystemUpdate color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  System Configuration
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Auto-approve Threshold (views)"
                type="number"
                value={settings.autoApproveThreshold}
                onChange={(e) => handleSettingChange('autoApproveThreshold', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Max Video Duration (seconds)"
                type="number"
                value={settings.maxVideoDuration}
                onChange={(e) => handleSettingChange('maxVideoDuration', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Max File Size (MB)"
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  />
                }
                label="Maintenance Mode"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Security color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Security & Access
                </Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.requireTwoFactor}
                    onChange={(e) => handleSettingChange('requireTwoFactor', e.target.checked)}
                  />
                }
                label="Require Two-Factor Authentication"
              />
              
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                sx={{ mb: 2, mt: 2 }}
              />
              
              <TextField
                fullWidth
                label="Max Login Attempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Password Expiry (days)"
                type="number"
                value={settings.passwordExpiry}
                onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Business Settings */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Business Rules
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Company Fee Percentage (%)"
                type="number"
                value={settings.companyFeePercentage}
                onChange={(e) => handleSettingChange('companyFeePercentage', parseInt(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Minimum Withdrawal (KWD)"
                type="number"
                value={settings.minimumWithdrawal}
                onChange={(e) => handleSettingChange('minimumWithdrawal', parseFloat(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Maximum Withdrawal (KWD)"
                type="number"
                value={settings.maximumWithdrawal}
                onChange={(e) => handleSettingChange('maximumWithdrawal', parseFloat(e.target.value))}
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoPayoutEnabled}
                    onChange={(e) => handleSettingChange('autoPayoutEnabled', e.target.checked)}
                  />
                }
                label="Enable Auto Payouts"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{ px: 4, py: 1.5, borderRadius: 2 }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleResetToDefaults}
          disabled={saving}
          sx={{ px: 4, py: 1.5, borderRadius: 2 }}
        >
          Reset to Defaults
        </Button>
      </Box>

      {/* Current Status */}
      <Paper elevation={0} sx={{ mt: 4, p: 3, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Current System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip 
                label={settings.maintenanceMode ? 'Maintenance Mode' : 'Operational'} 
                color={settings.maintenanceMode ? 'warning' : 'success'}
                icon={settings.maintenanceMode ? <SystemUpdate /> : <Speed />}
              />
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip 
                label={settings.requireTwoFactor ? '2FA Required' : '2FA Optional'} 
                color={settings.requireTwoFactor ? 'info' : 'default'}
                icon={settings.requireTwoFactor ? <Lock /> : <Visibility />}
              />
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip 
                label={`${settings.companyFeePercentage}% Company Fee`} 
                color="primary"
                icon={<Business />}
              />
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip 
                label={settings.autoPayoutEnabled ? 'Auto Payouts ON' : 'Auto Payouts OFF'} 
                color={settings.autoPayoutEnabled ? 'success' : 'default'}
                icon={<AccountBalance />}
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
