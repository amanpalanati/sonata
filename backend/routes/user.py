from flask import Blueprint, session, jsonify
from services.user_service import UserService
import time

user_bp = Blueprint('user', __name__)

def create_user_routes(user_service: UserService):
    """Factory function to create user routes with dependency injection"""
    
    @user_bp.route("/api/user", methods=["GET"])
    def api_get_user():
        """API endpoint to get current user data"""
        if "user_id" not in session:
            return jsonify({"success": False, "error": "Not authenticated"}), 401

        # Verify user still exists in Supabase
        user_data = user_service.get_user(session["user_id"])
        if not user_data:
            # User no longer exists in database, clear session
            session.clear()
            return (
                jsonify(
                    {"success": False, "error": "User not found", "session_cleared": True}
                ),
                404,
            )

        return jsonify({"success": True, "user": user_data}), 200

    @user_bp.route("/api/check-auth", methods=["GET"])
    def api_check_auth():
        """API endpoint to check if user is authenticated"""
        if "user_id" in session:
            # Only verify user exists in database if we haven't checked recently
            # Check if we have cached user verification (expires after 5 minutes)
            last_verified = session.get("user_verified_at", 0)
            current_time = time.time()

            if current_time - last_verified > 60:  # 5 minutes CHANGE
                # Verify user still exists in Supabase
                user_data = user_service.get_user(session["user_id"])
                if not user_data:
                    # User no longer exists, clear session
                    session.clear()
                    return jsonify({"authenticated": False, "session_cleared": True}), 200

                # Update verification timestamp
                session["user_verified_at"] = current_time

            return (
                jsonify(
                    {
                        "authenticated": True,
                        "user_id": session["user_id"],
                        "user_email": session.get("user_email"),
                        "account_type": session.get("account_type"),
                        "first_name": session.get("first_name"),
                        "last_name": session.get("last_name"),
                    }
                ),
                200,
            )
        else:
            return jsonify({"authenticated": False}), 200

    return user_bp
