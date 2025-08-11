from typing import Dict, Any, Optional
from .base_service import SupabaseService


class AuthService(SupabaseService):
    """Service for handling user authentication operations"""

    def create_user(
        self,
        email: str,
        password: str,
        account_type: str,
        first_name: str,
        last_name: str,
    ) -> Dict[str, Any]:
        """Create a new user account using Supabase Auth"""
        try:
            # Use Supabase Auth for user creation
            auth_response = self.supabase.auth.sign_up(
                {
                    "email": email.lower(),
                    "password": password,
                    "options": {
                        "data": {
                            "account_type": account_type,
                            "first_name": first_name,
                            "last_name": last_name,
                        }
                    },
                }
            )

            if auth_response.user:
                # User created successfully
                user_data = {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "account_type": account_type,
                    "first_name": first_name,
                    "last_name": last_name,
                }
                return {"success": True, "user": user_data}
            else:
                return {
                    "success": False,
                    "error": "Unable to create account. Please try again.",
                }

        except Exception as e:
            error_message = str(e)

            # Custom error messages
            if "User already registered" in error_message:
                return {
                    "success": False,
                    "error": "An account with this email already exists. Please log in or use a different email address.",
                }
            elif "Password should be at least" in error_message:
                return {
                    "success": False,
                    "error": "Password must be at least 8 characters long.",
                }
            elif "Unable to validate email address" in error_message:
                return {
                    "success": False,
                    "error": "Please enter a valid email address.",
                }
            elif "signup is disabled" in error_message:
                return {
                    "success": False,
                    "error": "Account creation is temporarily disabled. Please try again later.",
                }
            else:
                return {
                    "success": False,
                    "error": "Unable to create account. Please try again.",
                }

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user login using Supabase Auth"""
        try:
            # Use Supabase Auth for authentication
            auth_response = self.supabase.auth.sign_in_with_password(
                {"email": email.lower(), "password": password}
            )

            if auth_response.user:
                # Get user metadata from auth response - this contains all profile data
                user_metadata = auth_response.user.user_metadata or {}

                user_data = {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "account_type": user_metadata.get("account_type"),
                    "first_name": user_metadata.get("first_name"),
                    "last_name": user_metadata.get("last_name"),
                    "child_first_name": user_metadata.get("child_first_name"),
                    "child_last_name": user_metadata.get("child_last_name"),
                    "bio": user_metadata.get("bio"),
                    "instruments": user_metadata.get("instruments"),
                    "profile_completed": user_metadata.get("profile_completed", False),
                    # Handle OAuth profile images (picture, avatar_url) and regular profile_image
                    "profile_image": (
                        user_metadata.get("profile_image")
                        or user_metadata.get("picture")
                        or user_metadata.get("avatar_url")
                    ),
                    "email_confirmed_at": auth_response.user.email_confirmed_at,
                    "created_at": auth_response.user.created_at,
                    "updated_at": auth_response.user.updated_at,
                }
                return {"success": True, "user": user_data}
            else:
                return {
                    "success": False,
                    "error": "Your email or password is incorrect. Please try again.",
                }

        except Exception as e:
            error_message = str(e)

            # Custom error messages
            if "Invalid login credentials" in error_message:
                return {
                    "success": False,
                    "error": "Your email or password is incorrect. Please try again.",
                }
            elif "Email not confirmed" in error_message:
                return {
                    "success": False,
                    "error": "Your email address is not confirmed. Please check your email and click the confirmation link.",
                }
            elif "Too many requests" in error_message:
                return {
                    "success": False,
                    "error": "Too many login attempts. Please wait a moment before trying again.",
                }
            else:
                return {
                    "success": False,
                    "error": "There was an error logging in. Please try again later.",
                }

    def delete_user(self, user_id: str) -> bool:
        """Delete a user account (used for cleanup of incomplete OAuth accounts)"""
        try:
            if not self.admin_supabase:
                return False

            self.admin_supabase.auth.admin.delete_user(user_id)
            return True

        except Exception as e:
            return False
