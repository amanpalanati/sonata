from supabase import create_client, Client
from typing import Optional, Dict, Any


class User:
    def __init__(
        self, supabase_url: str, supabase_key: str, service_role_key: str = None
    ):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        # Create admin client if service role key is provided
        if service_role_key:
            self.admin_supabase: Client = create_client(supabase_url, service_role_key)
        else:
            self.admin_supabase = None

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
                return {"success": False, "error": "Unable to create account. Please try again."}

        except Exception as e:
            error_message = str(e)
        
            # Custom error messages
            if "User already registered" in error_message:
                return {"success": False, "error": "An account with this email already exists. Please log in or use a different email address."}
            elif "Password should be at least" in error_message:
                return {"success": False, "error": "Password must be at least 8 characters long."}
            elif "Unable to validate email address" in error_message:
                return {"success": False, "error": "Please enter a valid email address."}
            elif "signup is disabled" in error_message:
                return {"success": False, "error": "Account creation is temporarily disabled. Please try again later."}
            else:
                return {"success": False, "error": "Unable to create account. Please try again."}

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user login using Supabase Auth"""
        try:
            # Use Supabase Auth
            auth_response = self.supabase.auth.sign_in_with_password(
                {"email": email.lower(), "password": password}
            )

            if auth_response.user:
                user_data = {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "account_type": auth_response.user.user_metadata.get(
                        "account_type"
                    ),
                    "first_name": auth_response.user.user_metadata.get("first_name"),
                    "last_name": auth_response.user.user_metadata.get("last_name"),
                }
                return {"success": True, "user": user_data}
            else:
                return {"success": False, "error": "Your email or password is incorrect. Please try again."}

        except Exception as e:
            error_message = str(e)
        
            # Custom error messages for authentication
            if "Invalid login credentials" in error_message:
                return {"success": False, "error": "Your email or password is incorrect. Please try again."}
            elif "Email not confirmed" in error_message:
                return {"success": False, "error": "Please check your email and confirm your account before logging in."}
            elif "Too many requests" in error_message:
                return {"success": False, "error": "Too many login attempts. Please wait a moment and try again."}
            else:
                return {"success": False, "error": "There was an error logging in. Please try again later."}
   
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID from Supabase Auth"""
        try:
            if self.admin_supabase:
                # Use admin client to get user by ID
                user_response = self.admin_supabase.auth.admin.get_user_by_id(user_id)

                if user_response and user_response.user:
                    return {
                        "id": user_response.user.id,
                        "email": user_response.user.email,
                        "account_type": user_response.user.user_metadata.get(
                            "account_type"
                        ),
                        "first_name": user_response.user.user_metadata.get(
                            "first_name"
                        ),
                        "last_name": user_response.user.user_metadata.get("last_name"),
                    }
            return None
        except Exception as e:
            # User not found or other error - return None
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
                elif hasattr(response, 'users'):
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
        }

        return user_data

    def update_user_metadata(self, user_id: str, metadata: Dict[str, Any]) -> bool:
        """Update user metadata in Supabase Auth"""
        try:
            if not self.admin_supabase:
                return False

            response = self.admin_supabase.auth.admin.update_user_by_id(
                user_id, {"user_metadata": metadata}
            )

            if response.user:
                return True
            else:
                return False

        except Exception as e:
            return False


    # This could be used in the future to update all user info at once when needed
    # Also add a check to see if the user exists in the database before updating,
    # else, log out the user
    def update_password(self, user_id: str, new_password: str) -> bool:
        """Update user's password using admin privileges"""
        try:
            if not self.admin_supabase:
                return False

            response = self.admin_supabase.auth.admin.update_user_by_id(
                user_id, {"password": new_password}
            )

            if response.user:
                return True
            else:
                return False

        except Exception as e:
            return False

    def update_password_by_email(self, email: str, new_password: str) -> bool:
        """Update user's password by email using admin privileges"""
        try:
            if not self.admin_supabase:
                return False

            # First, get the user by email
            user_data = self.get_user_by_email(email)
            if not user_data:
                return False

            # Update the password using the user ID
            response = self.admin_supabase.auth.admin.update_user_by_id(
                user_data["id"], {"password": new_password}
            )

            if response.user:
                return True
            else:
                return False

        except Exception as e:
            return False

    def delete_user(self, user_id: str) -> bool:
        """Delete user from Supabase Auth (requires service role key)"""
        try:
            if not self.admin_supabase:
                return False

            response = self.admin_supabase.auth.admin.delete_user(user_id)

            # The delete operation returns True on success
            return True

        except Exception as e:
            return False
