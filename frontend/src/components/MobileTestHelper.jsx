import React from 'react';
import { Box, Typography, Chip, useTheme, useMediaQuery } from '@mui/material';

const MobileTestHelper = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // Only show in development mode
  if (import.meta.env.PROD) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: 1,
        borderRadius: '0 0 0 8px',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <Typography variant="caption" display="block">
        Screen: {window.innerWidth} × {window.innerHeight}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
        {isMobile && <Chip label="Mobile" size="small" color="primary" />}
        {isTablet && <Chip label="Tablet" size="small" color="secondary" />}
        {isDesktop && <Chip label="Desktop" size="small" color="success" />}
      </Box>
      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
        Breakpoint: {isMobile ? 'sm' : isTablet ? 'md' : 'lg+'}
      </Typography>
    </Box>
  );
};

export default MobileTestHelper;
