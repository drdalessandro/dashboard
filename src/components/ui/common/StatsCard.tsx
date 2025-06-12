"use client";

import React, { ReactNode } from 'react';
import { Box, Card, Typography, useTheme } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  iconColor?: string;
  iconBgColor?: string;
  className?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  iconColor = '#1E88E5', 
  iconBgColor = 'rgba(30, 136, 229, 0.1)',
  className 
}: StatsCardProps) {
  const theme = useTheme();
  
  return (
    <Card 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
      className={className}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
        
        {icon && (
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: iconBgColor,
              color: iconColor
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      
      {trend && (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            mt: 'auto',
            pt: 1
          }}
        >
          {trend.direction === 'up' ? (
            <ArrowUpward fontSize="small" sx={{ color: theme.palette.success.main, mr: 0.5 }} />
          ) : (
            <ArrowDownward fontSize="small" sx={{ color: theme.palette.error.main, mr: 0.5 }} />
          )}
          <Typography 
            variant="body2" 
            sx={{ 
              color: trend.direction === 'up' 
                ? theme.palette.success.main 
                : theme.palette.error.main,
              fontWeight: 500
            }}
          >
            {trend.value}
          </Typography>
        </Box>
      )}
    </Card>
  );
}
