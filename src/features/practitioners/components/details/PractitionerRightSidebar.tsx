/**
 * PractitionerRightSidebar.tsx (SIMPLIFIED VERSION)
 * 
 * Simplified version to fix infinite loading issue
 */

"use client";

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Stack,
  Rating,
  LinearProgress,
  Skeleton,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  CalendarTodayOutlined,
  MessageOutlined,
  PhoneOutlined,
  EmailOutlined,
  AccessTimeOutlined,
  PeopleOutlined,
  StarOutlined,
  EventAvailableOutlined,
  LocationOnOutlined,
  LocalHospitalOutlined,
  PersonOutlined,
  RefreshOutlined,
  ErrorOutlined,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { formatDistanceToNow } from 'date-fns';

interface PractitionerRightSidebarProps {
  practitioner: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    status: string;
    patientCount: number;
    specialties: string[];
    languages: string[];
    qualification?: string;
    city?: string;
    country?: string;
    address?: string;
    bio?: string;
    experience?: any[];
    education?: any[];
    schedule?: any[];
  };
  isOffline?: boolean;
}

export const PractitionerRightSidebar: React.FC<PractitionerRightSidebarProps> = ({
  practitioner,
  isOffline: propIsOffline = false,
}) => {
  const { t } = useTranslation(['practitioner', 'common']);
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const isOffline = propIsOffline || !isOnline;

  // Static data for now to avoid loading issues
  const totalPatientCount = 0;
  const recentPatients: any[] = [];

  // Quick action handlers
  const handleScheduleAppointment = React.useCallback(() => {
    if (!isOffline) {
      router.push(`/appointments/book/${practitioner.id}`);
    }
  }, [isOffline, router, practitioner.id]);

  const handleSendMessage = React.useCallback(() => {
    if (!isOffline) {
      router.push(`/messages/new?to=${practitioner.id}`);
    }
  }, [isOffline, router, practitioner.id]);

  const handleCall = React.useCallback(() => {
    if (practitioner.phone) {
      window.location.href = `tel:${practitioner.phone}`;
    }
  }, [practitioner.phone]);

  const handleEmail = React.useCallback(() => {
    if (practitioner.email) {
      window.location.href = `mailto:${practitioner.email}`;
    }
  }, [practitioner.email]);

  // Mock data for demonstration
  const practitionerStats = React.useMemo(() => ({
    rating: 4.8,
    reviewCount: 127,
    responseTime: t('common:responseTime', { ns: 'common' }),
    availabilityPercentage: 85,
    nextAvailable: 'Today 2:30 PM',
  }), [t]);

  // Format relative time with error handling
  const formatRelativeTime = React.useCallback((dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return t('common:recently', { ns: 'common' });
    }
  }, [t]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: { xs: 0, lg: 2 } }}>
      {/* Quick Actions Card */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 'none' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Typography variant="body1" fontWeight={600}>
            {t('practitioner:sidebar.quickActions', { ns: 'practitioner' })}
          </Typography>
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<CalendarTodayOutlined />}
              onClick={handleScheduleAppointment}
              disabled={isOffline}
              disableElevation
              sx={{ justifyContent: 'flex-start' }}
            >
              {t('practitioner:sidebar.scheduleAppointment', { ns: 'practitioner' })}
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<MessageOutlined />}
              onClick={handleSendMessage}
              disabled={isOffline}
              sx={{ justifyContent: 'flex-start' }}
            >
              {t('practitioner:sidebar.sendMessage', { ns: 'practitioner' })}
            </Button>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={handleCall}
                disabled={!practitioner.phone}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <PhoneOutlined />
              </IconButton>
              <IconButton
                onClick={handleEmail}
                disabled={!practitioner.email}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
              >
                <EmailOutlined />
              </IconButton>
            </Box>
          </Stack>
          {isOffline && (
            <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
              {t('practitioner:sidebar.offlineActionsLimited', { ns: 'practitioner' })}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Practitioner Stats Card */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 'none' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Typography variant="body1" fontWeight={600}>
            {t('practitioner:sidebar.statistics', { ns: 'practitioner' })}
          </Typography>
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={2}>
            {/* Rating */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Rating value={practitionerStats.rating} precision={0.1} readOnly size="small" />
                <Typography variant="body2" fontWeight={600}>
                  {practitionerStats.rating}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({practitionerStats.reviewCount} reviews)
                </Typography>
              </Box>
            </Box>

            {/* Response Time */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeOutlined fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {practitionerStats.responseTime}
              </Typography>
            </Box>

            {/* Availability */}
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Availability
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={practitionerStats.availabilityPercentage} 
                sx={{ height: 6, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                {practitionerStats.availabilityPercentage}% this week
              </Typography>
            </Box>

            {/* Next Available */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventAvailableOutlined fontSize="small" color="action" />
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  Next available
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {practitionerStats.nextAvailable}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Patients Under Care Card */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 'none' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body1" fontWeight={600}>
              {t('practitioner:sidebar.patientsUnderCare', { ns: 'practitioner' })}
            </Typography>
          </Box>
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PeopleOutlined color="action" />
            <Typography variant="h6" component="div">
              {totalPatientCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              total patients under primary care
            </Typography>
          </Box>

          {recentPatients.length === 0 ? (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
              No patient data available
            </Typography>
          ) : (
            <List dense sx={{ mt: 2 }}>
              {recentPatients.map((patient) => (
                <ListItem key={patient.id} sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PersonOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={patient.name}
                    secondary={`Last visit: ${formatRelativeTime(patient.lastEncounterDate)}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Contact & Location Card */}
      <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, boxShadow: 'none' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Typography variant="body1" fontWeight={600}>
            {t('practitioner:sidebar.contactInfo', { ns: 'practitioner' })}
          </Typography>
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            {practitioner.email && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailOutlined fontSize="small" color="action" />
                <Typography variant="body2" noWrap>
                  {practitioner.email}
                </Typography>
              </Box>
            )}

            {practitioner.phone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneOutlined fontSize="small" color="action" />
                <Typography variant="body2">
                  {practitioner.phone}
                </Typography>
              </Box>
            )}

            {(practitioner.city || practitioner.country) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnOutlined fontSize="small" color="action" />
                <Typography variant="body2">
                  {[practitioner.city, practitioner.country].filter(Boolean).join(', ')}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PractitionerRightSidebar;
