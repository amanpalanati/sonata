from flask import Blueprint, session, jsonify
from services.user_service import UserService

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
            # Get full user data from database
            user_data = user_service.get_user(session["user_id"])
            if not user_data:
                # User no longer exists, clear session
                session.clear()
                return (
                    jsonify({"authenticated": False, "session_cleared": True}),
                    200,
                )

            # Return full user data
            return (
                jsonify(
                    {
                        "authenticated": True,
                        **user_data,  # Spread all user data from the service
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
            profile_image_handled = False
            if "profileImage" in request.files:
                file = request.files["profileImage"]
                if file and file.filename:
                    # TODO: Implement proper file upload to storage (S3, Cloudinary, etc.)
                    # For now, we'll create a data URL from the uploaded file for immediate use
                    import base64

                    file_content = file.read()
                    file_base64 = base64.b64encode(file_content).decode("utf-8")
                    file_mime = file.content_type or "image/jpeg"
                    # Store in profile_image
                    profile_image_data = f"data:{file_mime};base64,{file_base64}"
                    profile_data["profile_image"] = profile_image_data
                    profile_image_handled = True

            # Check if profileImageUrl is explicitly set to empty/undefined (user removed image)
            # BUT only if no file was uploaded (file upload takes priority)
            if not profile_image_handled and request.form.get("profileImageUrl") == "":
                # User explicitly removed their profile image, use special marker
                profile_data["profile_image"] = "__DEFAULT_IMAGE__"
                profile_image_handled = True

            # If no profile image was handled and user doesn't already have one, set default
            current_user = user_service.get_user(user_id)
            if not profile_image_handled and not current_user.get("profile_image"):
                # Set default profile image URL that points to frontend static assets
                profile_data["profile_image"] = "__DEFAULT_IMAGE__"

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

                # Get updated user data to return to frontend
                updated_user_data = user_service.get_user(user_id)

                return (
                    jsonify(
                        {
                            "success": True,
                            "message": "Profile completed successfully",
                            **updated_user_data,  # Include all updated user data
                        }
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
