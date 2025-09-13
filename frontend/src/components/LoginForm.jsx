import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { Phone, Lock } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function LoginForm() {
  const { persist } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    if (!phone) {
      setMessage(t('auth.phoneRequired'));
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Automatically prepend +965 to the phone number
      const fullPhoneNumber = phone.startsWith('+965') ? phone : `+965${phone}`;
      const response = await api.post('/auth/request-otp', { phone: fullPhoneNumber });
      setMessage('OTP sent successfully!');
      setMessageType('success');
      setOtpSent(true);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send OTP');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setMessage(t('auth.otpRequired'));
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Automatically prepend +965 to the phone number
      const fullPhoneNumber = phone.startsWith('+965') ? phone : `+965${phone}`;
      const response = await api.post('/auth/verify-otp', { phone: fullPhoneNumber, otp });
      console.log('🔐 OTP verification response:', response.data);
      
      if (response.data.user.role === 'advertiser' && response.data.user.kyc_status !== 'verified') {
        setMessage(t('auth.accountCreated'));
        setMessageType('info');
      } else {
        setMessage(t('auth.loginSuccessful'));
        setMessageType('success');
        
        console.log('✅ Login successful, persisting user:', response.data.user);
        
        // Update authentication state
        persist({ 
          user: response.data.user, 
          token: response.data.sessionId
        });
        
        console.log('🚀 Navigating to dashboard for role:', response.data.user.role);
        
        // Navigate to appropriate dashboard
        if (response.data.user.role === 'viewer') {
          navigate('/viewer');
        } else if (response.data.user.role === 'advertiser') {
          navigate('/advertiser');
        }
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      if (error.response?.status === 404 && error.response?.data?.requiresRegistration) {
        setMessage('Phone number verified! Please complete your registration below.');
        setMessageType('info');
      } else {
        setMessage(error.response?.data?.message || t('auth.invalidOtp'));
        setMessageType('error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {message && (
        <Alert 
          severity={messageType} 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          {message}
        </Alert>
      )}

      {/* TEST MESSAGE - TO BE REMOVED */}
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#e91e63', 
          textAlign: 'center', 
          mb: 2, 
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif'
        }}
      >
        Welcome homeee
      </Typography>

      <TextField
        fullWidth
        label={t('auth.phone')}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        margin="normal"
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Phone sx={{ color: 'primary.main', mr: 1 }} />
              <Typography sx={{ color: 'text.secondary', fontWeight: 600, userSelect: 'none' }}>
                +965
              </Typography>
            </InputAdornment>
          ),
        }}
        helperText="Enter your phone number (without +965 prefix)"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)'
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.25)'
            }
          }
        }}
      />

      {!otpSent ? (
        <Button
          fullWidth
          variant="contained"
          onClick={handleSendOTP}
          disabled={isLoading}
          sx={{ 
            mt: 3,
            py: 1.5,
            borderRadius: 3,
            fontSize: '1.1rem',
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(45deg, #1565c0, #1976d2)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)'
            }
          }}
        >
          {isLoading ? <CircularProgress size={24} /> : t('auth.requestOtp')}
        </Button>
      ) : (
        <>
          <TextField
            fullWidth
            label={t('auth.otp')}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: 'primary.main' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.15)'
                },
                '&.Mui-focused': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(25, 118, 210, 0.25)'
                }
              }
            }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleVerifyOTP}
            disabled={isLoading}
            sx={{ 
              mt: 3,
              py: 1.5,
              borderRadius: 3,
              fontSize: '1.1rem',
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(25, 118, 210, 0.4)'
              }
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : t('auth.verifyOtp')}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => setOtpSent(false)}
            sx={{ 
              mt: 1,
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                transform: 'translateY(-1px)'
              }
            }}
          >
            {t('common.back')}
          </Button>
        </>
      )}
    </Box>
  );
}
