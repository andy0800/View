import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  PlayArrow,
  Visibility,
  AttachMoney,
  TrendingUp,
  MoreVert
} from '@mui/icons-material';

const ResponsiveCard = ({
  title,
  description,
  image,
  imageHeight = 200,
  actions,
  chips = [],
  stats = {},
  onClick,
  sx = {},
  variant = 'default', // 'default', 'video', 'stats', 'action'
  elevation = 1
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getVariantStyles = () => {
    switch (variant) {
      case 'video':
        return {
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          }
        };
      case 'stats':
        return {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          '& .MuiTypography-root': {
            color: 'white'
          }
        };
      case 'action':
        return {
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
          }
        };
      default:
        return {};
    }
  };

  return (
    <Card
      elevation={elevation}
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        ...getVariantStyles(),
        ...sx
      }}
    >
      {image && (
        <CardMedia
          component="img"
          height={isMobile ? imageHeight * 0.8 : imageHeight}
          image={image}
          alt={title}
          sx={{
            objectFit: 'cover',
            position: 'relative'
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, p: isMobile ? 2 : 3 }}>
        {/* Title */}
        <Typography
          variant={isMobile ? 'h6' : 'h5'}
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            mb: 1
          }}
        >
          {title}
        </Typography>

        {/* Description */}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {description}
          </Typography>
        )}

        {/* Chips */}
        {chips.length > 0 && (
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {chips.map((chip, index) => (
              <Chip
                key={index}
                label={chip.label}
                color={chip.color || 'primary'}
                size="small"
                variant={chip.variant || 'outlined'}
              />
            ))}
          </Box>
        )}

        {/* Stats */}
        {Object.keys(stats).length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {stats.views && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Visibility fontSize="small" />
                <Typography variant="caption">
                  {stats.views} views
                </Typography>
              </Box>
            )}
            {stats.earnings && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AttachMoney fontSize="small" />
                <Typography variant="caption">
                  {stats.earnings} KWD
                </Typography>
              </Box>
            )}
            {stats.trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp fontSize="small" />
                <Typography variant="caption">
                  {stats.trend}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>

      {/* Actions */}
      {actions && (
        <CardActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
          {actions}
        </CardActions>
      )}
    </Card>
  );
};

export default ResponsiveCard;
