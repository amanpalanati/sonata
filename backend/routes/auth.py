from flask import Blueprint, request, session, jsonify
from services.auth_service import AuthService
from services.user_service import UserService
import time

auth_bp = Blueprint("auth", __name__)


def create_auth_routes(auth_service: AuthService, user_service: UserService):
    """Factory function to create auth routes with dependency injection"""

    @auth_bp.route("/api/signup", methods=["POST"])
    def api_signup():
        """API endpoint for user signup"""
        try:
            data = request.get_json()

            # Validate required fields
            required_fields = [
                "email",
                "password",
                "accountType",
                "firstName",
                "lastName",
            ]
            for field in required_fields:
                if not data.get(field):
                    return (
                        jsonify({"success": False, "error": f"{field} is required"}),
                        400,
                    )

            # Validate account type
            valid_account_types = ["student", "teacher", "parent"]
            if data["accountType"] not in valid_account_types:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "No selected account type. Please try again.",
                        }
                    ),
                    400,
                )

            # Create user
            result = auth_service.create_user(
                data["email"],
                data["password"],
                data["accountType"],
                data["firstName"],
                data["lastName"],
            )

            if result["success"]:
                # Log user in (set session)
                user = result["user"]
                session["user_id"] = user["id"]
                session["user_email"] = user["email"]
                session["account_type"] = user["account_type"]
                session["first_name"] = user["first_name"]
                session["last_name"] = user["last_name"]
                session["user_verified_at"] = time.time()
                session.permanent = True

                return (
                    jsonify(
                        {
                            "success": True,
                            "message": "Account created successfully!",
                            "user": result["user"],
                        }
                    ),
                    201,
                )
            else:
                return jsonify({"success": False, "error": result["error"]}), 400

        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @auth_bp.route("/api/login", methods=["POST"])
    def api_login():
        """API endpoint for user login"""
        try:
            data = request.get_json()

            # Validate required fields
            if not data.get("email") or not data.get("password"):
                return (
                    jsonify(
                        {"success": False, "error": "Email and password are required"}
                    ),
                    400,
                )

            # Authenticate user
            result = auth_service.authenticate_user(data["email"], data["password"])

            if result["success"]:
                # Log user in (set session)
                user = result["user"]
                
                session["user_id"] = user["id"]
                session["user_email"] = user["email"]
                session["account_type"] = user["account_type"]
                session["first_name"] = user["first_name"]
                session["last_name"] = user["last_name"]
                session["profile_completed"] = user.get("profile_completed", False)
                session["user_verified_at"] = time.time()
                session.permanent = True

                return (
                    jsonify(
                        {"success": True, "message": "Login successful!", "user": user}
                    ),
                    200,
                )
            else:
                return jsonify({"success": False, "error": result["error"]}), 401

        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @auth_bp.route("/api/logout", methods=["POST"])
    def api_logout():
        """API endpoint for user logout"""
        # Get session ID before clearing to ensure proper cleanup
        session_id = session.get("_id", None)

        # Make session non-permanent and clear all data
        session.permanent = False
        session.clear()

        # Force session modification to ensure it's saved as empty
        session.modified = True

        return jsonify({"success": True, "message": "Logged out successfully"}), 200

    @auth_bp.route("/api/oauth-callback", methods=["POST"])
    def api_oauth_callback():
        """API endpoint to sync Supabase OAuth session with Flask session"""
        try:
            data = request.get_json()

            # Validate required fields
            if not data.get("access_token") or not data.get("user_id"):
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Missing required data. Please try again.",
                        }
                    ),
                    400,
                )

            # Get mode from request data
            mode = data.get(
                "mode", "signup"
            )  # Default to signup for backward compatibility

            # Get user data from Supabase using the access token
            user_data = user_service.get_oauth_user(
                data["user_id"], data.get("user_metadata", {})
            )

            if not user_data:
                # Clear any existing session before deleting account
                session.clear()
                # Delete the incomplete user account
                auth_service.delete_user(data["user_id"])
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Account does not exist. Please sign up or try again.",
                        }
                    ),
                    400,
                )

            # Check if this is a login attempt but user doesn't have account_type (incomplete signup)
            if mode == "login" and not user_data.get("account_type"):
                # Clear any existing session before deleting account
                session.clear()
                # Delete the incomplete user account
                delete_success = auth_service.delete_user(data["user_id"])
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Account does not exist. Please sign up or try again.",
                            "incomplete_account": True,
                            "account_deleted": delete_success,
                        }
                    ),
                    400,
                )

            # Set Flask session with user data
            session["user_id"] = user_data["id"]
            session["user_email"] = user_data["email"]
            session["account_type"] = user_data.get("account_type")
            session["first_name"] = user_data.get("first_name")
            session["last_name"] = user_data.get("last_name")
            session["user_verified_at"] = time.time()  # Mark as recently verified
            session.permanent = True

            # Update Supabase user metadata with account type (if we have admin access)
            if user_data.get("account_type"):
                metadata_to_save = {
                    "account_type": user_data["account_type"],
                    "first_name": user_data.get("first_name", ""),
                    "last_name": user_data.get("last_name", ""),
                }
                user_service.update_user_metadata(user_data["id"], metadata_to_save)

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Sessions synced successfully",
                        "user": user_data,
                    }
                ),
                200,
            )

        except Exception as e:
            # If there's any error, clear session and try to delete the potentially incomplete account
            session.clear()
            try:
                if data and data.get("user_id"):
                    auth_service.delete_user(data["user_id"])
            except:
                pass  # Ignore deletion errors in exception handler

            return (
                jsonify(
                    {
                        "success": False,
                        "error": "There was an error processing your request. Please try again later.",
                    }
                ),
                500,
            )

    return auth_bp
