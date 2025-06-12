"use client";
import { useState, useEffect } from "react";
import type { AuthPageProps } from "@refinedev/core";
import { useTranslate } from "@refinedev/core";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  TextField,
  Typography,
  useTheme,
  Alert,
  Snackbar,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { Visibility, VisibilityOff, WifiOff, Login as LoginIcon, SyncProblem } from "@mui/icons-material";
import { medplumClient, isServerConnected, checkServerConnection } from "../../lib/medplum/client";
import { medplumAuthService } from "../../providers/auth-provider/medplumAuth";

/**
 * Custom Auth Page component for Gandall Healthcare Platform
 * Provides login functionality with offline-first capabilities
 * Integrated with Medplum FHIR authentication provider
 */
export const AuthPage = (props: AuthPageProps) => {
  const { type } = props;
  const theme = useTheme();
  const translate = useTranslate();
  const router = useRouter();

  // State for form fields and validation
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);
  const [serverAvailable, setServerAvailable] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Utility function to extract error message
  const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }

    return "An unexpected authentication error occurred";
  };

  // Check network status, server availability, and stored credentials on mount
  useEffect(() => {
    // Check if we're offline
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOffline(!online);

      // If we just came back online, check server availability
      if (online && !serverAvailable) {
        checkServerStatus();
      }
    };

    // Check server availability
    const checkServerStatus = async () => {
      try {
        const available = await checkServerConnection();
        setServerAvailable(available);

        if (!available && !isOffline) {
          setNotificationMessage("Server is currently unavailable. Some features may be limited.");
          setShowNotification(true);

          // Check for stored credentials when server is unavailable
          checkStoredCredentials();
        }
      } catch (error) {
        console.error("Error checking server status:", error);
        setServerAvailable(false);
        setNotificationMessage("Unable to connect to authentication server. Operating in offline mode.");
        setShowNotification(true);

        // Check for stored credentials when server check fails
        checkStoredCredentials();
      }
    };

    // Check if we have stored credentials
    const checkStoredCredentials = () => {
      const hasToken = localStorage.getItem("medplum.access_token") !== null;
      setHasStoredCredentials(hasToken);

      // If we have credentials but are offline, show notification
      if (hasToken && (!navigator.onLine || !isServerConnected())) {
        setNotificationMessage("Operating in offline mode with stored credentials.");
        setShowNotification(true);
      }
    };

    // Initial checks
    updateOnlineStatus();
    checkServerStatus();
    checkStoredCredentials();

    // Set up event listeners for online/offline status
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Periodic server check when online
    const serverCheckInterval = setInterval(() => {
      if (navigator.onLine) {
        checkServerStatus();
      }
    }, 60000); // Check every minute when online

    // Clean up event listeners and intervals
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      clearInterval(serverCheckInterval);
    };
  }, [isOffline, serverAvailable]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use the authenticate method from medplumAuthService
      const result = await medplumAuthService.login({
        email,
        password,
        providerName: "emailPassword"
      });

      // Success handling
      console.log("Login successful:", result);
      setNotificationMessage("Login successful!");
      setIsLoading(false);

      // Redirect or update app state based on authentication result
      if (result) {
        router.push("/dashboard");
      }
    } catch (error) {
      setIsLoading(false);

      // Extract error message with type-safe approach
      const errorMessage = extractErrorMessage(error);
      setError(errorMessage);

      // Check if this is a server connectivity issue
      checkServerConnection().then(available => {
        console.log("Server connectivity check after error:", { available });
      });
    }
  };

  // Handle password visibility toggle
  const handleClickShowPassword = () => setShowPassword((show: boolean) => !show);

  // Handle offline login with stored credentials
  const handleOfflineLogin = async () => {
    if (hasStoredCredentials) {
      try {
        // For offline login, we need to provide dummy values for email and password
        // The auth provider will ignore these and use the stored tokens instead
        await medplumAuthService.login({
          email: "offline@user.com", // Dummy email - auth provider will use stored credentials
          password: "offline-mode",  // Dummy password - auth provider will use stored credentials
          providerName: "emailPassword"
        });
        setNotificationMessage("Logged in successfully with stored credentials");
        setShowNotification(true);
      } catch (error: any) {
        console.error("Offline login error:", error);
        setError("Failed to login with stored credentials: " + (error?.message || "Unknown error"));
      }
    } else {
      setError("No stored credentials found for offline login");
    }
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setShowNotification(false);
  };

  // Handle server status check
  const handleCheckServerStatus = async () => {
    setNotificationMessage("Checking server status...");
    setShowNotification(true);

    try {
      const available = await checkServerConnection();
      setServerAvailable(available);

      setNotificationMessage(available
        ? "Server is available. You can log in normally."
        : "Server is currently unavailable. Offline mode activated.");

      // If server is available, check if we need to refresh stored credentials
      if (available && hasStoredCredentials) {
        try {
          // Try to silently verify the token by getting the profile
          const profile = await medplumClient.getProfileAsync();
          if (profile) {
            setNotificationMessage("Server is available and credentials are valid.");
          }
        } catch (refreshError) {
          console.error("Error verifying credentials:", refreshError);
          setNotificationMessage("Server is available but you may need to login again.");
          // Continue with normal flow even if verification fails
        }
      }
    } catch (error) {
      console.error("Error checking server status:", error);
      setServerAvailable(false);
      setNotificationMessage("Unable to connect to authentication server. Operating in offline mode.");
    }
  };

  if (type !== "login") {
    return (
      <Container maxWidth="xs" sx={{ mt: 8 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" align="center" gutterBottom>
              Feature not available
            </Typography>
            <Typography variant="body1" align="center">
              Only login is supported in this version.
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Box
      component="div"
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="xs">
        <Card
          sx={{
            boxShadow: (isOffline || !serverAvailable)
              ? "0 0 10px rgba(255, 0, 0, 0.2)"
              : "0 8px 16px rgba(0, 0, 0, 0.1)",
            border: (isOffline || !serverAvailable)
              ? `1px solid ${isOffline ? theme.palette.warning.main : theme.palette.error.light}`
              : "none",
          }}
        >
          <CardContent>
            <Box
              component="div"
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 2,
              }}
            >
              {/* Logo */}
              <Box
                component="img"
                src="/assets/brand/gandall-logo.png"
                alt="Gandall Group"
                sx={{
                  width: 200,
                  height: 'auto',
                  mb: 2
                }}
              />

              {/* Offline/Server status indicator */}
              {(isOffline || !serverAvailable) && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    bgcolor: isOffline ? theme.palette.warning.light : theme.palette.error.light,
                    color: isOffline ? theme.palette.warning.contrastText : theme.palette.error.contrastText,
                    p: 1,
                    borderRadius: 1,
                    mb: 2,
                    width: "100%",
                  }}
                >
                  {isOffline ? <WifiOff sx={{ mr: 1 }} /> : <SyncProblem sx={{ mr: 1 }} />}
                  <Typography variant="body2">
                    {isOffline
                      ? `You are currently offline. ${hasStoredCredentials ? "You can still log in with stored credentials." : "Login requires internet connection."}`
                      : `Server connection unavailable. ${hasStoredCredentials ? "You can still log in with stored credentials." : "Login requires server connection."}`}
                  </Typography>
                </Box>
              )}

              <Typography variant="h5" sx={{ mb: 2 }}>
                Log in to your account
              </Typography>

              {/* Login form */}
              <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
                <Stack spacing={2}>
                  <TextField
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    disabled={isLoading || ((isOffline || !serverAvailable) && !hasStoredCredentials)}
                    required
                    error={!!error && (error.toLowerCase().includes("email") || !email)}
                  />

                  <FormControl variant="outlined" fullWidth error={!!error && (error.toLowerCase().includes("password") || !password)}>
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || ((isOffline || !serverAvailable) && !hasStoredCredentials)}
                      required
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                            disabled={isLoading || ((isOffline || !serverAvailable) && !hasStoredCredentials)}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                      label="Password"
                    />
                  </FormControl>

                  {error && <FormHelperText error sx={{ textAlign: "center" }}>{error}</FormHelperText>}

                  {/* Server status check button - only show when server is unavailable but we're online */}
                  {!isOffline && !serverAvailable && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCheckServerStatus}
                      sx={{ mt: 1 }}
                      fullWidth
                      startIcon={<SyncProblem />}
                      disabled={isLoading}
                    >
                      Check Server Status
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={isLoading || ((isOffline || !serverAvailable) && !hasStoredCredentials)}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                  >
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>

                  {(isOffline || !serverAvailable) && hasStoredCredentials && (
                    <>
                      <Divider sx={{ my: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          OR
                        </Typography>
                      </Divider>

                      <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        onClick={handleOfflineLogin}
                        disabled={isLoading}
                        color={isOffline ? "warning" : "error"}
                        startIcon={isOffline ? <WifiOff /> : <SyncProblem />}
                      >
                        {isOffline ? "Use offline credentials" : "Use stored credentials"}
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
          © {new Date().getFullYear()} Gandall Group - Healthcare Platform
        </Typography>
      </Container>
      {/* Status notification */}
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={isOffline || !serverAvailable ? "warning" : "info"}
          sx={{ width: "100%" }}
        >
          {notificationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};
