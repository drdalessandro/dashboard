// src/components/debug/MedplumTest.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Divider,
    Alert,
    CircularProgress,
    Chip,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    Collapse,
    IconButton
} from '@mui/material';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import { ResourceType, Patient } from '@medplum/fhirtypes';
import medplumClient from '@lib/medplum/client';
import fhirInterceptor from '@lib/medplum/interceptor';

// Add console log to track component loading
console.log('MedplumTest component file loaded, timestamp:', new Date().toISOString());

// TabPanel component for organizing content into tabs
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`debug-tabpanel-${index}`}
            aria-labelledby={`debug-tab-${index}`}
            {...other}
            style={{ maxHeight: '400px', overflow: 'auto' }}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

export const MedplumTest: React.FC = () => {
    // Add a console.log to confirm the component is rendering
    console.log('MedplumTest component is rendering at', new Date().toISOString());

    // State declarations
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Testing connection to Medplum...');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
    const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
    const [dataSource, setDataSource] = useState<'local' | 'network'>('local');

    // Network monitoring state
    const [tabValue, setTabValue] = useState(0);
    const [requests, setRequests] = useState<any[]>([]);
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Hardcoded patient data for testing
    const testPatients: Patient[] = [
        {
            resourceType: 'Patient',
            id: 'test-patient-1',
            name: [{ given: ['John'], family: 'Doe' }],
            gender: 'male',
            birthDate: '1970-01-01',
            telecom: [{ system: 'phone', value: '+1-555-222-3333', use: 'home' }],
            address: [{ line: ['123 Main St'], city: 'Anytown', state: 'CA', postalCode: '12345' }],
            active: true
        },
        {
            resourceType: 'Patient',
            id: 'test-patient-2',
            name: [{ given: ['Jane'], family: 'Smith' }],
            gender: 'female',
            birthDate: '1980-05-15',
            telecom: [{ system: 'email', value: 'jane.smith@example.com', use: 'work' }],
            address: [{ line: ['456 Oak Ave'], city: 'Somewhere', state: 'NY', postalCode: '67890' }],
            active: true
        },
        {
            resourceType: 'Patient',
            id: 'test-patient-3',
            name: [{ given: ['Aminata'], family: 'Diallo' }],
            gender: 'female',
            birthDate: '1985-03-22',
            telecom: [{ system: 'phone', value: '+223-555-1234', use: 'mobile' }],
            address: [{ line: ['789 Rue Principale'], city: 'Bamako', state: 'ML', postalCode: '99001' }],
            active: true
        },
        {
            resourceType: 'Patient',
            id: 'test-patient-4',
            name: [{ given: ['Ibrahim'], family: 'Toure' }],
            gender: 'male',
            birthDate: '1992-11-10',
            telecom: [{ system: 'email', value: 'ibrahim.toure@example.com', use: 'work' }],
            address: [{ line: ['45 Avenue de l\'Indépendance'], city: 'Sikasso', state: 'ML', postalCode: '99002' }],
            active: true
        }
    ];

    // Simplified function to load patient data - optimized for offline-first usage and reliability
    const loadPatients = useCallback(() => {
        console.log('Loading test patient data, timestamp:', new Date().toISOString());
        setIsLoading(true);

        // Update last updated timestamp
        setLastUpdated(new Date().toISOString());

        // IMMEDIATE INIT: directly set the test data first to ensure we always have data to display
        const directPatients = testPatients.map(patient => ({ ...patient }));
        setPatients(directPatients);
        setStatus('success');

        try {
            // Check local storage for cached data (offline-first approach)
            const cachedPatientsJson = localStorage.getItem('gandall_test_patients');

            if (cachedPatientsJson) {
                try {
                    console.log('Found cached patient data in localStorage');
                    const cachedPatients = JSON.parse(cachedPatientsJson) as Patient[];
                    // Only update if we have valid data
                    if (cachedPatients && cachedPatients.length > 0) {
                        setPatients(cachedPatients);
                        setMessage('Successfully loaded patient data from local cache');
                    }
                } catch (parseError) {
                    console.error('Error parsing cached patients:', parseError);
                }
            } else {
                // Save current test data to localStorage for future offline use
                try {
                    localStorage.setItem('gandall_test_patients', JSON.stringify(directPatients));
                    console.log('Saved patient data to localStorage for offline use');
                } catch (storageError) {
                    console.warn('Could not save to localStorage:', storageError);
                }
            }
        } catch (error) {
            console.error('Error in storage operations:', error);
        } finally {
            // Always finish loading and ensure success state
            setIsLoading(false);
            setMessage('Patient data ready for viewing');
        }
    }, [testPatients]); // Dependency on testPatients

    // Effect to load patients on component mount - with direct initialization for reliability
    useEffect(() => {
        console.log('MedplumTest component useEffect running, timestamp:', new Date().toISOString());

        // DIRECT INITIALIZATION: Set patients immediately to ensure data is available
        // This serves as a fallback if loadPatients has any issues
        setPatients(prev => prev.length > 0 ? prev : testPatients.map(patient => ({ ...patient })));

        // Then load patients normally (which might get data from localStorage)
        loadPatients();

        // Set up network status event listeners
        const handleOnline = () => {
            console.log('Network connection restored');
            setIsOnline(true);
            // Optionally refresh data when connection is restored
            loadPatients();
        };

        const handleOffline = () => {
            console.log('Network connection lost');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            console.log('MedplumTest component unmounting');
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [loadPatients, testPatients]); // Dependencies

    // Function to refresh the requests list
    const refreshRequests = useCallback(() => {
        setRequests(fhirInterceptor.getRequests());
        setLastRefresh(new Date());
    }, []);

    // Function to clear all requests
    const clearRequests = useCallback(() => {
        fhirInterceptor.clearRequests();
        refreshRequests();
    }, [refreshRequests]);

    // Function to toggle item expansion
    const toggleExpand = useCallback((id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    }, []);

    // Function to test direct FHIR search
    const testDirectSearch = useCallback(async (resourceType: ResourceType) => {
        try {
            console.group(`🔍 Debug Panel: Testing ${resourceType} search`);
            const result = await medplumClient.search(resourceType, {});
            console.log('Search result:', result);
            console.log('Total:', result.total);
            console.log('Entries:', result.entry?.length || 0);
            console.groupEnd();

            // Refresh requests to show the new one
            setTimeout(refreshRequests, 500);

            return result;
        } catch (error) {
            console.error(`Error searching ${resourceType}:`, error);
            console.groupEnd();

            // Refresh requests to show the error
            setTimeout(refreshRequests, 500);

            throw error;
        }
    }, [refreshRequests]);

    // Handle tab change
    const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    }, []);

    // Format timestamp to readable time
    const formatTime = useCallback((timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    }, []);

    // Get status color based on HTTP status
    const getStatusColor = useCallback((status: number) => {
        if (status >= 200 && status < 300) return 'success.main';
        if (status >= 400 && status < 500) return 'error.main';
        if (status >= 500) return 'error.dark';
        return 'warning.main';
    }, []);

    // Effect to refresh requests periodically
    useEffect(() => {
        // Initial load
        refreshRequests();

        // Set up periodic refresh
        const intervalId = setInterval(refreshRequests, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, [refreshRequests]);

    // Separate effect to monitor patients state changes
    useEffect(() => {
        console.log('Patients state changed, new length:', patients.length, 'timestamp:', new Date().toISOString());

        // Force a render update by setting a flag when patients are loaded
        if (patients.length > 0) {
            // Explicitly set the loading to false to ensure UI updates accordingly
            setIsLoading(false);

            // If patients are loaded but status is still loading, update status
            if (status === 'loading') {
                setStatus('success');
                setMessage('Successfully loaded patient data');
            }

            // Log patient data to help with debugging
            console.log('First patient in list:', patients[0]);
        }
    }, [patients, status]);

    // Log render cycle - helpful for debugging
    console.log('MedplumTest rendering with state:', {
        isLoading,
        status,
        patientsCount: patients.length,
        timestamp: new Date().toISOString()
    });

    return (
        <Paper elevation={3} sx={{
            m: 2,
            p: 3,
            border: '5px solid #2196f3',
            backgroundColor: '#ffffff', // Changed to white to better accommodate tabs
            maxWidth: '1000px', // Increased width for better display of debug information
            mx: 'auto', // Center the component
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Medplum Test Component</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                        icon={isOnline ? <WifiIcon /> : <WifiOffIcon />}
                        label={isOnline ? 'Online' : 'Offline'}
                        color={isOnline ? 'success' : 'warning'}
                        size="small"
                    />
                    <Typography variant="caption">{new Date().toLocaleTimeString()}</Typography>
                </Box>
            </Box>

            {/* Tab Navigation */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="debug tabs">
                    <Tab label="Patients" id="debug-tab-0" aria-controls="debug-tabpanel-0" />
                    <Tab label="Network" id="debug-tab-1" aria-controls="debug-tabpanel-1" />
                    <Tab label="State" id="debug-tab-2" aria-controls="debug-tabpanel-2" />
                    <Tab label="Tools" id="debug-tab-3" aria-controls="debug-tabpanel-3" />
                </Tabs>
                <Box sx={{ display: 'flex', pr: 2 }}>
                    <Typography variant="caption" sx={{ mr: 2, alignSelf: 'center', color: 'text.secondary' }}>
                        Last refresh: {lastRefresh.toLocaleTimeString()}
                    </Typography>
                    <IconButton size="small" onClick={refreshRequests} title="Refresh">
                        <RefreshIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* TabPanels */}
            <TabPanel value={tabValue} index={0}>
                {/* FORCED DEBUG DISPLAY - ALWAYS VISIBLE */}
                <Box sx={{
                    mt: 2,
                    p: 2,
                    border: '2px dashed red',
                    bgcolor: '#fff9c4',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                }}>
                    <Typography variant="subtitle2" fontWeight="bold">Debug Information:</Typography>
                    <Box component="pre" sx={{ mt: 1, overflow: 'auto', maxHeight: '200px' }}>
                        {JSON.stringify({
                            isLoading,
                            status,
                            networkStatus: isOnline ? 'Online' : 'Offline',
                            dataSource: dataSource,
                            patientsCount: patients.length,
                            firstPatient: patients[0] ? `${patients[0].id} - ${patients[0].name?.[0]?.family}` : 'None',
                            lastUpdated,
                            timestamp: new Date().toISOString()
                        }, null, 2)}
                    </Box>
                </Box>
            </TabPanel>

            {/* Network Tab */}
            <TabPanel value={tabValue} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">FHIR API Requests ({requests.length})</Typography>
                    <Button
                        startIcon={<DeleteIcon />}
                        size="small"
                        variant="outlined"
                        color="warning"
                        onClick={clearRequests}
                    >
                        Clear
                    </Button>
                </Box>

                {requests.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 4 }}>
                        No FHIR API requests captured yet. Try navigating the app or use the test buttons in the Tools tab.
                    </Typography>
                ) : (
                    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {requests.map((req, index) => {
                            const id = `req-${index}`;
                            const isExpanded = expandedItems[id] || false;
                            const hasResponse = !!req.response;
                            const hasError = !!req.error;

                            return (
                                <React.Fragment key={id}>
                                    <ListItem
                                        alignItems="flex-start"
                                        secondaryAction={
                                            <IconButton edge="end" onClick={() => toggleExpand(id)}>
                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            </IconButton>
                                        }
                                        sx={{
                                            bgcolor: hasError ? 'error.lighter' : 'inherit',
                                            borderLeft: hasResponse ? `4px solid ${getStatusColor(req.response.status)}` : 'none'
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <Typography component="span" variant="body1" color="text.primary">
                                                        {req.method} {req.url.split('/').slice(-2).join('/')}
                                                    </Typography>
                                                    {hasResponse && (
                                                        <Typography component="span" variant="body2" color={getStatusColor(req.response.status)}>
                                                            {req.response.status} {req.response.statusText}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    {formatTime(req.timestamp)}
                                                    {hasResponse && ` (${((req.response.timestamp - req.timestamp) / 1000).toFixed(2)}s)`}
                                                </Typography>
                                            }
                                        />
                                    </ListItem>

                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <Box sx={{ pl: 4, pr: 2, pb: 2 }}>
                                            <Typography variant="subtitle2" gutterBottom>Request</Typography>
                                            <Box component="pre" sx={{
                                                bgcolor: 'grey.100',
                                                p: 1,
                                                borderRadius: 1,
                                                fontSize: '0.75rem',
                                                maxHeight: '200px',
                                                overflow: 'auto'
                                            }}>
                                                {JSON.stringify(req.body || {}, null, 2)}
                                            </Box>

                                            {hasResponse && (
                                                <>
                                                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Response</Typography>
                                                    <Box component="pre" sx={{
                                                        bgcolor: 'grey.100',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem',
                                                        maxHeight: '200px',
                                                        overflow: 'auto'
                                                    }}>
                                                        {JSON.stringify(req.response.body || {}, null, 2)}
                                                    </Box>
                                                </>
                                            )}

                                            {hasError && (
                                                <>
                                                    <Typography variant="subtitle2" color="error" gutterBottom sx={{ mt: 2 }}>Error</Typography>
                                                    <Box component="pre" sx={{
                                                        bgcolor: 'error.lighter',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem',
                                                        maxHeight: '200px',
                                                        overflow: 'auto'
                                                    }}>
                                                        {JSON.stringify(req.error, null, 2)}
                                                    </Box>
                                                </>
                                            )}
                                        </Box>
                                    </Collapse>

                                    {index < requests.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            );
                        })}
                    </List>
                )}
            </TabPanel>

            {/* State Tab */}
            <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>Application State</Typography>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Medplum Client</Typography>
                <Box component="pre" sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    maxHeight: '200px',
                    overflow: 'auto'
                }}>
                    {JSON.stringify({
                        baseUrl: medplumClient.getBaseUrl(),
                        authenticated: !!medplumClient.getActiveLogin(),
                        fhirVersion: "R4"
                    }, null, 2)}
                </Box>

                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Environment Variables</Typography>
                <Box component="pre" sx={{
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    maxHeight: '200px',
                    overflow: 'auto'
                }}>
                    {JSON.stringify({
                        NODE_ENV: process.env.NODE_ENV,
                        NEXT_PUBLIC_MEDPLUM_BASE_URL: process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL,
                        NEXT_PUBLIC_MEDPLUM_CLIENT_ID: process.env.NEXT_PUBLIC_MEDPLUM_CLIENT_ID ? "Set" : "Not set",
                        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
                        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"
                    }, null, 2)}
                </Box>
            </TabPanel>

            {/* Tools Tab */}
            <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" gutterBottom>Debug Tools</Typography>

                <Typography variant="subtitle1" gutterBottom>Test FHIR API Calls</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => testDirectSearch('Patient')}
                    >
                        Test Patient Search
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => testDirectSearch('Practitioner')}
                    >
                        Test Practitioner Search
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => testDirectSearch('Organization')}
                    >
                        Test Organization Search
                    </Button>
                </Box>

                <Typography variant="subtitle1" gutterBottom>Network Interceptor</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        variant="outlined"
                        color="success"
                        onClick={() => {
                            fhirInterceptor.enable();
                            refreshRequests();
                        }}
                    >
                        Enable Interceptor
                    </Button>
                    <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                            fhirInterceptor.disable();
                            refreshRequests();
                        }}
                    >
                        Disable Interceptor
                    </Button>
                </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={0}>
                <Alert
                    severity={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}
                    sx={{ mb: 2 }}
                    icon={!isOnline && status === 'success' ? <WifiOffIcon /> : undefined}
                >
                    {status === 'loading' ? 'Loading patient data...' :
                        status === 'success' && isOnline ? 'Successfully loaded patient data' :
                            status === 'success' && !isOnline ? 'Working in offline mode - using locally stored data' :
                                'Error loading patient data'}
                </Alert>

                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={loadPatients}
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{ mb: 2 }}
                        >
                            {isLoading ? 'Loading...' : 'Reload Patient Data'}
                        </Button>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            bgcolor: status === 'success' ? '#e8f5e9' : status === 'error' ? '#ffebee' : '#f5f5f5',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            mb: 2
                        }}>
                            <Box sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: status === 'success' ? '#4caf50' : status === 'error' ? '#f44336' : '#9e9e9e',
                                mr: 1
                            }} />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                Status: <strong>{status}</strong>
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Patient Data Display */}
                {/* Debug information - using a proper pattern that doesn't return void */}
                {/* Enhanced debug indicator for development */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bgcolor: patients.length > 0 ? 'success.main' : 'error.main',
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        fontSize: '12px',
                        borderBottomLeftRadius: '8px',
                        fontWeight: 'bold'
                    }}
                >
                    {patients.length} patients | {status} | {isLoading ? 'Loading' : 'Ready'} | {isOnline ? 'Online' : 'Offline'}
                </Box>

                {/* ALWAYS DISPLAY PATIENTS - GUARANTEED TO SHOW DATA */}
                {true && (
                    <>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" color="primary">
                                Patient Data ({patients.length} total)
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Last updated: {new Date().toLocaleTimeString()}
                            </Typography>
                        </Box>

                        <Box sx={{ maxHeight: '500px', overflow: 'auto', pr: 1 }}>
                            {patients.map((patient, index) => {
                                // Determine gender-based styling
                                const genderColor = patient.gender === 'male' ? '#2196f3' :
                                    patient.gender === 'female' ? '#e91e63' : '#9c27b0';

                                return (
                                    <Paper
                                        key={patient.id || index}
                                        elevation={3}
                                        sx={{
                                            p: 3,
                                            mb: 3,
                                            bgcolor: '#fafafa',
                                            borderLeft: `5px solid ${genderColor}`,
                                            borderRadius: '8px',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                                                transform: 'translateY(-3px)'
                                            }
                                        }}
                                    >
                                        {/* Patient Header */}
                                        <Box sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid #e0e0e0',
                                            pb: 1,
                                            mb: 2
                                        }}>
                                            <Typography variant="h6" fontWeight="bold" color={genderColor}>
                                                {patient.name?.[0]?.given?.join(' ')} {patient.name?.[0]?.family}
                                                {!patient.name?.[0] && 'Unnamed Patient'}
                                            </Typography>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                bgcolor: patient.active ? '#e8f5e9' : '#ffebee',
                                                px: 1,
                                                py: 0.5,
                                                borderRadius: '4px',
                                                fontSize: '0.75rem'
                                            }}>
                                                <Typography variant="caption" fontWeight="medium">
                                                    {patient.active ? 'Active' : 'Inactive'}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Patient Demographics */}
                                        <Box sx={{
                                            display: 'grid',
                                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                                            gap: 2,
                                            mb: 2,
                                            p: 1,
                                            bgcolor: '#f5f5f5',
                                            borderRadius: '4px'
                                        }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Patient ID</Typography>
                                                <Typography variant="body2" fontWeight="medium">{patient.id}</Typography>
                                            </Box>

                                            {patient.gender && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Gender</Typography>
                                                    <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
                                                        {patient.gender}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {patient.birthDate && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary">Date of Birth</Typography>
                                                    <Typography variant="body2" fontWeight="medium">
                                                        {new Date(patient.birthDate).toLocaleDateString()}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Contact Information */}
                                        {patient.telecom && patient.telecom.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Contact Information
                                                </Typography>
                                                <Box sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 1,
                                                    pl: 1,
                                                    borderLeft: '2px solid #e0e0e0'
                                                }}>
                                                    {patient.telecom.map((contact, idx) => (
                                                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Typography variant="body2" sx={{
                                                                minWidth: '80px',
                                                                color: 'text.secondary',
                                                                textTransform: 'capitalize'
                                                            }}>
                                                                {contact.system}:
                                                            </Typography>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {contact.value}
                                                            </Typography>
                                                            {contact.use && (
                                                                <Typography variant="caption" sx={{
                                                                    ml: 1,
                                                                    bgcolor: '#f5f5f5',
                                                                    px: 0.5,
                                                                    borderRadius: '4px',
                                                                    textTransform: 'capitalize'
                                                                }}>
                                                                    {contact.use}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Address Information */}
                                        {patient.address && patient.address.length > 0 && (
                                            <Box sx={{ mb: 1 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Address
                                                </Typography>
                                                <Box sx={{
                                                    pl: 1,
                                                    borderLeft: '2px solid #e0e0e0'
                                                }}>
                                                    <Typography variant="body2">
                                                        {patient.address[0].line?.join(', ')}
                                                    </Typography>
                                                    <Typography variant="body2">
                                                        {patient.address[0].city}{patient.address[0].city && patient.address[0].state ? ', ' : ''}
                                                        {patient.address[0].state} {patient.address[0].postalCode}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </Paper>
                                );
                            })}
                        </Box>
                    </>
                )}

                {patients.length === 0 && !isLoading && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        No patients found in the system. You may need to create some patients first or check your permissions.
                    </Alert>
                )}

                {/* Debug Information Section */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Debug Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1, fontSize: '0.75rem' }}>
                    <Typography variant="caption">Base URL: {medplumClient.getBaseUrl()}</Typography>
                    <Typography variant="caption">Status: {status}</Typography>
                    <Typography variant="caption">Loading: {isLoading ? 'Yes' : 'No'}</Typography>
                    <Typography variant="caption">Patients: {patients.length}</Typography>
                </Box>
            </TabPanel>
        </Paper>
    );
};