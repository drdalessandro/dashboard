import React from 'react';
import { Box, Card, Typography, useTheme, SvgIcon } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactElement;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: string;
  iconBackgroundColor?: string;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
  iconBackgroundColor,
  className = '',
}) => {
  const theme = useTheme();

  const getIconBackgroundColor = () => {
    if (iconBackgroundColor) return iconBackgroundColor;
    
    // Default background colors based on the theme
    return theme.palette.primary.light;
  };

  const getTrendColor = () => {
    if (!trend) return 'inherit';
    
    switch (trend.direction) {
      case 'up':
        return theme.palette.success.main;
      case 'down':
        return theme.palette.error.main;
      case 'neutral':
      default:
        return theme.palette.text.secondary;
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUpIcon fontSize="small" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" />;
      case 'neutral':
      default:
        return null;
    }
  };

  return (
    <Card 
      sx={{ 
        p: 3, 
        height: '100%',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        border: '1px solid rgba(0,0,0,0.05)',
      }}
      className={className}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight="bold" color={color || 'text.primary'}>
            {value}
          </Typography>
        </Box>
        {icon && (
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1,
              borderRadius: 2,
              bgcolor: getIconBackgroundColor(),
              color: theme.palette.primary.contrastText,
            }}
          >
            <SvgIcon component={() => icon} inheritViewBox />
          </Box>
        )}
      </Box>
      
      {trend && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: getTrendColor(),
            mt: 1,
          }}
        >
          {getTrendIcon()}
          <Typography variant="body2" sx={{ ml: 0.5 }}>
            {trend.value}
          </Typography>
        </Box>
      )}
    </Card>
  );
};

export default StatsCard;
