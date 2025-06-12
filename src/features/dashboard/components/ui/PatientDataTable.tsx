"use client";

// src/features/dashboard/components/new-ui/PatientDataTable.tsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import {
  EditIcon,
  DeleteIcon
} from '@/components/ui/icons';

// Patient status type
type PatientStatus = 'Confirmed' | 'Incoming' | 'Cancelled';

// Patient data interface
interface PatientData {
  id: string;
  name: string;
  avatar?: string;
  date: string;
  diagnostic: string;
  status: PatientStatus;
}

interface PatientDataTableProps {
  data?: PatientData[];
}

const PatientDataTable: React.FC<PatientDataTableProps> = ({ data }) => {
  const theme = useTheme();

  // Sample patient data if none provided
  const patients: PatientData[] = data || [
    {
      id: '1',
      name: 'Jenny Wilson',
      date: 'Dec 18, 2021',
      diagnostic: 'Geriatrician',
      status: 'Confirmed',
    },
    {
      id: '2',
      name: 'Albert Flores',
      date: 'Dec 18, 2021',
      diagnostic: 'Internist',
      status: 'Incoming',
    },
    {
      id: '3',
      name: 'Floyd Miles',
      date: 'Dec 18, 2021',
      diagnostic: 'Urogynecologist',
      status: 'Confirmed',
    },
    {
      id: '4',
      name: 'Marvin McKinney',
      date: 'Dec 18, 2021',
      diagnostic: 'Cardiologist',
      status: 'Cancelled',
    },
  ];

  // Get status chip color
  const getStatusColor = (status: PatientStatus) => {
    switch (status) {
      case 'Confirmed':
        return {
          bgColor: theme.palette.primary.main,
          textColor: '#fff',
        };
      case 'Incoming':
        return {
          bgColor: theme.palette.warning.main,
          textColor: '#fff',
        };
      case 'Cancelled':
        return {
          bgColor: theme.palette.text.secondary,
          textColor: '#fff',
        };
      default:
        return {
          bgColor: theme.palette.grey[300],
          textColor: theme.palette.text.primary,
        };
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 1,
        border: `1px solid ${theme.palette.divider}`,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" color="text.primary">
            Patient Data
          </Typography>
          <IconButton size="small">
            <MoreVertIcon />
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}>
              Patient name
            </TableCell>
            <TableCell sx={{ color: "var(--text-default)", fontWeight: 400 }}>
              Date In
            </TableCell>
            <TableCell sx={{ color: "var(--text-default)", fontWeight: 400 }}>
              Symptoms
            </TableCell>
            <TableCell sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}>
              Status
            </TableCell>
            <TableCell align="right" sx={{ color: theme.palette.text.secondary, fontWeight: 400 }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patients.map((patient) => {
            const statusColor = getStatusColor(patient.status);

            return (
              <TableRow key={patient.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={patient.avatar}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: theme.palette.primary.light
                      }}
                    >
                      {patient.name.charAt(0)}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {patient.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: "var(--text-default)" }}>
                  {patient.date}
                </TableCell>
                <TableCell sx={{ color: "var(--text-default)" }}>
                  {patient.diagnostic}
                </TableCell>
                <TableCell>
                  <Chip
                    label={patient.status}
                    size="small"
                    sx={{
                      bgcolor: statusColor.bgColor,
                      color: statusColor.textColor,
                      fontWeight: 500,
                      fontSize: 12,
                    }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small">
                      <DeleteIcon color={theme.palette.error.main} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default PatientDataTable;