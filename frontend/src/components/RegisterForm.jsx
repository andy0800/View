import React, { useState, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid
} from '@mui/material';
import { 
  Phone, 
  Person, 
  Business, 
  Description, 
  Upload, 
  Badge,
  CameraAlt,
  PhotoCamera,
  Close
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function RegisterForm() {
  const { t } = useTranslation();
  
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [userType, setUserType] = useState('viewer');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [currentCameraField, setCurrentCameraField] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Registration form states
  const [regData, setRegData] = useState({
    fullName: '',
    civilId: '',
    companyName: '',
    licenseNumber: '',
    signatoryName: '',
    licenseDocument: null,
    civilIdFront: null,
    civilIdBack: null,
  });

  const startCamera = async (fieldName) => {
    try {
      // Simple, direct camera access - no complex filtering
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false // No audio needed for document photos
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCurrentCameraField(fieldName);
      setCameraOpen(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setMessage(t('auth.cameraAccessDenied'));
      setMessageType('error');
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `captured_${currentCameraField}_${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        
        setRegData(prev => ({ ...prev, [currentCameraField]: file }));
        setCapturedImage(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.8);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setCurrentCameraField('');
    setCapturedImage(null);
  };

  const handleRegister = async () => {
    // Validate phone number
    if (!phone) {
      setMessage(t('auth.phoneRequired'));
      setMessageType('error');
      return;
    }

    // Validate basic fields
    if (!regData.fullName) {
      setMessage(t('auth.fullNameRequired'));
      setMessageType('error');
      return;
    }
    
    // Validate Civil ID (only required for viewers)
    if (userType === 'viewer' && !regData.civilId) {
      setMessage(t('auth.civilIdRequired'));
      setMessageType('error');
      return;
    }

    // Validate Civil ID uploads (only required for viewers)
    if (userType === 'viewer' && (!regData.civilIdFront || !regData.civilIdBack)) {
      setMessage(t('auth.civilIdPhotosRequired'));
      setMessageType('error');
      return;
    }

    // Validate advertiser-specific fields
    if (userType === 'advertiser') {
      if (!regData.companyName || !regData.licenseNumber || !regData.signatoryName) {
        setMessage(t('auth.advertiserFieldsRequired'));
        setMessageType('error');
        return;
      }
      
      if (!regData.licenseDocument) {
        setMessage(t('auth.licenseDocumentRequired'));
        setMessageType('error');
        return;
      }
    }

    setIsLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('fullName', regData.fullName);
      formData.append('userType', userType);
      
      // Only append Civil ID for viewers
      if (userType === 'viewer' && regData.civilId) {
        formData.append('civilId', regData.civilId);
      }

      // Only append Civil ID photos for viewers
      if (userType === 'viewer') {
        formData.append('civilIdFront', regData.civilIdFront);
        formData.append('civilIdBack', regData.civilIdBack);
      }

      if (userType === 'advertiser') {
        formData.append('companyName', regData.companyName);
        formData.append('licenseNumber', regData.licenseNumber);
        formData.append('signatoryName', regData.signatoryName);
        formData.append('licenseDocument', regData.licenseDocument);
      }

      const response = await api.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Registration successful! Please verify your phone number.');
      setMessageType('success');
      
      // Reset form data
      setRegData({
        fullName: '',
        civilId: '',
        companyName: '',
        licenseNumber: '',
        signatoryName: '',
        licenseDocument: null,
        civilIdFront: null,
        civilIdBack: null,
      });
      setPhone('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (field, file) => {
    setRegData(prev => ({ ...prev, [field]: file }));
  };

  const renderFileUpload = (field, label, accept, required = false) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label} {required && '*'}
      </Typography>
      <Grid container spacing={1}>
        <Grid item xs={8}>
          <input
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(field, e.target.files[0])}
            style={{ display: 'none' }}
            id={`${field}-file`}
            required={required}
          />
          <label htmlFor={`${field}-file`}>
            <Button
              variant="outlined"
              component="span"
              startIcon={<Upload />}
              fullWidth
              color={regData[field] ? 'success' : 'primary'}
              sx={{
                borderRadius: 3,
                py: 1.5,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }
              }}
            >
              {regData[field] ? regData[field].name : `Upload ${label}`}
            </Button>
          </label>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            onClick={() => startCamera(field)}
            fullWidth
            sx={{
              borderRadius: 3,
              py: 1.5,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          >
            {t('auth.camera')}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ mt: 2, position: 'relative' }}>
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

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          {t('auth.selectAccountType')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={t('auth.viewer')}
            color={userType === 'viewer' ? 'primary' : 'default'}
            onClick={() => setUserType('viewer')}
            variant={userType === 'viewer' ? 'filled' : 'outlined'}
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          />
          <Chip
            label={t('auth.advertiser')}
            color={userType === 'advertiser' ? 'primary' : 'default'}
            onClick={() => setUserType('advertiser')}
            variant={userType === 'advertiser' ? 'filled' : 'outlined'}
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }
            }}
          />
        </Box>
      </Box>

      {/* Phone Number Field - Required for all registrations */}
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
              <Phone sx={{ color: 'primary.main' }} />
            </InputAdornment>
          ),
        }}
        helperText="Format: +965XXXXXXXX"
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

      <TextField
        fullWidth
        label={t('auth.fullName')}
        value={regData.fullName}
        onChange={(e) => setRegData(prev => ({ ...prev, fullName: e.target.value }))}
        margin="normal"
        required
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Person sx={{ color: 'primary.main' }} />
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

      {/* Civil ID Field - Only required for viewers */}
      {userType === 'viewer' && (
        <TextField
          fullWidth
          label={t('auth.civilId')}
          value={regData.civilId}
          onChange={(e) => setRegData(prev => ({ ...prev, civilId: e.target.value }))}
          margin="normal"
          required
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Badge sx={{ color: 'primary.main' }} />
              </InputAdornment>
            ),
          }}
          helperText="Enter your Civil ID number (12 digits)"
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
      )}

      {/* Civil ID Upload Fields - Only for viewers */}
      {userType === 'viewer' && (
        <>
          {renderFileUpload('civilIdFront', t('auth.civilIdFront'), 'image/*', true)}
          {renderFileUpload('civilIdBack', t('auth.civilIdBack'), 'image/*', true)}
        </>
      )}

      {userType === 'advertiser' && (
        <>
          <TextField
            fullWidth
            label={t('auth.companyName')}
            value={regData.companyName}
            onChange={(e) => setRegData(prev => ({ ...prev, companyName: e.target.value }))}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Business sx={{ color: 'primary.main' }} />
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

          <TextField
            fullWidth
            label={t('auth.licenseNumber')}
            value={regData.licenseNumber}
            onChange={(e) => setRegData(prev => ({ ...prev, licenseNumber: e.target.value }))}
            margin="normal"
            required
            placeholder="Enter your commercial license number"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Description sx={{ color: 'primary.main' }} />
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


          <TextField
            fullWidth
            label={t('auth.signatoryName')}
            value={regData.signatoryName}
            onChange={(e) => setRegData(prev => ({ ...prev, signatoryName: e.target.value }))}
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: 'primary.main' }} />
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

          {renderFileUpload('licenseDocument', t('auth.licenseDocument'), '.pdf,.doc,.docx,.jpg,.jpeg,.png', true)}
        </>
      )}

      <Button
        fullWidth
        variant="contained"
        onClick={handleRegister}
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
        {isLoading ? <CircularProgress size={24} /> : t('common.register')}
      </Button>

      {/* Camera Dialog */}
      <Dialog 
        open={cameraOpen} 
        onClose={closeCamera}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{t('auth.takePhoto')}</Typography>
            <IconButton onClick={closeCamera}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            {!capturedImage ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
              />
            ) : (
              <img 
                src={capturedImage} 
                alt="Captured" 
                style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          {!capturedImage ? (
            <Button
              variant="contained"
              startIcon={<PhotoCamera />}
              onClick={captureImage}
              size="large"
            >
              {t('auth.capturePhoto')}
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setCapturedImage(null)}
              >
                {t('auth.retake')}
              </Button>
              <Button
                variant="contained"
                onClick={closeCamera}
              >
                {t('auth.usePhoto')}
              </Button>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
