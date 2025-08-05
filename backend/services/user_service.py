from typing import Dict, Any, Optional
from .base_service import SupabaseService


class UserService(SupabaseService):
    """Service for handling user management operations"""

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user data by user ID"""
        try:
            if not self.admin_supabase:
                return None

            # Get user from Supabase Auth
            auth_user = self.admin_supabase.auth.admin.get_user_by_id(user_id)

            if not auth_user or not auth_user.user:
                return None

            user = auth_user.user
            user_metadata = user.user_metadata or {}

            return {
                "id": user.id,
                "email": user.email,
                "account_type": user_metadata.get("account_type"),
                # Get all profile data from metadata only
                "first_name": user_metadata.get("first_name"),
                "last_name": user_metadata.get("last_name"),
                # Handle OAuth profile images (picture, avatar_url) and regular profile_image
                "profile_image": (
                    user_metadata.get("profile_image")
                    or user_metadata.get("picture")
                    or user_metadata.get("avatar_url")
                ),
                "child_first_name": user_metadata.get("child_first_name"),
                "child_last_name": user_metadata.get("child_last_name"),
                "bio": user_metadata.get("bio"),
                "instruments": user_metadata.get("instruments"),
                "profile_completed": user_metadata.get("profile_completed", False),
                "email_confirmed_at": user.email_confirmed_at,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }

        except Exception as e:
            return None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email from Supabase Auth (requires admin privileges)"""
        try:
            if not self.admin_supabase:
                return None

            # List users and search for email match
            response = self.admin_supabase.auth.admin.list_users()

            if response:
                # Handle both direct list response and object with users attribute
                if isinstance(response, list):
                    users = response
                elif hasattr(response, "users"):
                    users = response.users
                else:
                    return None

                # Search through users for email match
                for user in users:
                    if user.email and user.email.lower() == email.lower():
                        return {
                            "id": user.id,
                            "email": user.email,
                            "account_type": user.user_metadata.get("account_type"),
                            "first_name": user.user_metadata.get("first_name"),
                            "last_name": user.user_metadata.get("last_name"),
                            "profile_image": user.user_metadata.get("profile_image"),
                            "profile_completed": user.user_metadata.get(
                                "profile_completed", False
                            ),
                        }

            return None
        except Exception as e:
            return None

    def get_oauth_user(
        self, user_id: str, user_metadata: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Get or create user from OAuth data"""

        # First, try to get existing user data from Supabase (which may have saved account_type)
        existing_user = None
        if self.admin_supabase:
            existing_user = self.get_user(user_id)

        # If we have existing user with account_type, use that and merge with new OAuth data
        if existing_user and existing_user.get("account_type"):
            # Update names from OAuth if they're better/newer
            full_name = user_metadata.get("full_name", user_metadata.get("name", ""))
            oauth_first_name = user_metadata.get("given_name", "")
            oauth_last_name = user_metadata.get("family_name", "")

            # If we don't have first/last name, try to split full name
            if not oauth_first_name and full_name:
                name_parts = full_name.split(" ", 1)
                oauth_first_name = name_parts[0]
                oauth_last_name = name_parts[1] if len(name_parts) > 1 else ""

            # Use OAuth names if they exist, otherwise keep existing ones
            user_data = {
                "id": existing_user["id"],
                "email": existing_user["email"],
                "account_type": existing_user[
                    "account_type"
                ],  # Keep the saved account_type
                "first_name": oauth_first_name or existing_user.get("first_name", ""),
                "last_name": oauth_last_name or existing_user.get("last_name", ""),
                "profile_image": user_metadata.get("picture")
                or existing_user.get("profile_image"),
                "profile_completed": existing_user.get("profile_completed", False),
            }

            return user_data

        # For new users, we need account_type from the request
        account_type = user_metadata.get("account_type")

        # If no account_type provided, return None (will trigger account deletion)
        if not account_type:
            return None

        # Extract data from Google OAuth user_metadata for new user
        email = user_metadata.get("email")

        # Google OAuth provides different fields for names
        full_name = user_metadata.get("full_name", user_metadata.get("name", ""))
        first_name = user_metadata.get("given_name", "")
        last_name = user_metadata.get("family_name", "")

        # If we don't have first/last name, try to split full name
        if not first_name and full_name:
            name_parts = full_name.split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ""

        user_data = {
            "id": user_id,
            "email": email,
            "account_type": account_type,
            "first_name": first_name,
            "last_name": last_name,
            "profile_image": user_metadata.get("picture"),  # Google profile picture
            "profile_completed": False,
        }

        return user_data

    # Could be used as a general update user data function that also checks if
    # the user exists and if it doesnt then end the session
    def update_user_metadata(
        self, user_id: str, metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user metadata in Supabase Auth

        Returns:
            Dict with keys:
            - success: bool - Whether the operation was successful
            - user_deleted: bool - Whether the user was found to be deleted
            - error: str - Error message if any
        """
        try:
            if not self.admin_supabase:
                return {
                    "success": False,
                    "error": "Admin client not available",
                    "user_deleted": False,
                }

            # First, check if user still exists
            try:
                existing_user = self.admin_supabase.auth.admin.get_user_by_id(user_id)
                if not existing_user or not existing_user.user:
                    # User has been deleted, return flag to clear session
                    return {
                        "success": False,
                        "user_deleted": True,
                        "error": "User not found",
                    }
            except Exception as check_error:
                # If user lookup fails, assume user might be deleted
                return {
                    "success": False,
                    "user_deleted": True,
                    "error": "User verification failed",
                }

            # User exists, proceed with updates
            # Put everything in metadata for consistency
            metadata_response = self.admin_supabase.auth.admin.update_user_by_id(
                user_id, {"user_metadata": metadata}
            )

            if not metadata_response.user:
                return {
                    "success": False,
                    "error": "Metadata update failed",
                    "user_deleted": False,
                }

            return {"success": True, "user_deleted": False}

        except Exception as e:
            # On any exception, it might indicate the user is deleted
            return {"success": False, "user_deleted": True, "error": str(e)}
