from flask import Blueprint, session, jsonify
from services.user_service import UserService
from services.storage_service import StorageService

user_bp = Blueprint("user", __name__)


def create_user_routes(user_service: UserService, storage_service: StorageService):
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
            old_profile_image_path = None

            # Get current user to check for existing profile image
            current_user = user_service.get_user(user_id)
            if current_user:
                # We need to get the raw storage path from user metadata, not the signed URL
                # The get_user method returns signed URLs, but we need the actual storage path
                try:
                    auth_user = user_service.admin_supabase.auth.admin.get_user_by_id(
                        user_id
                    )
                    if auth_user and auth_user.user:
                        user_metadata = auth_user.user.user_metadata or {}
                        stored_path = user_metadata.get("profile_image")
                        # Check if it's a storage path (not a base64 or external URL)
                        if stored_path and not stored_path.startswith(
                            ("data:", "http", "__DEFAULT_IMAGE__")
                        ):
                            old_profile_image_path = stored_path
                except Exception as e:
                    pass  # Silently handle metadata lookup errors

            if "profileImage" in request.files:
                file = request.files["profileImage"]
                if file and file.filename:
                    # Validate file type
                    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
                    file_extension = file.filename.lower().split(".")[-1]

                    if f".{file_extension}" not in allowed_extensions:
                        return (
                            jsonify(
                                {
                                    "success": False,
                                    "error": "Invalid file type. Please upload an image file.",
                                }
                            ),
                            400,
                        )

                    # Validate file size (5MB limit)
                    file.seek(0, 2)  # Seek to end
                    file_size = file.tell()
                    file.seek(0)  # Reset to beginning

                    if file_size > 5 * 1024 * 1024:  # 5MB
                        return (
                            jsonify(
                                {
                                    "success": False,
                                    "error": "File too large. Please upload an image smaller than 5MB.",
                                }
                            ),
                            400,
                        )

                    # Upload to Supabase Storage
                    file_content = file.read()
                    upload_result = storage_service.upload_profile_image(
                        user_id,
                        file_content,
                        file.filename,
                        file.content_type or "image/jpeg",
                        old_profile_image_path,  # Pass old image path for cleanup
                    )

                    if upload_result["success"]:
                        # Store the file path in profile_image (not the signed URL)
                        profile_data["profile_image"] = upload_result["file_path"]
                        profile_image_handled = True

                        # Clean up old profile image if it exists
                        if old_profile_image_path:
                            storage_service.delete_file(old_profile_image_path)
                    else:
                        return (
                            jsonify(
                                {
                                    "success": False,
                                    "error": f"Failed to upload image: {upload_result.get('error')}",
                                }
                            ),
                            500,
                        )

            # Check if profileImageUrl is explicitly set to empty/undefined (user removed image)
            # BUT only if no file was uploaded (file upload takes priority)
            if not profile_image_handled and request.form.get("profileImageUrl") == "":
                # User explicitly removed their profile image
                profile_data["profile_image"] = "__DEFAULT_IMAGE__"
                profile_image_handled = True

                # Clean up old profile image if it exists
                if old_profile_image_path:
                    storage_service.delete_file(old_profile_image_path)

            # If no profile image was handled but user has existing profile_image, keep it
            # This prevents overwriting existing images when other fields are updated
            elif (
                not profile_image_handled
                and current_user
                and current_user.get("profile_image")
            ):
                # Keep existing profile image as-is
                pass
            # If no profile image was handled and user doesn't have one, set default marker
            elif not profile_image_handled:
                # Set default profile image marker
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
