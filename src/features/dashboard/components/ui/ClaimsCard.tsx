"use client";

import React from 'react';
import {
  Paper,
  Typography,
  Box,
  useTheme,
  LinearProgress,
  Divider,
  Grid
} from '@mui/material';
import { FactCheck as ClaimsIcon } from '@mui/icons-material';

interface ClaimsCardProps {
  data: {
    approved: number;
    pending: number;
    rejected: number;
  };
}

const ClaimsCard: React.FC<ClaimsCardProps> = ({ data }) => {
  const theme = useTheme();

  // Default values if not provided
  const claims = data || { approved: 65, pending: 25, rejected: 10 };

  // Calculate total claims
  const totalClaims = claims.approved + claims.pending + claims.rejected;

  // Calculate percentages
  const approvedPercentage = Math.round((claims.approved / totalClaims) * 100);
  const pendingPercentage = Math.round((claims.pending / totalClaims) * 100);
  const rejectedPercentage = Math.round((claims.rejected / totalClaims) * 100);

  // Custom SVG icon for claims
  const claimsIcon = (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.3 10.6H19.5C19.78 10.6 20 10.38 20 10.1V7.4C20 7.12 19.78 6.9 19.5 6.9H17.3C17.02 6.9 16.8 7.12 16.8 7.4V10.1C16.8 10.38 17.02 10.6 17.3 10.6Z" fill="#9747FF" />
      <path d="M5.5 11.6H7.7C7.98 11.6 8.2 11.38 8.2 11.1V8.4C8.2 8.12 7.98 7.9 7.7 7.9H5.5C5.22 7.9 5 8.12 5 8.4V11.1C5 11.38 5.22 11.6 5.5 11.6Z" fill="#9747FF" />
      <path d="M17.3 17.6H19.5C19.78 17.6 20 17.38 20 17.1V14.4C20 14.12 19.78 13.9 19.5 13.9H17.3C17.02 13.9 16.8 14.12 16.8 14.4V17.1C16.8 17.38 17.02 17.6 17.3 17.6Z" fill="#9747FF" />
      <path d="M5.5 18.6H7.7C7.98 18.6 8.2 18.38 8.2 18.1V15.4C8.2 15.12 7.98 14.9 7.7 14.9H5.5C5.22 14.9 5 15.12 5 15.4V18.1C5 18.38 5.22 18.6 5.5 18.6Z" fill="#9747FF" />
      <path d="M12.3802 19.38H11.6302C11.2802 19.38 11.0002 19.1 11.0002 18.75V5.32C11.0002 4.97 11.2802 4.69 11.6302 4.69H12.3802C12.7302 4.69 13.0102 4.97 13.0102 5.32V18.75C13.0102 19.09 12.7302 19.38 12.3802 19.38Z" fill="#9747FF" />
      <path d="M14.9998 10.75H9.83984C9.48984 10.75 9.20984 10.47 9.20984 10.12V9.96C9.20984 9.61 9.48984 9.33 9.83984 9.33H14.9998C15.3498 9.33 15.6298 9.61 15.6298 9.96V10.12C15.6298 10.47 15.3498 10.75 14.9998 10.75Z" fill="#9747FF" />
      <path d="M14.9998 14.75H9.83984C9.48984 14.75 9.20984 14.47 9.20984 14.12V13.96C9.20984 13.61 9.48984 13.33 9.83984 13.33H14.9998C15.3498 13.33 15.6298 13.61 15.6298 13.96V14.12C15.6298 14.47 15.3498 14.75 14.9998 14.75Z" fill="#9747FF" />
    </svg>
  );

  return (
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
      <Grid container spacing={3}>
        {/* Left section - Icon, Title, and Total Count */}
        <Grid item xs={12} md={5}>
          {/* Icon at the top */}
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '12px',
              backgroundColor: '#F3EAFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5,
            }}
          >
            {claimsIcon}
          </Box>

          {/* Title */}
          <Typography
            variant="subtitle2"
            color="text.secondary"
            fontWeight={400}
            sx={{ mb: 1 }}
          >
            Insurance Claims
          </Typography>

          {/* Total count */}
          <Typography variant="h4" color="text.primary" fontWeight={600} sx={{ mb: 2 }}>
            {totalClaims}
          </Typography>
        </Grid>

        {/* Vertical divider for visual separation - visible only on larger screens */}
        <Grid item xs={0} md={1} display={{ xs: 'none', md: 'block' }}>
          <Box sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Divider orientation="vertical" sx={{ height: '100%' }} />
          </Box>
        </Grid>

        {/* Horizontal divider for mobile - visible only on smaller screens */}
        <Grid item xs={12} display={{ xs: 'block', md: 'none' }}>
          <Divider sx={{ my: 1.5 }} />
        </Grid>

        {/* Right section - Claims breakdown */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Approved */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
                <Typography variant="body2" fontWeight={500} color="success.main">
                  {claims.approved} ({approvedPercentage}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={approvedPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.grey[100],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#4CAF50',
                    borderRadius: 3,
                  }
                }}
              />
            </Box>

            {/* Pending */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Pending
                </Typography>
                <Typography variant="body2" fontWeight={500} color="warning.main">
                  {claims.pending} ({pendingPercentage}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={pendingPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.grey[100],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#FFA726',
                    borderRadius: 3,
                  }
                }}
              />
            </Box>

            {/* Rejected */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Rejected
                </Typography>
                <Typography variant="body2" fontWeight={500} color="error.main">
                  {claims.rejected} ({rejectedPercentage}%)
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={rejectedPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: theme.palette.grey[100],
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#F44336',
                    borderRadius: 3,
                  }
                }}
              />
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ClaimsCard;