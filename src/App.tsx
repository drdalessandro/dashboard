// src/App.tsx
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

// Refine imports
import { Refine } from "@refinedev/core";
import { useNotification } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import NextRouterProvider from "@refinedev/nextjs-router/app";

// Material-UI components
import { Alert, Snackbar, ThemeProvider } from "@mui/material";
import CssBaselineWrapper from "@/components/ui/layout/CssBaselineWrapper";
import { theme } from "@/theme/healthcare.theme";

// Authentication
import { AuthWrapper } from '@components/auth/AuthWrapper';
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginButton from "@/components/auth/LoginButton";
import { medplumAuthService } from "@providers/auth-provider/medplumAuth";

// Medplum
import { MedplumProvider } from '@medplum/react';
import medplumDataProvider from "@providers/data-provider/medplum";
import { medplumClient } from "@lib/medplum/client";

// i18n
import { i18nInitPromise } from './utils/i18n';

// Debug utilities
import { ErrorBoundary, NetworkMonitor, isDebugEnabled } from "./utils/debug";
import { createLogger } from "./utils/logger";

// Types
interface NetworkInfo {
    online: boolean;
    connectionType?: string;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    lastChecked?: Date;
    saveData?: boolean;
}

// Constants
const logger = createLogger('App');

function App() {
    // Integrate AuthProvider and conditional login logic
    return (
        <AuthProvider>
            <InnerApp />
        </AuthProvider>
    );
}

function InnerApp() {
    const { accessToken } = useAuth();
    const [i18nInitialized, setI18nInitialized] = useState(false);
    const [i18nError, setI18nError] = useState<Error | null>(null);
    const { open } = useNotification();
    const { t, i18n: i18nInstance } = useTranslation(['common']);

    useEffect(() => {
        i18nInitPromise
            .then(() => {
                logger.info('i18n initialization complete');
                setI18nInitialized(true);
            })
            .catch(error => {
                logger.error('i18n initialization failed:', error);
                setI18nError(error);
                setI18nInitialized(false);
            });
    }, []);

    if (!i18nInitialized) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaselineWrapper />
                <div>
                    {i18nError ? (
                        <Alert severity="error">
                            Failed to initialize translations: {i18nError.message}
                        </Alert>
                    ) : (
                        'Loading translations...'
                    )}
                </div>
            </ThemeProvider>
        );
    }

    // Add logging for i18n details once initialized
    useEffect(() => {
        if (i18nInitialized) {
            logger.info('i18n current language:', i18nInstance.language);
            logger.info('i18n languages:', i18nInstance.languages);
            logger.info('i18n is initialized:', i18nInstance.isInitialized);
        }
    }, [i18nInitialized, i18nInstance]);

    // Define NetworkInfo type for proper TypeScript support
    interface NetworkInfo {
        online: boolean;
        connectionType?: string;
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        lastChecked?: Date;
        saveData?: boolean;
    }

    // Network status tracking (enhanced with NetworkMonitor component)
    const [networkStatus, setNetworkStatus] = useState<NetworkInfo>({
        online: typeof navigator !== 'undefined' ? navigator.onLine : true
    });
    const [showOfflineNotice, setShowOfflineNotice] = useState(false);
    const [showReconnectedNotice, setShowReconnectedNotice] = useState(false);

    // Handle network status changes from NetworkMonitor
    const handleNetworkStatusChange = (status: NetworkInfo) => {
        logger.debug('Network status changed:', status);

        // Check if this is a transition between online and offline
        const wasOnline = networkStatus.online;
        const isNowOnline = status.online;

        // Update network status state
        setNetworkStatus(status);

        // Handle offline transition
        if (wasOnline && !isNowOnline) {
            setShowOfflineNotice(true);
            logger.warn('Network disconnected. Working in offline mode.');
        }

        // Handle online transition 
        if (!wasOnline && isNowOnline) {
            setShowReconnectedNotice(true);
            setTimeout(() => setShowReconnectedNotice(false), 5000);
            logger.info('Network reconnected. Synchronization temporarily disabled.');
        }
    };

    useEffect(() => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            setShowOfflineNotice(true);
            logger.warn('Application started in offline mode.');
        }
        logger.info('SyncManager is completely disabled to prevent infinite loops');
        return () => { };
    }, []);

    // --- AUTH INTEGRATION ---
    if (!accessToken) {
        // Not authenticated: show login button only
        return (
            <ThemeProvider theme={theme}>
                <CssBaselineWrapper />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <LoginButton />
                </div>
            </ThemeProvider>
        );
    }

    // Authenticated: show main app
    return (
        <ThemeProvider theme={theme}>
            <CssBaselineWrapper />
            <ErrorBoundary
                fallback={({ error, resetError }) => (
                    <div className="error-container">
                        <h2>{t('errors.somethingWrong')}</h2>
                        <pre>{error.message}</pre>
                        <button onClick={resetError}>{t('buttons.tryAgain', { ns: 'common' })}</button>
                    </div>
                )}
            >
                <NetworkMonitor onStatusChange={handleNetworkStatusChange}>
                    <AuthWrapper>
                        <MedplumProvider medplum={medplumClient}>
                            <RefineKbarProvider>
                                <Refine
                                    dataProvider={medplumDataProvider()}
                                    notificationProvider={{
                                        open: (params) => {
                                            open?.({
                                                type: params.type,
                                                message: params.message,
                                                description: params.description,
                                            });
                                        },
                                        close: (key) => {
                                            // Close notification handler
                                            console.log('Closing notification:', key);
                                        }
                                    }}
                                    routerProvider={NextRouterProvider}
                                    authProvider={medplumAuthService}
                                    options={{
                                        syncWithLocation: true,
                                        warnWhenUnsavedChanges: true,
                                        // Enable offline-first capabilities
                                        mutationMode: "optimistic",
                                        // Configure React Query for offline support
                                        reactQuery: {
                                            clientConfig: {
                                                defaultOptions: {
                                                    queries: {
                                                        // Keep data fresh for 5 minutes
                                                        staleTime: 5 * 60 * 1000,
                                                        // Cache data for 1 hour
                                                        cacheTime: 60 * 60 * 1000,
                                                        // Retry failed requests 3 times
                                                        retry: 3,
                                                    },
                                                    mutations: {
                                                        // Critical for login functionality
                                                        retry: 2,
                                                    },
                                                },
                                            },
                                        },
                                    }}
                                    resources={[
                                        {
                                            name: "dashboard",
                                            list: "/dashboard",
                                        },
                                        {
                                            name: "patients",
                                            list: "/patients",
                                            create: "/patients/create",
                                            edit: "/patients/edit/:id",
                                            show: "/patients/show/:id",
                                            meta: {
                                                canDelete: true,
                                                detailsPage: "/patients/details/:id",
                                            },
                                        },
                                        {
                                            name: "practitioners",
                                            list: "/practitioners",
                                            create: "/practitioners/create",
                                            edit: "/practitioners/edit/:id",
                                            show: "/practitioners/show/:id",
                                            meta: {
                                                canDelete: true,
                                                detailsPage: "/practitioners/details/:id",
                                            },
                                        },
                                        {
                                            name: "prescriptions",
                                            list: "/prescriptions",
                                            show: "/prescriptions/:id",
                                        }
                                    ]}
                                >
                                    <RefineKbar />
                                </Refine>
                            </RefineKbarProvider>
                        </MedplumProvider>

                        {/* Offline/Online notices */}
                        <Snackbar
                            open={showOfflineNotice}
                            autoHideDuration={null}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                        >
                            <Alert
                                severity="warning"
                                onClose={() => setShowOfflineNotice(false)}
                            >
                                {t('You are offline. Some features may be limited.')}
                            </Alert>
                        </Snackbar>

                        {/* Reconnection notice */}
                        <Snackbar
                            open={showReconnectedNotice}
                            autoHideDuration={6000}
                            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                            onClose={() => setShowReconnectedNotice(false)}
                        >
                            <Alert severity="success">
                                {t('You are back online. Syncing data...')}
                            </Alert>
                        </Snackbar>

                        {/* Debug network indicator for healthcare workers */}
                        {isDebugEnabled && (
                            <div className="debug-network-indicator" style={{
                                position: 'fixed',
                                bottom: '10px',
                                right: '10px',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                background: networkStatus.online ? '#4caf50' : '#f44336',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                zIndex: 9999,
                            }}>
                                {networkStatus.online ? t('status.online') : t('status.offline')}
                                {networkStatus.online && (
                                    <Alert severity="success">
                                        {t('network.onlineReconnected')}
                                    </Alert>
                                )}
                                {networkStatus.effectiveType && (
                                    <span style={{ marginLeft: '8px', fontSize: '10px' }}>
                                        ({networkStatus.effectiveType})
                                    </span>
                                )}
                            </div>
                        )}
                    </AuthWrapper>
                </NetworkMonitor>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;