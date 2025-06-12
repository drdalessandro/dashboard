"use client";

import { DevtoolsProvider } from "@providers/devtools";
import { Refine } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";
import {
  RefineSnackbarProvider,
  useNotificationProvider,
} from "@refinedev/mui";
import routerProvider from "@refinedev/nextjs-router";
import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ColorModeContextProvider } from "@contexts/color-mode";
// Auth provider
import { medplumAuthService } from "@providers/auth-provider/medplumAuth";

import medplumDataProvider from "@providers/data-provider/medplum";

// Import i18n configuration
import "../utils/i18n";
import { I18nextProvider } from "react-i18next";
import i18n from "../utils/i18n";

// Create a client with offline-first configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 1 hour
      cacheTime: 60 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Use stale data while revalidating
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Critical for login functionality
      retry: 2,
    },
  },
});

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export default function RootLayoutClient({ children }: RootLayoutClientProps) {
  // Set default mode for color theme
  const defaultMode = "light";

  return (
    <I18nextProvider i18n={i18n}>
      <Suspense>
        <QueryClientProvider client={queryClient}>
          <RefineKbarProvider>
            <ColorModeContextProvider defaultMode={defaultMode}>
              <RefineSnackbarProvider>
                <DevtoolsProvider>
                  <Refine
                    dataProvider={medplumDataProvider()}
                    notificationProvider={useNotificationProvider}
                    routerProvider={routerProvider}
                    authProvider={medplumAuthService}
                    options={{
                      syncWithLocation: true,
                      warnWhenUnsavedChanges: true,
                      mutationMode: "optimistic",
                      reactQuery: {
                        clientConfig: queryClient,
                      },
                    }}
                  >
                    {children}
                  </Refine>
                </DevtoolsProvider>
              </RefineSnackbarProvider>
            </ColorModeContextProvider>
          </RefineKbarProvider>
        </QueryClientProvider>
      </Suspense>
    </I18nextProvider>
  );
}
