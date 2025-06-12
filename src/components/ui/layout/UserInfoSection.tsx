import React, { useState, useEffect } from 'react';
import { Box, Avatar, Typography } from '@mui/material';
import { UserInfo, getUserInfo } from '../../../utils/userInfoStorage';

interface UserInfoSectionProps {
    open: boolean;
}

const UserInfoSection: React.FC<UserInfoSectionProps> = ({ open }) => {
    const [localUserInfo, setLocalUserInfo] = useState<UserInfo | null>(null);

    useEffect(() => {
        // Function to get user info from localStorage
        const loadUserInfo = () => {
            const storedUserInfo = getUserInfo();
            if (storedUserInfo) {
                setLocalUserInfo(storedUserInfo);
            }
        };

        // Load user info initially
        loadUserInfo();

        // Set up an event listener to update when localStorage changes
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'user_info') {
                loadUserInfo();
            }
        };

        window.addEventListener('storage', handleStorageChange);

        // Check periodically for user info changes
        const interval = setInterval(loadUserInfo, 3000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    // If no user info available, show a minimal placeholder
    if (!localUserInfo) {
        return (
            <Box
                sx={{
                    mt: 'auto',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.default'
                }}
            >
                <Avatar
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: 'grey.300',
                        color: 'grey.700',
                        fontSize: '1rem',
                        fontWeight: 600
                    }}
                >
                    ?
                </Avatar>
                {open && (
                    <Box sx={{ ml: 2, overflow: 'hidden' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            Sign In
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            No user detected
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    return (
        <Box
            sx={{
                mt: 'auto',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                borderTop: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.default'
            }}
        >
            <Avatar
                sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    fontSize: '1rem',
                    fontWeight: 600
                }}
            >
                {localUserInfo.initials}
            </Avatar>
            {open && (
                <Box sx={{ ml: 2, overflow: 'hidden' }}>
                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {localUserInfo.name}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'text.secondary',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}
                    >
                        {localUserInfo.role}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default UserInfoSection;