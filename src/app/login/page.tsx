import { AuthPage } from "@components/auth";
import { medplumAuthService } from "@providers/auth-provider/medplumAuth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

// Define metadata for the login page
// export const metadata: Metadata = {
//   title: "Login | Gandall Healthcare Platform",
//   description: "Log in to access the Gandall Healthcare Platform",
// };

/**
 * Login page component that handles authentication flow
 * Redirects authenticated users to dashboard
 */
export default async function Login() {
  const data = await getData();

  // If user is already authenticated, redirect to dashboard or specified redirect path
  if (data.authenticated) {
    redirect(data?.redirectTo || "/dashboard");
  }

  return <AuthPage type="login" />;
}

/**
 * Server-side function to check authentication status
 * This avoids unnecessary login page rendering for authenticated users
 */
async function getData() {
  try {
    const { authenticated, redirectTo, error } = await medplumAuthService.check();

    return {
      authenticated,
      redirectTo: redirectTo || "/dashboard",
      error,
    };
  } catch (error) {
    console.error("Error checking authentication:", error);

    // Return unauthenticated state if there's an error
    return {
      authenticated: false,
      redirectTo: "/dashboard",
      error: error instanceof Error ? error : new Error("Authentication check failed"),
    };
  }
}
