// src/app/dashboard/DashboardClient.tsx
"use client"

import React from 'react';
import { Box, CircularProgress, Container, Typography } from "@mui/material";
import { Grid } from "@mui/material";
import { useRouter } from "next/navigation";
import { medplumAuthService } from "../../providers/auth-provider/medplumAuth";

// Metadata
import { metadata } from './metadata';

// New UI Components
import DashboardLayout from '@features/dashboard/components/ui/DashboardLayout';
import SummaryCards from '@features/dashboard/components/ui/SummaryCards';
import PatientVisitChart from '@features/dashboard/components/ui/PatientVisitChart';
import PatientDataTable from '@features/dashboard/components/ui/PatientDataTable';
import ClaimsCard from '@features/dashboard/components/ui/ClaimsCard';

// Dummy data
import {
  patientVisitData,
  patientsData,
  summaryData
} from '@features/dashboard/components/ui/utils/dummyData';

export default function DashboardClient() {
  const router = useRouter();

  // State for user profile
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [isOffline, setIsOffline] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<string | null>(null);
  const [pendingSyncItems, setPendingSyncItems] = React.useState(0);

  // Fetch user profile using the existing getIdentity method
  React.useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoadingProfile(true);

        // Use the getIdentity method from medplumAuthService
        const profile = await medplumAuthService.getIdentity();
        console.log("Fetched profile from auth service:", profile);

        if (profile) {
          setUserProfile(profile);
        } else {
          console.warn("No profile returned from getIdentity");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        // Always end loading state - don't keep user waiting
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Online status effect
  React.useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    const getLastSyncTime = () => {
      const storedTime = localStorage.getItem("gandall.lastSyncTime");
      if (storedTime) {
        const date = new Date(parseInt(storedTime, 10));
        setLastSyncTime(date.toLocaleString());
      }
    };

    const getPendingSyncItems = () => {
      const pendingItems = localStorage.getItem("gandall.pendingSyncItems");
      setPendingSyncItems(pendingItems ? parseInt(pendingItems, 10) : 0);
    };

    updateOnlineStatus();
    getLastSyncTime();
    getPendingSyncItems();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Use a smaller loading indicator
  if (isLoadingProfile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" p={4}>
          <CircularProgress size={40} />
          <Typography mt={2}>Loading your profile...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <DashboardLayout userProfile={userProfile} isOffline={isOffline}>
      <Box sx={{ 
        flex: 1,
        // Style to ensure content fits without scrollbars
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* First row - Summary Cards and Claims Card */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Summary Cards - now takes 1/3 of the width */}
          <Grid item xs={12} md={4}>
            <SummaryCards data={summaryData} />
          </Grid>

          {/* Claims Card - now takes 2/3 of the width */}
          <Grid item xs={12} md={8}>
            <ClaimsCard data={summaryData.claims} />
          </Grid>
        </Grid>

        {/* Second row - Charts and Tables with reduced spacing */}
        <Grid container spacing={2}>
          {/* Patient Data Table */}
          <Grid item xs={12} lg={12}>
            <PatientDataTable data={patientsData} />
          </Grid>

          {/* Patient Visit Chart */}
          <Grid item xs={12} lg={12}>
            <PatientVisitChart data={patientVisitData} />
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}