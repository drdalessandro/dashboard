"use client";

// src/features/dashboard/components/ui/SummaryCards.tsx
import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import {
  EarningIcon,
  PatientIcon,
} from '@/components/ui/icons';

// Summary card data type
interface SummaryCardData {
  title: string;
  amount: string | number;
  increase: string;
  icon: React.ReactNode;
  iconBgColor: string;
}

interface SummaryCardsProps {
  data?: {
    appointments?: number;
    earnings?: number;
    patients?: number;
    claims?: {
      approved: number;
      pending: number;
      rejected: number;
    };
  };
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data }) => {
  const theme = useTheme();

  // Default values if not provided
  const appointments = data?.appointments || 153;
  const earnings = data?.earnings || 23425;
  const patients = data?.patients || 1925;

  // Format earnings as currency
  const formattedEarnings = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(earnings);

  // Format patients with comma
  const formattedPatients = new Intl.NumberFormat('en-US').format(patients);

  // Summary cards data
  const summaryCardsData: SummaryCardData[] = [
    {
      title: 'New Patient',
      amount: formattedPatients,
      increase: '+ 201',
      icon: <PatientIcon color="#FF8E26" />,
      iconBgColor: '#FFF4F2',
    },
    {
      title: 'Earnings',
      amount: formattedEarnings,
      increase: '+ 201',
      icon: <EarningIcon color="#FF8E26" />,
      iconBgColor: '#EEF3FF',
    },
  ];

  return (
    <Grid container spacing={3}>
      {summaryCardsData.map((card, index) => (
        <Grid item xs={12} sm={6} md={6} key={index}>
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

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUpIcon sx={{ color: '#14CC26', fontSize: 16 }} />
                <Typography
                  variant="caption"
                  sx={{ color: '#14CC26', fontWeight: 500 }}
                >
                  {card.increase}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;