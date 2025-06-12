"use client";

import React, { ReactNode, useState } from 'react';
import { Box, Container, useTheme, Toolbar, AppBar, IconButton, Typography, Avatar, Badge, Drawer, Divider, List, ListItem, ListItemIcon, ListItemText, useMediaQuery } from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  MedicalServices as MedicalServicesIcon,
  Healing as PrescriptionIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  Search as SearchIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';

// Constants for layout dimensions
const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_COLLAPSED = 72;
const APP_BAR_HEIGHT = 64;

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  isOffline?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title = 'Dashboard', isOffline = false }) => {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      setDrawerCollapsed(!drawerCollapsed);
    }
  };

  const drawerWidth = drawerCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

  const menuItems = [
    {
      text: t('menu.dashboard'),
      icon: <DashboardIcon />,
      route: '/dashboard'
    },
    {
      text: t('menu.patients'),
      icon: <PeopleIcon />,
      route: '/patients'
    },
    {
      text: t('menu.practitioners'),
      icon: <MedicalServicesIcon />,
      route: '/practitioners'
    },
    {
      text: t('menu.prescriptions'),
      icon: <PrescriptionIcon />,
      route: '/prescriptions'
    },
  ];

  const bottomMenuItems = [
    { text: t('menu.settings'), icon: <SettingsIcon />, route: '/settings' },
    { text: t('menu.logout'), icon: <LogoutIcon />, route: '/logout' },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'white',
          color: 'text.primary',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(drawerOpen && !isMobile && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginLeft: `${drawerWidth}px`,
            transition: theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>

          {/* Search Icon */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <SearchIcon />
          </IconButton>

          {/* Offline Indicator */}
          {isOffline && (
            <Badge
              badgeContent=""
              variant="dot"
              color="error"
              sx={{ mx: 1 }}
            >
              <WifiOffIcon color="error" />
            </Badge>
          )}

          {/* Notification Icon */}
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Badge badgeContent={3} color="primary">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Avatar */}
          <Avatar sx={{ width: 32, height: 32, ml: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={drawerOpen}
        onClose={isMobile ? handleDrawerToggle : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: drawerCollapsed ? 'center' : 'space-between',
            px: [1],
          }}
        >
          {!drawerCollapsed && (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                color: 'white',
                ml: 1
              }}
            >
              Gandall Health
            </Typography>
          )}

          {!isMobile && (
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Toolbar>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />

        {/* Main Menu Items */}
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => (
            <ListItem
              component="div"
              key={item.text}
              onClick={() => router.push(item.route)}
              sx={{
                py: 1.5,
                px: 2,
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{
                minWidth: drawerCollapsed ? 'auto' : 48,
                color: 'white'
              }}>
                {item.icon}
              </ListItemIcon>
              {!drawerCollapsed && <ListItemText primary={item.text} />}
            </ListItem>
          ))}
        </List>

        {/* Bottom Menu Items */}
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
        <List sx={{ mt: 'auto', pb: 2 }}>
          {bottomMenuItems.map((item) => (
            <ListItem
              component="div"
              key={item.text}
              onClick={() => router.push(item.route)}
              sx={{
                py: 1.5,
                px: 2,
                mb: 1,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{
                minWidth: drawerCollapsed ? 'auto' : 48,
                color: 'white'
              }}>
                {item.icon}
              </ListItemIcon>
              {!drawerCollapsed && <ListItemText primary={item.text} />}
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          pt: `calc(${APP_BAR_HEIGHT}px + ${theme.spacing(3)})`,
          height: '100vh',
          overflow: 'auto',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
