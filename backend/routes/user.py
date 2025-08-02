from flask import Blueprint, session, jsonify
from services.user_service import UserService
import time

user_bp = Blueprint("user", __name__)


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
                    {
                        "success": False,
                        "error": "User not found",
                        "session_cleared": True,
                    }
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

            if current_time - last_verified > 300:  # 5 minutes
                # Verify user still exists in Supabase
                user_data = user_service.get_user(session["user_id"])
                if not user_data:
                    # User no longer exists, clear session
                    session.clear()
                    return (
                        jsonify({"authenticated": False, "session_cleared": True}),
                        200,
                    )

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

    @user_bp.route("/api/complete-profile", methods=["POST"])
    def api_complete_profile():
        """API endpoint to complete user profile"""
        from flask import request

        if "user_id" not in session:
            return jsonify({"success": False, "error": "Not authenticated"}), 401

        user_id = session["user_id"]

        try:
            # Get form data
            profile_data = {}

            # Handle text fields
            if request.form.get("firstName"):
                profile_data["first_name"] = request.form.get("firstName")
            if request.form.get("lastName"):
                profile_data["last_name"] = request.form.get("lastName")
            if request.form.get("email"):
                profile_data["email"] = request.form.get("email")
            if request.form.get("childFirstName"):
                profile_data["child_first_name"] = request.form.get("childFirstName")
            if request.form.get("childLastName"):
                profile_data["child_last_name"] = request.form.get("childLastName")
            if request.form.get("bio"):
                profile_data["bio"] = request.form.get("bio")
            if request.form.get("instruments"):
                import json

                try:
                    profile_data["instruments"] = json.loads(
                        request.form.get("instruments")
                    )
                except json.JSONDecodeError:
                    profile_data["instruments"] = []

            # Handle file upload (profile image)
            if "profileImage" in request.files:
                file = request.files["profileImage"]
                if file and file.filename:
                    # TODO: Implement file upload to storage (S3, Cloudinary, etc.)
                    # For now, we'll just note that an image was uploaded
                    profile_data["profile_image"] = "uploaded_image_placeholder"

            # Mark profile as completed
            profile_data["profile_completed"] = True

            # Update user metadata using the enhanced method
            result = user_service.update_user_metadata(user_id, profile_data)

            if result["user_deleted"]:
                # User was deleted, clear session
                session.clear()
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "User account no longer exists",
                            "session_cleared": True,
                        }
                    ),
                    404,
                )

            if result["success"]:
                # Update session data
                session.update(
                    {
                        "first_name": profile_data.get(
                            "first_name", session.get("first_name")
                        ),
                        "last_name": profile_data.get(
                            "last_name", session.get("last_name")
                        ),
                        "profile_completed": True,
                    }
                )

                return (
                    jsonify(
                        {"success": True, "message": "Profile completed successfully"}
                    ),
                    200,
                )
            else:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": result.get("error", "Update failed"),
                        }
                    ),
                    500,
                )

        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    return user_bp
