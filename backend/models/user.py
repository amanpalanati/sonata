from supabase import create_client, Client
from typing import Optional, Dict, Any


class User:
    # Class variable to track used tokens (in production, use database/Redis)
    _used_tokens = set()
    
    @classmethod
    def cleanup_used_tokens(cls):
        """Clean up used tokens periodically (in production, implement with TTL)"""
        # In production, you'd implement this with database cleanup or Redis TTL
        # For now, just clear the set periodically
        if len(cls._used_tokens) > 1000:  # Arbitrary limit
            cls._used_tokens.clear()
    
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

    def initiate_password_reset(self, email: str) -> bool:
        """Send password reset email using Supabase Auth"""
        try:
            # Check if user exists first (but don't reveal this to the client)
            user_exists = self.get_user_by_email(email) is not None
            
            if user_exists:
                # For now, use Supabase's built-in email service
                # Later, replace this with generate_link + SMTP
                response = self.supabase.auth.reset_password_email(
                    email,
                    options={
                        "redirect_to": "http://localhost:3000/reset-password"
                    }
                )
                return True
            else:
                # Don't send email but return True to not reveal if user exists
                return True
                
        except Exception as e:
            # Don't reveal errors to prevent email enumeration
            return True

    def reset_password_with_token(self, access_token: str, new_password: str) -> Dict[str, Any]:
        """Reset password using token from email link"""
        try:
            # Check if token has already been used
            if access_token in self._used_tokens:
                return {
                    "success": False,
                    "error": "This reset link has already been used. Please request a new password reset.",
                    "error_type": "token_reused"
                }
            
            # Create a new supabase client instance for this session
            from supabase import create_client, Client
            temp_supabase: Client = create_client(
                self.supabase.supabase_url, 
                self.supabase.supabase_key
            )
            
            # Set session with access token to verify the token and get user info
            response = temp_supabase.auth.set_session(access_token, "")
            
            if response and response.user:
                user_id = response.user.id
                
                # Use admin API to update the password directly
                if self.admin_supabase:
                    admin_response = self.admin_supabase.auth.admin.update_user_by_id(
                        user_id, 
                        {"password": new_password}
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
                            "error_type": "update_failed"
                        }
                else:
                    return {
                        "success": False,
                        "error": "Server configuration error. Please try again later.",
                        "error_type": "config_error"
                    }
            else:
                return {
                    "success": False,
                    "error": "Invalid or expired reset link. Please request a new password reset.",
                    "error_type": "invalid_token"
                }
            
        except Exception as e:
            return {
                "success": False,
                "error": "An error occurred while resetting your password. Please try again.",
                "error_type": "server_error"
            }

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
