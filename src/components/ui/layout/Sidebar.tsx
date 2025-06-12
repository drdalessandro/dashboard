"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    IconButton,
    Collapse,
    Typography,
    useTheme,
    useMediaQuery,
    Avatar
} from '@mui/material';
import {
    ExpandLess,
    ExpandMore,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Menu as MenuIcon,
    Help as HelpIcon
} from '@mui/icons-material';
import {
    DashboardIcon,
    PatientIcon,
    PractitionerIcon,
    ReportIcon,
    SettingIcon,
    LogoutIcon,
    AppointmentIcon
} from '../icons';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { getUserInfo, saveUserInfo, createUserInfo, UserInfo } from '../../../utils/userInfoStorage';
import UserInfoSection from './UserInfoSection';

// Define the width of the sidebar when expanded
const DRAWER_WIDTH = 240;

// Navigation item type
interface NavItem {
    key: string;
    label: string;
    path?: string;
    icon: React.ReactNode;
    children?: NavItem[];
}

interface SidebarProps {
    isMobile?: boolean;
}

/**
 * User Info Section Component
 * Displays the current logged-in user's information at the bottom of the sidebar
 */
// const UserInfoSection = ({ open }: { open: boolean }) => {
//     const { state } = useAuth();
//     const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

//     useEffect(() => {
//         try {
//             // Try to get user info from auth state first
//             if (state.user) {
//                 const userInfoData = createUserInfo(state.user);
//                 saveUserInfo(userInfoData);
//                 setUserInfo(userInfoData);
//             } else {
//                 // Try to get from localStorage if not in auth state
//                 const storedUserInfo = getUserInfo();
//                 if (storedUserInfo) {
//                     setUserInfo(storedUserInfo);
//                 }
//             }
//         } catch (error) {
//             console.error('Error managing user info:', error);
//         }
//     }, [state.user]);

//     if (!userInfo) return null;

//     return (
//         <Box
//             sx={{
//                 mt: 'auto',
//                 p: 2,
//                 display: 'flex',
//                 alignItems: 'center',
//                 borderTop: '1px solid',
//                 borderColor: 'divider',
//                 backgroundColor: 'background.default'
//             }}
//         >
//             <Avatar
//                 sx={{
//                     width: 40,
//                     height: 40,
//                     bgcolor: 'primary.main',
//                     color: 'primary.contrastText',
//                     fontSize: '1rem',
//                     fontWeight: 600
//                 }}
//             >
//                 {userInfo.initials}
//             </Avatar>
//             {open && (
//                 <Box sx={{ ml: 2, overflow: 'hidden' }}>
//                     <Typography
//                         variant="subtitle2"
//                         sx={{
//                             fontWeight: 600,
//                             whiteSpace: 'nowrap',
//                             overflow: 'hidden',
//                             textOverflow: 'ellipsis'
//                         }}
//                     >
//                         {userInfo.name}
//                     </Typography>
//                     <Typography
//                         variant="caption"
//                         sx={{
//                             color: 'text.secondary',
//                             whiteSpace: 'nowrap',
//                             overflow: 'hidden',
//                             textOverflow: 'ellipsis'
//                         }}
//                     >
//                         {userInfo.role}
//                     </Typography>
//                 </Box>
//             )}
//         </Box>
//     );
// };

const Sidebar: React.FC<SidebarProps> = ({ isMobile = false }) => {
    const { t, i18n } = useTranslation(['navigation', 'common']);
    const router = useRouter();
    const pathname = usePathname();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    // State for drawer open/closed
    const [open, setOpen] = useState(!isMobile);

    // State for expanded menu items
    const [expanded, setExpanded] = useState<string | null>('patients');

    // Toggle drawer open/closed
    const toggleDrawer = () => {
        setOpen(!open);
    };

    // Toggle expanded state for menu items
    const handleExpandClick = (key: string) => {
        setExpanded(expanded === key ? null : key);
    };

    // Check if a menu item is active
    const isActive = (path: string) => {
        if (!pathname) return false;
        return pathname === path || pathname.startsWith(`${path}/`);
    };

    // Improved translation with fallback and logging
    const translateNavItem = (key: string, defaultValue: string) => {
        // Check if translation exists in multiple namespaces
        const translationKey = `navigation:${key}`;
        const fallbackKey = `common:${key}`;

        // Log translation resolution for debugging
        console.debug(`Resolving translation for key: ${key}`, {
            currentLanguage: i18n.language,
            navigationNamespace: i18n.exists(translationKey),
            commonNamespace: i18n.exists(fallbackKey)
        });

        // Try translation with fallback
        return t(translationKey, {
            defaultValue: i18n.exists(fallbackKey)
                ? t(fallbackKey, defaultValue)
                : defaultValue,
            ns: ['navigation', 'common']
        });
    };

    // Navigation items
    const navItems: NavItem[] = [
        {
            key: 'dashboard',
            label: translateNavItem('dashboard', 'Dashboard'),
            path: '/',
            icon: <DashboardIcon color={isActive('/') ? theme.palette.primary.main : undefined} />
        },
        {
            key: 'patients',
            label: translateNavItem('patients', 'Patients'),
            path: '/patients',
            icon: <PatientIcon color={isActive('/patients') ? theme.palette.primary.main : undefined} />,
            children: [
                {
                    key: 'patients-list',
                    label: translateNavItem('all', 'All'),
                    path: '/patients',
                    icon: <PatientIcon color={isActive('/patients') && !isActive('/patients/create') ? theme.palette.primary.main : undefined} />
                },
                {
                    key: 'patients-create',
                    label: translateNavItem('create', 'Create'),
                    path: '/patients/create',
                    icon: <PatientIcon color={isActive('/patients/create') ? theme.palette.primary.main : undefined} />
                }
            ]
        },
        {
            key: 'practitioners',
            label: translateNavItem('practitioners', 'Practitioners'),
            path: '/practitioners',
            icon: <PractitionerIcon color={isActive('/practitioners') ? theme.palette.primary.main : undefined} />,
            children: [
                {
                    key: 'practitioners-list',
                    label: translateNavItem('all', 'All'),
                    path: '/practitioners',
                    icon: <PractitionerIcon color={isActive('/practitioners') && !isActive('/practitioners/create') ? theme.palette.primary.main : undefined} />
                },
                {
                    key: 'practitioners-create',
                    label: translateNavItem('create', 'Create'),
                    path: '/practitioners/create',
                    icon: <PractitionerIcon color={isActive('/practitioners/create') ? theme.palette.primary.main : undefined} />
                }
            ]
        },
        {
            key: 'prescriptions',
            label: translateNavItem('prescriptions', 'Prescriptions'),
            path: '/prescriptions',
            icon: <AppointmentIcon color={isActive('/prescriptions') ? theme.palette.primary.main : undefined} />
        }
    ];

    // Render menu items recursively
    const renderNavItems = (navItems: NavItem[], level = 0) => {
        return navItems.map((item, index) => {
            // Safely handle children, defaulting to an empty array
            const children = item.children ?? [];
            const hasChildren = children.length > 0;

            const isItemActive = item.path ? isActive(item.path) : false;
            const isItemExpanded = expanded === item.key;

            // Safely check for child active status
            const isChildActive = hasChildren && children.some(child =>
                child.path ? isActive(child.path) : false
            );

            return (
                <React.Fragment key={`${item.label}-${index}`}>
                    <ListItem
                        disablePadding
                        sx={{
                            display: 'block',
                            pl: level * 2,
                            ...(isItemActive || isChildActive
                                ? { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                : {})
                        }}
                    >
                        {item.path ? (
                            <ListItemButton
                                component={Link}
                                href={item.path}
                                selected={isItemActive}
                                sx={{
                                    minHeight: 48,
                                    px: 2.5,
                                    borderRadius: 1,
                                    mx: 1,
                                    my: 0.5,
                                    backgroundColor: isItemActive ? 'primary.50' : 'transparent',
                                    color: isItemActive ? 'primary.main' : 'inherit',
                                    '&:hover': {
                                        backgroundColor: 'primary.50',
                                    },
                                    '&.Mui-selected': {
                                        backgroundColor: 'primary.50',
                                        color: 'primary.main',
                                        '&:hover': {
                                            backgroundColor: 'primary.100',
                                        },
                                    }
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 2 : 'auto',
                                        justifyContent: 'center',
                                        color: isItemActive ? 'primary.main' : 'inherit',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {open && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: 14,
                                            fontWeight: isItemActive ? 600 : 400
                                        }}
                                    />
                                )}
                                {hasChildren && open && (
                                    <IconButton
                                        edge="end"
                                        size="small"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleExpandClick(item.key);
                                        }}
                                    >
                                        {isItemExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                )}
                            </ListItemButton>
                        ) : (
                            <ListItemButton
                                onClick={() => handleExpandClick(item.key)}
                                sx={{
                                    minHeight: 48,
                                    px: 2.5,
                                    borderRadius: 1,
                                    mx: 1,
                                    my: 0.5,
                                    backgroundColor: isChildActive ? 'primary.50' : 'transparent',
                                    color: isChildActive ? 'primary.main' : 'inherit',
                                    '&:hover': {
                                        backgroundColor: 'primary.50',
                                    }
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 2 : 'auto',
                                        justifyContent: 'center',
                                        color: isChildActive ? 'primary.main' : 'inherit',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {open && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontSize: 14,
                                            fontWeight: isChildActive ? 600 : 400
                                        }}
                                    />
                                )}
                                {hasChildren && open && (
                                    <IconButton
                                        edge="end"
                                        size="small"
                                    >
                                        {isItemExpanded ? <ExpandLess /> : <ExpandMore />}
                                    </IconButton>
                                )}
                            </ListItemButton>
                        )}
                    </ListItem>

                    {/* Render children if expanded */}
                    {hasChildren && (
                        <Collapse
                            in={isItemExpanded && open}
                            timeout="auto"
                            unmountOnExit
                        >
                            <List component="div" disablePadding>
                                {renderNavItems(children, level + 1)}
                            </List>
                        </Collapse>
                    )}
                </React.Fragment>
            );
        });
    };

    // Drawer content
    const drawerContent = (
        <>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: open ? 'space-between' : 'center',
                    p: 2
                }}
            >
                {open && (
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            fontWeight: 700,
                            fontSize: '1.2rem',
                            color: 'primary.main'
                        }}
                    >
                        Gandall Health
                    </Typography>
                )}
                <IconButton onClick={toggleDrawer}>
                    {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton>
            </Box>
            <Divider />
            <List sx={{ pt: 1 }}>
                {navItems && navItems.length > 0 && renderNavItems(navItems, 0)}
            </List>
            <Divider sx={{ mt: 'auto' }} />
            <List>
                <ListItem disablePadding>
                    <ListItemButton
                        sx={{
                            minHeight: 48,
                            px: 2.5,
                            borderRadius: 1,
                            mx: 1,
                            my: 0.5,
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: open ? 2 : 'auto',
                                justifyContent: 'center',
                            }}
                        >
                            <SettingIcon />
                        </ListItemIcon>
                        {open && <ListItemText primary={translateNavItem('settings', 'Settings')} />}
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        sx={{
                            minHeight: 48,
                            px: 2.5,
                            borderRadius: 1,
                            mx: 1,
                            my: 0.5,
                        }}
                    >
                        <ListItemIcon
                            sx={{
                                minWidth: 0,
                                mr: open ? 2 : 'auto',
                                justifyContent: 'center',
                            }}
                        >
                            <HelpIcon />
                        </ListItemIcon>
                        {open && <ListItemText primary={translateNavItem('help', 'Help')} />}
                    </ListItemButton>
                </ListItem>
            </List>

            {/* User Info Section */}
            <UserInfoSection open={open} />
        </>
    );

    // Render different drawer variants based on screen size
    return isDesktop ? (
        <Drawer
            variant="permanent"
            open={open}
            sx={{
                width: open ? DRAWER_WIDTH : 72,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? DRAWER_WIDTH : 72,
                    boxSizing: 'border-box',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    overflowX: 'hidden',
                    transition: theme.transitions.create(['width'], {
                        easing: theme.transitions.easing.sharp,
                        duration: theme.transitions.duration.enteringScreen,
                    }),
                },
            }}
        >
            {drawerContent}
        </Drawer>
    ) : (
        <>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={toggleDrawer}
                edge="start"
                sx={{
                    position: 'fixed',
                    top: 12,
                    left: 12,
                    zIndex: 1199,
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    display: { xs: 'flex', md: 'none' },
                }}
            >
                <MenuIcon />
            </IconButton>
            <Drawer
                variant="temporary"
                open={open}
                onClose={toggleDrawer}
                ModalProps={{
                    keepMounted: true, // Better mobile performance
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
};

export default Sidebar;