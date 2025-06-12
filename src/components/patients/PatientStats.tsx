// src/components/patients/PatientStats.tsx
"use client";

import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import {
  PersonOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface PatientStatsProps {
  total: number;
  active: number;
  inactive: number;
  newPatients: {
    count: number;
    change: string;
  };
}

const PatientStats: React.FC<PatientStatsProps> = ({
  total,
  active,
  inactive,
  newPatients
}) => {
  const { t } = useTranslation('patient');
  const theme = useTheme();

  // Card data
  const statsCards = [
    {
      title: t('patient.stats.total'),
      amount: total.toString(),
      icon: <PersonOutlined />,
      iconBgColor: '#EEF3FF', // Matching SummaryCards blue background
      increase: null
    },
    {
      title: t('patient.stats.active'),
      amount: active.toString(),
      icon: <CheckCircleOutlined />,
      iconBgColor: '#EBFFE8', // Success/green background
      increase: null
    },
    {
      title: t('patient.stats.inactive'),
      amount: inactive.toString(),
      icon: <CancelOutlined />,
      iconBgColor: '#FFF4F2', // Error/red background
      increase: null
    },
    {
      title: t('patient.stats.new'),
      amount: newPatients.count.toString(),
      icon: <TrendingUpIcon />,
      iconBgColor: '#EEF3FF', // Blue background
      increase: newPatients.change
    }
  ];

  return (
    <Grid container spacing={3}>
      {statsCards.map((card, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: `1px solid ${theme.palette.divider}`,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Icon at the top */}
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                backgroundColor: card.iconBgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2.5,
              }}
            >
              {React.cloneElement(card.icon as React.ReactElement, {
                sx: { color: theme.palette.primary.main, fontSize: '24px' },
              })}
            </Box>

            {/* Title */}
            <Typography
              variant="subtitle2"
              color="text.secondary"
              fontWeight={400}
              sx={{ mb: 1 }}
            >
              {card.title}
            </Typography>

            {/* Amount and Increase side by side */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" color="text.primary" fontWeight={600}>
                {card.amount}
              </Typography>

              {card.increase && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUpIcon sx={{ color: '#14CC26', fontSize: 16 }} />
                  <Typography
                    variant="caption"
                    sx={{ color: '#14CC26', fontWeight: 500 }}
                  >
                    {card.increase}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default PatientStats;