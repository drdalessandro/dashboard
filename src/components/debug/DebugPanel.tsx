// src/components/debug/DebugPanel.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import fhirInterceptor from '@lib/medplum/interceptor';
import medplumClient from '@lib/medplum/client';
import { ResourceType } from '@medplum/fhirtypes';

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

export const DebugPanel: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [requests, setRequests] = useState<any[]>([]);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Function to refresh the requests list
  const refreshRequests = () => {
    setRequests(fhirInterceptor.getRequests());
    setLastRefresh(new Date());
  };

  // Function to clear all requests
  const clearRequests = () => {
    fhirInterceptor.clearRequests();
    refreshRequests();
  };

  // Function to toggle item expansion
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Function to test direct FHIR search
  const testDirectSearch = async (resourceType: ResourceType) => {
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
  };

  // Initial load and periodic refresh
  useEffect(() => {
    refreshRequests();
    
    // Set up periodic refresh
    const intervalId = setInterval(refreshRequests, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Get status color based on HTTP status
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'success.main';
    if (status >= 400 && status < 500) return 'error.main';
    if (status >= 500) return 'error.dark';
    return 'warning.main';
  };

  return (
    <Paper elevation={3} sx={{ mt: 3, mb: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="debug tabs">
          <Tab label="Network" id="debug-tab-0" aria-controls="debug-tabpanel-0" />
          <Tab label="State" id="debug-tab-1" aria-controls="debug-tabpanel-1" />
          <Tab label="Tools" id="debug-tab-2" aria-controls="debug-tabpanel-2" />
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

      {/* Network Tab */}
      <TabPanel value={tabValue} index={0}>
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
      <TabPanel value={tabValue} index={1}>
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
      <TabPanel value={tabValue} index={2}>
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
    </Paper>
  );
};
