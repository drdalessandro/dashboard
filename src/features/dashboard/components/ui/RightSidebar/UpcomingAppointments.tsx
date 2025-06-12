// src/features/dashboard/components/ui/RightSidebar/UpcomingAppointments.tsx
import React from 'react';
import { Box, Typography, Divider, IconButton, useTheme, Button } from '@mui/material';
import { MoreVert as MoreVertIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

// Appointment interface
interface Appointment {
  id: string;
  title: string;
  Practitioner: string;
  time: string;
  date: string;
  status?: string;
}

interface UpcomingAppointmentsProps {
  appointments?: Appointment[];
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ appointments }) => {
  const theme = useTheme();

  // Default appointments if none provided
  const defaultAppointments: Appointment[] = appointments || [
    {
      id: '1',
      title: 'Nurse Visit 20',
      Practitioner: 'Dr. Carol D. Pollack-rundle',
      time: '09:00 AM',
      date: 'July 30, 2022',
      status: 'Confirmed'
    },
    {
      id: '2',
      title: 'Annual Visit 15',
      Practitioner: 'Dr. Donald F. Watren',
      time: '10:30 AM',
      date: 'July 30, 2022',
      status: 'Confirmed'
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Upcoming Appointment
        </Typography>
        <IconButton size="small">
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Date with vertical line next to it - Moved to the top as per Figma */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 4,
            height: 20,
            backgroundColor: theme.palette.primary.main,
            borderRadius: 1,
            mr: 1.5,
          }}
        />
        <Typography variant="subtitle2" color="primary" fontWeight={600}>
          {defaultAppointments[0].date}
        </Typography>
      </Box>

      {/* Appointments */}
      {defaultAppointments.map((appointment, index) => (
        <React.Fragment key={appointment.id}>
          <Box sx={{ mb: 3, pl: 2 }}> {/* Added left padding to indent the entire appointment block */}
            {/* Time with dot */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                  mr: 1.5,
                }}
              />
              <Typography variant="body2" fontWeight={500} color="text.primary">
                {appointment.time}
              </Typography>
            </Box>

            {/* Appointment details with indentation to align with time text */}
            <Box sx={{ ml: 2.5 }}> {/* Margin left to align with the text of the time */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {appointment.title}
                </Typography>
                <IconButton size="small" sx={{ p: 0.5 }}>
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
                {appointment.Practitioner}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Status
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    {appointment.status}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    minHeight: 0,
                    minWidth: 0,
                    py: 0.5,
                    px: 2
                  }}
                >
                  View
                </Button>
              </Box>
            </Box>
          </Box>

          {index < defaultAppointments.length - 1 && (
            <Divider sx={{ mb: 3 }} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default UpcomingAppointments;