from supabase import create_client, Client
from typing import Optional, Dict, Any


class User:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)

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
                return {"success": False, "error": "Failed to create user"}

        except Exception as e:
            return {"success": False, "error": str(e)}

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
                return {"success": False, "error": "Invalid credentials"}

        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID from Supabase Auth"""
        try:
            # Get the current authenticated user
            user_response = self.supabase.auth.get_user()

            if user_response.user and user_response.user.id == user_id:
                return {
                    "id": user_response.user.id,
                    "email": user_response.user.email,
                    "account_type": user_response.user.user_metadata.get(
                        "account_type"
                    ),
                    "first_name": user_response.user.user_metadata.get("first_name"),
                    "last_name": user_response.user.user_metadata.get("last_name"),
                }
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
