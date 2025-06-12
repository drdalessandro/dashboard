"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { medplumAuthService } from "../providers/auth-provider/medplumAuth"; // Update the path as needed

/**
 * Main entry point for the Gandall Healthcare Platform
 * Checks authentication status and redirects accordingly
 */
export default function IndexPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const checkAuthentication = async () => {
      try {
        setIsLoading(true);
        const { authenticated } = await medplumAuthService.check();

        if (authenticated) {
          // User is authenticated, redirect to dashboard
          console.log("User is authenticated, redirecting to dashboard");
          router.push("/dashboard");
        } else {
          // User is not authenticated, redirect to login
          console.log("User is not authenticated, redirecting to login");
          router.push("/login");
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        // On error, redirect to login
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, [router]);

  return (
    <Suspense>
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Gandall Healthcare Platform</h1>
          <p className="mb-2">
            {isLoading ? "Verifying your session..." : "Redirecting..."}
          </p>
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    </Suspense>
  );
}