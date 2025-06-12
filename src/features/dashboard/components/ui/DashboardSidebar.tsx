"use client";

// src/features/dashboard/components/ui/DashboardSidebar.tsx
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme
} from '@mui/material';
import { useRouter } from 'next/navigation';
import UserInfoSection from '@/components/ui/layout/UserInfoSection';
import {
  DashboardIcon,
  AppointmentIcon,
  PractitionerIcon,
  PatientIcon,
  ReportIcon,
  SettingIcon,
  LogoutIcon
} from '../../../../components/ui/icons';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  active?: boolean;
}

interface DashboardSidebarProps {
  user?: any;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  user
}) => {
  const theme = useTheme();
  const router = useRouter();

  // Navigation items based on Figma design
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      icon: <DashboardIcon color={theme.palette.primary.contrastText} />,
      path: '/dashboard',
      active: true
    },
    {
      label: 'Appointment',
      icon: <AppointmentIcon color="#A9A9A9" />,
      path: '/appointment'
    },
    {
      label: 'Practitioner',
      icon: <PractitionerIcon color="#A9A9A9" />,
      path: '/practitioners'
    },
    {
      label: 'Patient',
      icon: <PatientIcon color="#A9A9A9" />,
      path: '/patients'
    },
    {
      label: 'Report',
      icon: <ReportIcon color="#A9A9A9" />,
      path: '/report'
    },
    {
      label: 'Setting',
      icon: <SettingIcon color="#A9A9A9" />,
      path: '/settings'
    },
    {
      label: 'Logout',
      icon: <LogoutIcon color="#A9A9A9" />,
      path: '/logout'
    },
  ];

  const handleNavigation = (path: string) => {
    if (path === '/logout') {
      // Handle logout logic here
      console.log('Logging out...');
      return;
    }
    router.push(path);
  };

  return (
    <Box
      sx={{
        width: 280,
        backgroundColor: '#fff',
        borderRight: `1px solid ${theme.palette.divider}`,
        display: { xs: 'none', md: 'flex' },
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
        flexDirection: 'column'
      }}
    >
      {/* Gandall Logo */}
      <Box
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          component="img"
          src="/assets/brand/gandall-logo.png"
          alt="Gandall Group"
          sx={{
            width: 130,
            height: 'auto',
            maxWidth: '85%',
            objectFit: 'contain'
          }}
        />
      </Box>

      {/* Navigation */}
      <List sx={{ px: 2 }}>
        {navItems.map((item) => (
          <ListItem
            key={item.path}
            component="div"
            onClick={() => handleNavigation(item.path)}
            sx={{
              borderRadius: 1,
              mb: 0.5,
              cursor: 'pointer',
              color: item.active ? '#fff' : theme.palette.text.secondary,
              backgroundColor: item.active ? theme.palette.primary.main : 'transparent',
              '&:hover': {
                backgroundColor: item.active ? theme.palette.primary.main : theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: item.active ? '#fff' : theme.palette.text.secondary,
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      {/* User Profile */}
      <UserInfoSection open={true} />
    </Box>
  );
};

export default DashboardSidebar;
