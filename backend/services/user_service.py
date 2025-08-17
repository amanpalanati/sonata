from typing import Dict, Any, Optional
from .base_service import SupabaseService


class UserService(SupabaseService):
    """Service for handling user management operations"""

    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        service_role_key: str,
        storage_service=None,
    ):
        """Initialize UserService with optional StorageService dependency"""
        super().__init__(supabase_url, supabase_key, service_role_key)
        self.storage_service = storage_service

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user data by user ID from profiles, teachers, and parents tables"""
        try:
            if not self.admin_supabase:
                return None

            # Get user from Supabase Auth
            auth_user = self.admin_supabase.auth.admin.get_user_by_id(user_id)

            if not auth_user or not auth_user.user:
                return None

            user = auth_user.user
            user_metadata = user.user_metadata or {}

            # Get profile data from profiles table using admin client
            profiles_response = self.admin_supabase.table("profiles").select("*").eq("id", user_id).execute()
            
            if not profiles_response.data:
                # No profile data exists, return basic auth data with metadata
                return {
                    "id": user.id,
                    "email": user.email,
                    "account_type": user_metadata.get("account_type"),
                    "first_name": user_metadata.get("first_name"),
                    "last_name": user_metadata.get("last_name"),
                    "profile_completed": user_metadata.get("profile_completed", False),
                    "email_confirmed_at": user.email_confirmed_at,
                    "created_at": user.created_at,
                    "updated_at": user.updated_at,
                }

            profile_data = profiles_response.data[0]

            # Handle profile image - get signed URL if it's a storage path
            profile_image = None
            stored_image_path = profile_data.get("profile_image")

            if stored_image_path == "__DEFAULT_IMAGE__":
                profile_image = "__DEFAULT_IMAGE__"
            elif stored_image_path:
                # Check if it's a storage path (not a base64 or external URL)
                if self.storage_service and not stored_image_path.startswith(
                    ("data:", "http")
                ):
                    # It's a storage path, get signed URL
                    profile_image = self.storage_service.get_profile_image_url(
                        user_id, stored_image_path
                    )
                else:
                    # It's a base64 data URL or external URL (OAuth), use as-is
                    profile_image = stored_image_path
            else:
                # No profile_image in profile, fall back to OAuth picture for new OAuth users
                oauth_picture = user_metadata.get("picture")
                if oauth_picture:
                    profile_image = oauth_picture

            # Build base user data from profiles table
            user_data = {
                "id": user.id,
                "email": user.email,
                "account_type": profile_data.get("account_type"),
                "first_name": profile_data.get("first_name"),
                "last_name": profile_data.get("last_name"),
                "profile_image": profile_image,
                "instruments": profile_data.get("instruments", []),
                "location": profile_data.get("location"),
                "profile_completed": user_metadata.get("profile_completed", False),
                "email_confirmed_at": user.email_confirmed_at,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
            }

            # Get additional data based on account type
            account_type = profile_data.get("account_type")
            
            if account_type == "teacher":
                teachers_response = self.admin_supabase.table("teachers").select("*").eq("id", user_id).execute()
                if teachers_response.data:
                    teacher_data = teachers_response.data[0]
                    user_data["bio"] = teacher_data.get("bio")
            
            elif account_type == "parent":
                parents_response = self.admin_supabase.table("parents").select("*").eq("id", user_id).execute()
                if parents_response.data:
                    parent_data = parents_response.data[0]
                    user_data["child_first_name"] = parent_data.get("child_first_name")
                    user_data["child_last_name"] = parent_data.get("child_last_name")

            return user_data

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
                        # Return full user data using get_user method
                        return self.get_user(user.id)

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

            # Return the complete existing user data with updated names if available
            if oauth_first_name:
                existing_user["first_name"] = oauth_first_name
            if oauth_last_name:
                existing_user["last_name"] = oauth_last_name

            # Update profile image from OAuth if it's provided and different
            oauth_profile_image = user_metadata.get("profile_image") or user_metadata.get("picture")
            if oauth_profile_image and oauth_profile_image != existing_user.get("profile_image"):
                existing_user["profile_image"] = oauth_profile_image

            return existing_user

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
            "profile_image": user_metadata.get("profile_image")
            or user_metadata.get("picture"),  # Check profile_image first, then picture
            "profile_completed": False,
        }

        return user_data

    def update_user_metadata(
        self, user_id: str, metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update user metadata in Supabase Auth"""
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

    def create_or_update_profile(
        self, user_id: str, profile_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create or update user profile in the profiles, teachers, and parents tables"""
        try:
            # Validate required fields
            if not profile_data.get("account_type"):
                return {"success": False, "error": "Account type is required"}
            if not profile_data.get("first_name"):
                return {"success": False, "error": "First name is required"}
            if not profile_data.get("last_name"):
                return {"success": False, "error": "Last name is required"}
            
            # Prepare profile data for profiles table
            profile_fields = {
                "id": user_id,
                "account_type": profile_data.get("account_type"),
                "first_name": profile_data.get("first_name"),
                "last_name": profile_data.get("last_name"),
                "instruments": profile_data.get("instruments", []),
                "profile_image": profile_data.get("profile_image"),
                "location": profile_data.get("location"),
            }

            # Remove None values except for required fields
            filtered_fields = {}
            required_fields = ["id", "account_type", "first_name", "last_name"]
            
            for key, value in profile_fields.items():
                if key in required_fields:
                    # Keep required fields even if they're None (will cause DB error if actually None)
                    filtered_fields[key] = value
                elif value is not None:
                    # Only keep optional fields if they have values
                    filtered_fields[key] = value
            
            profile_fields = filtered_fields

            # Use admin client for server-side operations since we can't easily 
            # authenticate the regular client with the user's session in this context
            profiles_response = (
                self.admin_supabase.table("profiles")
                .upsert(profile_fields, on_conflict="id")
                .execute()
            )

            if not profiles_response.data:
                return {"success": False, "error": "Failed to create/update profile"}

            # Handle account-type specific data
            account_type = profile_data.get("account_type")

            if account_type == "teacher":
                # Always create a teacher record for teacher accounts
                teacher_data = {
                    "id": user_id,
                    "bio": profile_data.get("bio") or "",  # Use empty string if bio is None or empty
                }
                
                teachers_response = (
                    self.admin_supabase.table("teachers")
                    .upsert(teacher_data, on_conflict="id")
                    .execute()
                )

                if not teachers_response.data:
                    return {"success": False, "error": "Failed to update teacher data"}
                    
            elif account_type == "parent":
                # Always create a parent record for parent accounts
                parent_data = {
                    "id": user_id,  # Always include the ID
                    "child_first_name": profile_data.get("child_first_name") or "",
                    "child_last_name": profile_data.get("child_last_name") or "",
                }

                parents_response = (
                    self.admin_supabase.table("parents")
                    .upsert(parent_data, on_conflict="id")
                    .execute()
                )

                if not parents_response.data:
                    return {"success": False, "error": "Failed to update parent data"}

            # Update metadata with profile_completed flag
            metadata_update = {}
            if "profile_completed" in profile_data:
                metadata_update["profile_completed"] = profile_data["profile_completed"]

            if metadata_update:
                metadata_result = self.update_user_metadata(user_id, metadata_update)
                if not metadata_result["success"]:
                    return metadata_result

            return {"success": True}

        except Exception as e:
            return {"success": False, "error": str(e)}
