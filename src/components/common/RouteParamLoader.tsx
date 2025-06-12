/**
 * RouteParamLoader.tsx - Route parameter validation component
 */
import React from 'react';
import { Box, CircularProgress, Alert, Button, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { ParamValidationResult } from '../../hooks/useValidatedParams';

interface RouteParamLoaderProps {
  paramResult: ParamValidationResult;
  resourceName: string;
  listPageUrl: string;
  children: React.ReactNode;
}

export const RouteParamLoader: React.FC<RouteParamLoaderProps> = ({
  paramResult,
  resourceName,
  listPageUrl,
  children,
}) => {
  const router = useRouter();

  if (paramResult.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!paramResult.isValid) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {paramResult.error || `${resourceName} not found`}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => router.push(listPageUrl)}
        >
          Back to {resourceName} List
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
};

export default RouteParamLoader;