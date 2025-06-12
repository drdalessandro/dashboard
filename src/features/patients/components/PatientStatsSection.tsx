"use client";

import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import {
  PersonOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { DataCard } from '@/components/designSystem';

interface PatientStatsSectionProps {
  total: number;
  active: number;
  inactive: number;
  newPatients: {
    count: number;
    change: string;
  };
}

const PatientStatsSection: React.FC<PatientStatsSectionProps> = ({
  total,
  active,
  inactive,
  newPatients
}) => {
  const { t } = useTranslation('patient');

  // Card data
  const statsCards = [
    {
      title: t('patient.stats.total'),
      amount: total.toString(),
      icon: PersonOutlined,
      color: '#2196F3',
      bgColor: 'rgba(33, 150, 243, 0.1)',
      increase: null
    },
    {
      title: t('patient.stats.active'),
      amount: active.toString(),
      icon: CheckCircleOutlined,
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      increase: null
    },
    {
      title: t('patient.stats.inactive'),
      amount: inactive.toString(),
      icon: CancelOutlined,
      color: '#FF9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
      increase: null
    },
    {
      title: t('patient.stats.new'),
      amount: newPatients.count.toString(),
      icon: TrendingUpIcon,
      color: '#9C27B0',
      bgColor: 'rgba(156, 39, 176, 0.1)',
      increase: newPatients.change
    }
  ];

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Grid container spacing={3}>
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <DataCard>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: card.bgColor,
                      mr: 2
                    }}
                  >
                    <Icon sx={{ fontSize: 28, color: card.color }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'text.primary',
                        lineHeight: 1.2
                      }}
                    >
                      {card.amount}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mt: 0.5
                      }}
                    >
                      {card.title}
                    </Typography>
                    {card.increase && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: card.increase.startsWith('+') ? 'success.main' : 'error.main',
                          fontWeight: 500
                        }}
                      >
                        {card.increase}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </DataCard>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default PatientStatsSection;
