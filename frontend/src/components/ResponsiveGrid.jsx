import React from 'react';
import { Grid, useTheme, useMediaQuery } from '@mui/material';

const ResponsiveGrid = ({ 
  children, 
  spacing = 3,
  sx = {},
  ...props 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  return (
    <Grid
      container
      spacing={isMobile ? 2 : isTablet ? 2.5 : spacing}
      sx={{
        ...sx
      }}
      {...props}
    >
      {children}
    </Grid>
  );
};

const ResponsiveGridItem = ({ 
  children, 
  xs = 12,
  sm = 6,
  md = 4,
  lg = 3,
  xl = 3,
  sx = {},
  ...props 
}) => {
  return (
    <Grid
      item
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      sx={{
        ...sx
      }}
      {...props}
    >
      {children}
    </Grid>
  );
};

export { ResponsiveGrid, ResponsiveGridItem };
