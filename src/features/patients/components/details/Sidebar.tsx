/**
 * Sidebar
 * Left sidebar component for the patient details dashboard
 * Displays practitioner information and navigation menu
 */
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Rating,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  BarChart as StatisticsIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Patient } from '@medplum/fhirtypes';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface SidebarProps {
  patient?: Patient;
}

export const Sidebar: React.FC<SidebarProps> = ({ patient }) => {
  const { t } = useTranslation();
  const pathname = usePathname();

  // Navigation items
  const navItems = [
    {
      icon: <DashboardIcon />,
      label: t('navigation.dashboard'),
      path: '/dashboard'
    },
    {
      icon: <PersonIcon color="primary" />,
      label: t('navigation.patient'),
      path: '/patients'
    },
    {
      icon: <ScheduleIcon />,
      label: t('navigation.schedule'),
      path: '/schedule'
    },
    {
      icon: <StatisticsIcon />,
      label: t('navigation.statistics'),
      path: '/statistics'
    },
    {
      icon: <SettingsIcon />,
      label: t('navigation.settings'),
      path: '/settings'
    }
  ];

  // Check if path is active
  const isActive = (path: string) => {
    return pathname?.startsWith(path) || false;
  };

  return (
    <Box sx={{ height: '100%' }}>
      {/* Practitioner profile section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 2,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          background: 'linear-gradient(to bottom right, #f5f5f5, #ffffff)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: 'url("/images/pattern-dots.svg")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right top',
            opacity: 0.1,
            zIndex: 0
          }
        }}
      >
        <Avatar
          src="/images/practitioner-avatar.jpg"
          alt="Dr. Richa Linda"
          sx={{
            width: 100,
            height: 100,
            mb: 1,
            border: '3px solid #fff',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Rating value={4.5} precision={0.5} size="small" readOnly />
          <Typography variant="body2" sx={{ ml: 0.5 }}>4.5</Typography>
        </Box>

        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Dr. Richa Linda
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          MD, DM (Cardiology)
        </Typography>
      </Paper>

      {/* Navigation menu */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <List component="nav" disablePadding>
          {navItems.map((item, index) => (
            <ListItem
              key={index}
              sx={{
                py: 1.5,
                color: isActive(item.path) ? 'primary.main' : 'text.primary',
                borderLeft: isActive(item.path) ? '3px solid' : '3px solid transparent',
                borderColor: isActive(item.path) ? 'primary.main' : 'transparent',
                bgcolor: isActive(item.path) ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.08)'
                }
              }}
            >
              <Box
                component="div"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <Link href={item.path} passHref style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <ListItemIcon sx={{
                    minWidth: 40,
                    color: isActive(item.path) ? 'primary.main' : 'inherit'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 'medium' : 'regular'
                    }}
                  />
                </Link>
              </Box>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Membership expiry notice */}
      <Paper
        elevation={0}
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: '#1a1a1a',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          20 Days Left
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
          Extend your membership
        </Typography>
        <Button
          variant="outlined"
          size="small"
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
              bgcolor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          Check Now
        </Button>
      </Paper>
    </Box>
  );
};

export default Sidebar;
