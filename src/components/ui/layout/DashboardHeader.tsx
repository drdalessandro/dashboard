// src/components/ui/layout/DashboardHeader.tsx
import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box } from '@mui/material';
import {
    Notifications as NotificationsIcon,
    AccountCircle,
    WifiOff as OfflineIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface DashboardHeaderProps {
    title?: string;
    isOffline?: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    title = 'Dashboard',
    isOffline = false
}) => {
    const { t } = useTranslation();

    return (
        <AppBar
            position="relative"
            elevation={0}
            sx={{
                backgroundColor: 'background.paper',
                color: 'text.primary',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}
        >
            <Toolbar>
                <Typography
                    variant="h6"
                    noWrap
                    component="div"
                    sx={{
                        flexGrow: 1,
                        fontWeight: 600,
                        fontSize: '1.2rem',
                        display: { xs: 'none', md: 'block' }
                    }}
                >
                    {title}
                </Typography>

                {/* Offline indicator */}
                {isOffline && (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'warning.light',
                            color: 'warning.dark',
                            borderRadius: 1,
                            px: 1.5,
                            py: 0.5,
                            mr: 2
                        }}
                    >
                        <OfflineIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {t('common.offline')}
                        </Typography>
                    </Box>
                )}

                <IconButton
                    size="large"
                    color="inherit"
                    onClick={() => {}}
                >
                    <NotificationsIcon />
                </IconButton>
                <IconButton
                    size="large"
                    edge="end"
                    color="inherit"
                    onClick={() => {}}
                >
                    <AccountCircle />
                </IconButton>
            </Toolbar>
        </AppBar>
    );
};

export default DashboardHeader;