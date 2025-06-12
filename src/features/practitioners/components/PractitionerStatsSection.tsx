"use client";

import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  MedicalServicesOutlined,
  PersonAddAlt1Outlined,
  LocalHospitalOutlined,
  PersonOffOutlined
} from '@mui/icons-material';
import { DataCard } from '@/components/designSystem';

interface PractitionerStatsSectionProps {
  total: number;
  active: number;
  inactive: number;
  newPractitioners: number;
}

const PractitionerStatsSection: React.FC<PractitionerStatsSectionProps> = ({
  total,
  active,
  inactive,
  newPractitioners
}) => {
  const { t } = useTranslation(['practitioner', 'common']);

  // Define stats cards
  const stats = [
    {
      title: t('stats.total', { ns: 'practitioner' }),
      value: total,
      icon: MedicalServicesOutlined,
      color: '#2196F3',
      bgColor: 'rgba(33, 150, 243, 0.1)'
    },
    {
      title: t('stats.active', { ns: 'practitioner' }),
      value: active,
      icon: LocalHospitalOutlined,
      color: '#4CAF50',
      bgColor: 'rgba(76, 175, 80, 0.1)'
    },
    {
      title: t('stats.inactive', { ns: 'practitioner' }),
      value: inactive,
      icon: PersonOffOutlined,
      color: '#FF9800',
      bgColor: 'rgba(255, 152, 0, 0.1)'
    },
    {
      title: t('stats.new', { ns: 'practitioner' }),
      value: newPractitioners,
      icon: PersonAddAlt1Outlined,
      color: '#9C27B0',
      bgColor: 'rgba(156, 39, 176, 0.1)'
    }
  ];

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Grid container spacing={3}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
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
                      backgroundColor: stat.bgColor,
                      mr: 2
                    }}
                  >
                    <Icon sx={{ fontSize: 28, color: stat.color }} />
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
                      {stat.value.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mt: 0.5
                      }}
                    >
                      {stat.title}
                    </Typography>
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

export default PractitionerStatsSection;
