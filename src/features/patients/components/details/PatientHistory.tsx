/**
 * PatientHistory
 * Displays patient medical history in a table format
 * Implements the history section from the design with responsive layout
 */
import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Download as DownloadIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Patient } from '@medplum/fhirtypes';

// Define history entry type for type safety
interface HistoryEntry {
  date: string;
  diagnosis: string;
  severity: 'High' | 'Medium' | 'Low';
  totalVisits: number;
  status: 'Under Treatment' | 'Cured';
  documentUrl?: string;
}

interface PatientHistoryProps {
  patient: Patient;
}

const PatientHistory: React.FC<PatientHistoryProps> = ({ patient }) => {
  const { t } = useTranslation(['patient', 'common']);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Mock history data (in a real app, this would come from Condition resources)
  // @TODO: Fetch history data from Condition resources
  const historyEntries: HistoryEntry[] = [
    {
      date: '20 Jan, 2023',
      diagnosis: 'Malaria',
      severity: 'High',
      totalVisits: 2,
      status: 'Under Treatment',
      documentUrl: '/documents/malaria-report.pdf'
    },
    {
      date: '12 Jan, 2022',
      diagnosis: 'Viral Fever',
      severity: 'Low',
      totalVisits: 1,
      status: 'Cured',
      documentUrl: '/documents/viral-fever-report.pdf'
    },
    {
      date: '20 Jan, 2021',
      diagnosis: 'Covid 19',
      severity: 'High',
      totalVisits: 6,
      status: 'Cured',
      documentUrl: '/documents/covid-report.pdf'
    }
  ];

  // Get color based on severity
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'High':
        return theme.palette.error.main;
      case 'Medium':
        return theme.palette.warning.main;
      case 'Low':
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Get color based on status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Under Treatment':
        return theme.palette.error.main;
      case 'Cured':
        return theme.palette.success.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Get background color based on status
  const getStatusBgColor = (status: string): string => {
    switch (status) {
      case 'Under Treatment':
        return theme.palette.error.light;
      case 'Cured':
        return theme.palette.success.light;
      default:
        return theme.palette.primary.light;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
          {t('patient.patientHistory')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('stats.totalVisits', { count: 35, ns: 'patient' })}
        </Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table sx={{ minWidth: isMobile ? 650 : 800 }} aria-label="patient history table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'background.default' }}>
              <TableCell>{t('dateOfVisit', { ns: 'patient' })}</TableCell>
              <TableCell>{t('diagnosis', { ns: 'patient' })}</TableCell>
              <TableCell>{t('severity', { ns: 'patient' })}</TableCell>
              <TableCell>{t('totalVisits', { ns: 'patient' })}</TableCell>
              <TableCell>{t('status', { ns: 'patient' })}</TableCell>
              <TableCell>{t('documents', { ns: 'patient' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historyEntries.map((entry, index) => (
              <TableRow
                key={index}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {entry.date}
                </TableCell>
                <TableCell>{entry.diagnosis}</TableCell>
                <TableCell>
                  <Chip
                    label={entry.severity}
                    size="small"
                    sx={{
                      color: 'white',
                      bgcolor: getSeverityColor(entry.severity),
                      fontWeight: 'medium',
                      minWidth: 60
                    }}
                  />
                </TableCell>
                <TableCell>{entry.totalVisits}</TableCell>
                <TableCell>
                  <Chip
                    label={entry.status}
                    size="small"
                    sx={{
                      color: getStatusColor(entry.status),
                      bgcolor: `${getStatusBgColor(entry.status)}30`,
                      fontWeight: 'medium'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    aria-label={t('downloadDocument', { ns: 'patient' })}
                    sx={{ color: theme.palette.primary.main }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PatientHistory;
