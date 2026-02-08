import React from 'react';
import { 
  Box, 
  Container, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';

export default function ResponsiveLayout({ children, maxWidth = 'lg', transparent = false }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: transparent ? 'transparent' : theme.palette.background.default,
      py: isMobile ? 2 : isTablet ? 3 : 4
    }}>
      <Container 
        maxWidth={maxWidth}
        sx={{
          px: isMobile ? 2 : isTablet ? 3 : 4
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
