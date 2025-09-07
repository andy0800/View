import React from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Send,
  CheckCircle,
  Error
} from '@mui/icons-material';

const ResponsiveForm = ({
  title,
  subtitle,
  fields = [],
  onSubmit,
  loading = false,
  error = null,
  success = null,
  submitText = 'Submit',
  submitIcon = <Send />,
  sx = {},
  variant = 'default' // 'default', 'auth', 'upload', 'settings'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [formData, setFormData] = React.useState({});
  const [showPasswords, setShowPasswords] = React.useState({});
  const [errors, setErrors] = React.useState({});

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {};
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'auth':
        return {
          maxWidth: isMobile ? '100%' : 400,
          mx: 'auto',
          p: isMobile ? 3 : 4,
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
          border: '1px solid rgba(0,0,0,0.08)'
        };
      case 'upload':
        return {
          p: isMobile ? 2 : 3,
          border: '2px dashed rgba(25, 118, 210, 0.3)',
          borderRadius: 3,
          backgroundColor: 'rgba(25, 118, 210, 0.02)'
        };
      case 'settings':
        return {
          p: isMobile ? 2 : 3,
          backgroundColor: 'background.paper'
        };
      default:
        return {
          p: isMobile ? 2 : 3
        };
    }
  };

  return (
    <Paper
      elevation={variant === 'auth' ? 3 : 1}
      sx={{
        borderRadius: 3,
        ...getVariantStyles(),
        ...sx
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
        {/* Header */}
        {title && (
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 700,
              textAlign: variant === 'auth' ? 'center' : 'left',
              mb: subtitle ? 1 : 3
            }}
          >
            {title}
          </Typography>
        )}

        {subtitle && (
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              textAlign: variant === 'auth' ? 'center' : 'left',
              mb: 3
            }}
          >
            {subtitle}
          </Typography>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert
            severity="error"
            icon={<Error />}
            sx={{ mb: 3 }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 3 }}
          >
            {success}
          </Alert>
        )}

        {/* Form Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {fields.map((field) => (
            <TextField
              key={field.name}
              name={field.name}
              label={field.label}
              type={
                field.type === 'password'
                  ? showPasswords[field.name]
                    ? 'text'
                    : 'password'
                  : field.type || 'text'
              }
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              required={field.required}
              fullWidth
              multiline={field.multiline}
              rows={field.rows}
              select={field.select}
              SelectProps={field.selectProps}
              error={!!errors[field.name]}
              helperText={errors[field.name]}
              placeholder={field.placeholder}
              disabled={loading || field.disabled}
              InputProps={{
                startAdornment: field.startAdornment,
                endAdornment: field.type === 'password' ? (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility(field.name)}
                      edge="end"
                    >
                      {showPasswords[field.name] ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ) : field.endAdornment
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
          ))}
        </Box>

        {/* Submit Button */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : submitIcon}
            sx={{
              minWidth: 200,
              py: 1.5,
              px: 4,
              borderRadius: 2,
              fontSize: '1rem',
              fontWeight: 600,
              '@media (max-width:600px)': {
                minWidth: '100%',
                py: 1.25
              }
            }}
          >
            {loading ? 'Processing...' : submitText}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ResponsiveForm;
