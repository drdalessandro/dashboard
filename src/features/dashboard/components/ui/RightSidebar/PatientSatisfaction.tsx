// src/features/dashboard/components/ui/RightSidebar/PatientSatisfaction.tsx
import React from 'react';
import { Box, Typography, useTheme, Grid } from '@mui/material';

// Satisfaction data interface
interface SatisfactionData {
  excellent: number;
  good: number;
  poor: number;
  total: number;
}

interface PatientSatisfactionProps {
  data?: SatisfactionData;
}

const PatientSatisfaction: React.FC<PatientSatisfactionProps> = ({ data }) => {
  const theme = useTheme();

  // Default data if none provided
  const satisfactionData: SatisfactionData = data || {
    excellent: 65,
    good: 25,
    poor: 10,
    total: 45251,
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2}>
          Patient Satisfaction
        </Typography>
      </Box>

      {/* Chart and Legend side by side as per Figma */}
      <Grid container spacing={2}>
        {/* Left side: Chart */}
        <Grid item xs={6}>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: `conic-gradient(
                  ${theme.palette.primary.main} 0% ${satisfactionData.excellent}%,
                  ${theme.palette.warning.main} ${satisfactionData.excellent}% ${satisfactionData.excellent + satisfactionData.good}%,
                  ${theme.palette.error.main} ${satisfactionData.excellent + satisfactionData.good}% 100%
                )`,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '70%',
                height: '70%',
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
              <Typography variant="subtitle2" color="primary" fontWeight={600}>
                {formatNumber(satisfactionData.total)}
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Right side: Legend */}
        <Grid item xs={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 1,
                  backgroundColor: theme.palette.primary.main,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Excellent ({satisfactionData.excellent}%)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 1,
                  backgroundColor: theme.palette.warning.main,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Good ({satisfactionData.good}%)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  borderRadius: 1,
                  backgroundColor: theme.palette.error.main,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                Poor ({satisfactionData.poor}%)
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientSatisfaction;