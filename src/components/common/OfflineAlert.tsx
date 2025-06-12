/**
 * OfflineAlert
 * Displays contextual alerts about connectivity status
 * Essential for healthcare workers operating in low-connectivity environments
 */

import React from 'react';
import { 
  Alert, 
  AlertTitle, 
  Collapse, 
  IconButton, 
  Box,
  Snackbar
} from '@mui/material';
import { 
  Close as CloseIcon,
  WifiOff as WifiOffIcon 
} from '@mui/icons-material';
import { useSyncStatus } from '../../hooks/common/useSyncStatus';
import { useTranslation } from '../../hooks/common/useTranslation';
import { useMediaQuery } from '../../hooks/common/useMediaQuery';

interface OfflineAlertProps {
  /**
   * Alert mode: 'banner' (fixed at top), 'inline' (within content), or 'toast' (temporary notification)
   */
  mode?: 'banner' | 'inline' | 'toast';
  
  /**
   * Optional callback when the alert is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Whether the alert can be dismissed by the user
   */
  dismissible?: boolean;
  
  /**
   * Custom message to show in the alert (overrides default)
   */
  customMessage?: string;
  
  /**
   * Whether to auto hide the alert after some time (toast mode only)
   */
  autoHideDuration?: number;
}

/**
 * Component that displays an alert when the application is offline
 * Provides context-aware messaging for healthcare scenarios
 */
export const OfflineAlert: React.FC<OfflineAlertProps> = ({
  mode = 'banner',
  onDismiss,
  dismissible = true,
  customMessage,
  autoHideDuration = 6000
}) => {
  const { t } = useTranslation();
  const { isOnline, hasPendingChanges } = useSyncStatus();
  const isMobile = useMediaQuery('(max-width: 600px)');
  const [open, setOpen] = React.useState(true);
  
  // Don't show anything if online
  if (isOnline) {
    return null;
  }
  
  const handleClose = () => {
    setOpen(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Get the appropriate message based on the current state
  const getMessage = () => {
    if (customMessage) {
      return customMessage;
    }
    
    if (hasPendingChanges) {
      return t('offline.pendingChanges');
    }
    
    return t('offline.message');
  };
  
  const alertContent = (
    <Alert 
      severity="warning"
      icon={<WifiOffIcon />}
      action={
        dismissible ? (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        ) : undefined
      }
      sx={{
        width: '100%',
        ...(mode === 'banner' && {
          borderRadius: 0,
          boxShadow: 2
        })
      }}
    >
      <AlertTitle>{t('offline.title')}</AlertTitle>
      {getMessage()}
    </Alert>
  );
  
  // Render the alert based on the specified mode
  switch (mode) {
    case 'toast':
      return (
        <Snackbar
          open={open}
          autoHideDuration={autoHideDuration}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: isMobile ? 'center' : 'right'
          }}
        >
          {alertContent}
        </Snackbar>
      );
      
    case 'inline':
      return (
        <Collapse in={open}>
          <Box sx={{ mb: 2 }}>
            {alertContent}
          </Box>
        </Collapse>
      );
      
    case 'banner':
    default:
      return (
        <Collapse in={open}>
          <Box 
            sx={{ 
              position: 'sticky', 
              top: 0, 
              zIndex: 1100,
              width: '100%'
            }}
          >
            {alertContent}
          </Box>
        </Collapse>
      );
  }
};

export default OfflineAlert;
