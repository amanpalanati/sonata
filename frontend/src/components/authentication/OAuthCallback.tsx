import React, { useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { accountType } = useParams<{ accountType?: string }>();
  const location = useLocation();
  const hasRun = useRef(false);
  const { login } = useAuth();

  useEffect(() => {
    // Prevent double execution
    if (hasRun.current) {
      return;
    }
    hasRun.current = true;

    const handleOAuthCallback = async () => {
      try {
        // Check if we're actually in an OAuth callback scenario
        // Look for OAuth parameters in URL hash or query params
        const hash = window.location.hash;
        const search = window.location.search;
        const hasOAuthParams =
          hash.includes("access_token") ||
          search.includes("code") ||
          search.includes("access_token");

        if (!hasOAuthParams) {
          // No OAuth parameters, this might be a stale redirect
          throw new Error("No OAuth callback parameters found");
        }

        // Get mode from URL search params
        const urlParams = new URLSearchParams(search);
        const mode = urlParams.get("mode") as "login" | "signup" | null;

        // Get the session from Supabase
        const { data: authData, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        // Use the session from the OAuth callback
        const session = authData.session;
        if (!session) {
          throw new Error("No session found from OAuth callback");
        }

        // Determine account type - either from URL params or from state
        let finalAccountType = accountType;

        // If no account type in URL, check if it was passed in state
        if (!finalAccountType) {
          const state = location.state as {
            accountType?: string;
            returnTo?: string;
          } | null;
          finalAccountType = state?.accountType;
        }

        // For existing users, we don't need account type from URL since backend can find it
        // Only validate account type if it's provided
        if (finalAccountType) {
          const validAccountTypes = ["student", "teacher", "parent"];
          if (!validAccountTypes.includes(finalAccountType.toLowerCase())) {
            throw new Error("Invalid account type");
          }
        }

        // Sync with Flask backend
        const response = await fetch("/api/oauth-callback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            access_token: session.access_token,
            user_id: session.user.id,
            mode: mode, // Pass the mode to backend
            user_metadata: {
              ...session.user.user_metadata,
              // Only include account_type if we have it from URL (new users)
              ...(finalAccountType && {
                account_type: finalAccountType.toLowerCase(),
              }),
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Special handling for incomplete account during login
          if (data.incomplete_account && mode === "login") {
            // Delete the incomplete user from Supabase and redirect to signup
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {}

            // Redirect to signup with specific message
            navigate("/signup", {
              replace: true,
              state: {
                oauthError:
                  "Account found but setup incomplete. Please complete your signup.",
              },
            });
            return;
          }

          throw new Error(data.error || "Failed to sync session");
        }

        // Success - update auth context with user data
        if (data.user) {
          login(data.user);
        }

        // Redirect to dashboard
        navigate("/dashboard", { replace: true });
      } catch (error) {
        // Determine where to redirect based on account type or default to login
        const errorMessage =
          error instanceof Error ? error.message : "Authentication failed";

        if (accountType) {
          // Redirect back to signup form with error
          navigate(`/signup/${accountType}`, {
            replace: true,
            state: { oauthError: errorMessage },
          });
        } else {
          // Redirect to login with error
          navigate("/login", {
            replace: true,
            state: { oauthError: errorMessage },
          });
        }
      }
    };

    handleOAuthCallback();
  }, [navigate, accountType, location.state]);

  // Show minimal loading state while processing
  return <></>;
};

export default OAuthCallback;
