from typing import Dict, Any, Optional
from .base_service import SupabaseService


class PasswordService(SupabaseService):
    """Service for handling password operations"""

    # Class variable to track used tokens (in production, use database/Redis)
    _used_tokens = set()

    def __init__(
        self, supabase_url: str, supabase_key: str, service_key: str, user_service
    ):
        """Initialize PasswordService with UserService dependency"""
        super().__init__(supabase_url, supabase_key, service_key)
        self.user_service = user_service

    @classmethod
    def cleanup_used_tokens(cls):
        """Clean up used tokens periodically (in production, implement with TTL)"""
        # In production, you'd implement this with database cleanup or Redis TTL
        # For now, just clear the set periodically
        if len(cls._used_tokens) > 1000:  # Arbitrary limit
            cls._used_tokens.clear()

    def initiate_password_reset(self, email: str) -> bool:
        """Send password reset email using Supabase Auth"""
        try:
            # Check if user exists first (but don't reveal this to the client)
            user_exists = self.user_service.get_user_by_email(email) is not None

            if user_exists:
                # For now, use Supabase's built-in email service
                # Later, replace this with generate_link + SMTP
                self.supabase.auth.reset_password_email(
                    email.lower(),
                    options={"redirect_to": "http://localhost:3000/reset-password"},
                )
                return True
            else:
                # Don't send email but return True to not reveal if user exists
                return True

        except Exception as e:
            # Don't reveal errors to prevent email enumeration
            return True

    def reset_password_with_token(
        self, access_token: str, new_password: str
    ) -> Dict[str, Any]:
        """Reset password using token from email link"""
        try:
            # Check if token has already been used
            if access_token in self._used_tokens:
                return {
                    "success": False,
                    "error": "This link has already been used. Please request a new password reset link.",
                    "error_type": "token_reused",
                }

            # Create a new supabase client instance for this session
            from supabase import create_client, Client

            temp_supabase: Client = create_client(
                self.supabase.supabase_url, self.supabase.supabase_key
            )

            # Set session with access token to verify the token and get user info
            response = temp_supabase.auth.set_session(access_token, "")

            if response and response.user:
                user_id = response.user.id

                # Use admin API to update the password directly
                if self.admin_supabase:
                    admin_response = self.admin_supabase.auth.admin.update_user_by_id(
                        user_id, {"password": new_password}
                    )

                    if admin_response and admin_response.user:
                        # Mark token as used to prevent reuse
                        self._used_tokens.add(access_token)

                        # Sign out from the temporary session to clean up
                        try:
                            temp_supabase.auth.sign_out()
                        except Exception:
                            pass  # Continue even if sign out fails

                        return {"success": True}
                    else:
                        return {
                            "success": False,
                            "error": "Failed to update password. Please try again.",
                            "error_type": "update_failed",
                        }
                else:
                    return {
                        "success": False,
                        "error": "Server configuration error. Please try again later.",
                        "error_type": "config_error",
                    }
            else:
                return {
                    "success": False,
                    "error": "Invalid or expired reset link. Please request a new password reset.",
                    "error_type": "invalid_token",
                }

        except Exception as e:
            return {
                "success": False,
                "error": "An error occurred while resetting your password. Please try again.",
                "error_type": "server_error",
            }

    def change_password(
        self, user_id: str, current_password: str, new_password: str
    ) -> Dict[str, Any]:
        """Change user password after verifying current password"""
        try:
            # First, get the user's email
            user_data = self.user_service.get_user(user_id)
            if not user_data or not user_data.get("email"):
                return {
                    "success": False,
                    "error": "User not found",
                    "error_type": "user_not_found",
                }

            # Verify current password by attempting to sign in with a fresh client
            from supabase import create_client, Client

            temp_supabase: Client = create_client(
                self.supabase.supabase_url, self.supabase.supabase_key
            )

            try:
                # Attempt to sign in with current password
                auth_response = temp_supabase.auth.sign_in_with_password(
                    {"email": user_data["email"], "password": current_password}
                )

                if not auth_response or not auth_response.user:
                    return {
                        "success": False,
                        "error": "Current password is incorrect",
                        "error_type": "invalid_current_password",
                    }

                # Sign out from the verification session immediately
                temp_supabase.auth.sign_out()

            except Exception:
                return {
                    "success": False,
                    "error": "Current password is incorrect",
                    "error_type": "invalid_current_password",
                }

            # Check if new password is different from current password (after verifying current password)
            if current_password == new_password:
                return {
                    "success": False,
                    "error": "New password must be different from current password",
                    "error_type": "same_password",
                }

            # Update password using admin API
            if self.admin_supabase:
                admin_response = self.admin_supabase.auth.admin.update_user_by_id(
                    user_id, {"password": new_password}
                )

                if admin_response and admin_response.user:
                    return {"success": True}
                else:
                    return {
                        "success": False,
                        "error": "Failed to update password. Please try again.",
                        "error_type": "update_failed",
                    }
            else:
                return {
                    "success": False,
                    "error": "Server configuration error. Please try again later.",
                    "error_type": "config_error",
                }

        except Exception as e:
            return {
                "success": False,
                "error": "An error occurred while changing your password. Please try again.",
                "error_type": "server_error",
            }
