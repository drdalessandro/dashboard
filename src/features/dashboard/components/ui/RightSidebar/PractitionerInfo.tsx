// src/features/dashboard/components/ui/RightSidebar/PractitionerInfo.tsx
import React from 'react';
import { Box, Typography, Divider, useTheme, Avatar } from '@mui/material';

// Practitioner info interface
interface PractitionerInfoProps {
  practitioner?: {
    name: string;
    avatar?: string;
    totalPatients: number;
    appointments: number;
    rating: number;
  };
}

const PractitionerInfo: React.FC<PractitionerInfoProps> = ({ practitioner }) => {
  const theme = useTheme();

  // Default practitioner data if none provided
  const defaultPractitioner = practitioner || {
    name: 'Dr. Dilip Anmangandla, MD',
    totalPatients: 32100,
    appointments: 4250,
    rating: 4.8,
  };

  // Format patient number with k suffix
  const formatNumber = (num: number) => {
    return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Profile photo above the name as per Figma */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
        <Avatar
          src={defaultPractitioner.avatar}
          alt={defaultPractitioner.name}
          sx={{
            width: 80,
            height: 80,
            bgcolor: theme.palette.primary.main,
            mb: 2,
            fontSize: 32,
          }}
        >
          {defaultPractitioner.name.charAt(0)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight={600} align="center">
          {defaultPractitioner.name}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            Total Patients
          </Typography>
          <Typography variant="subtitle2" fontWeight={600}>
            {formatNumber(defaultPractitioner.totalPatients)}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            Appointment
          </Typography>
          <Typography variant="subtitle2" fontWeight={600}>
            {defaultPractitioner.appointments}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
            Rate
          </Typography>
          <Typography variant="subtitle2" fontWeight={600}>
            {defaultPractitioner.rating}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default PractitionerInfo;