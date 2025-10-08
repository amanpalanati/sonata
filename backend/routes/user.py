from flask import Blueprint, session, jsonify, Response
from services.user_service import UserService
from services.storage_service import StorageService
import requests

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

    @user_bp.route("/api/update-profile", methods=["POST"])
    def api_update_profile():
        """API endpoint to update user profile"""
        from flask import request

        if "user_id" not in session:
            return jsonify({"success": False, "error": "Not authenticated"}), 401

        user_id = session["user_id"]

        try:
            # Get current user data to determine account type
            current_user = user_service.get_user(user_id)
            if not current_user:
                return jsonify({"success": False, "error": "User not found"}), 404

            # Get form data
            profile_data = {}

            # Handle text fields
            if request.form.get("firstName"):
                profile_data["first_name"] = request.form.get("firstName")
            if request.form.get("lastName"):
                profile_data["last_name"] = request.form.get("lastName")
            if request.form.get("email"):
                profile_data["email"] = request.form.get("email")
            # Add account type from current user or form data
            if request.form.get("accountType"):
                profile_data["account_type"] = request.form.get("accountType")
            elif current_user.get("account_type"):
                profile_data["account_type"] = current_user.get("account_type")
            # Always include location, even if empty - UPDATE PROFILE
            profile_data["location"] = request.form.get("location", "")

            # Handle child name fields for parents
            if current_user.get("account_type") == "parent":
                if request.form.get("childFirstName"):
                    profile_data["child_first_name"] = request.form.get(
                        "childFirstName"
                    )
                if request.form.get("childLastName"):
                    profile_data["child_last_name"] = request.form.get("childLastName")

            # Handle bio for teachers
            if current_user.get("account_type") == "teacher":
                # Always include bio field for teachers, even if empty
                profile_data["bio"] = request.form.get("bio", "")

            # Handle instruments
            if request.form.get("instruments"):
                import json

                try:
                    profile_data["instruments"] = json.loads(
                        request.form.get("instruments")
                    )
                except json.JSONDecodeError:
                    profile_data["instruments"] = []

            # Handle profile image
            profile_image_handled = False
            old_profile_image_path = None

            # Get current profile image path from database using admin client
            try:
                profiles_response = (
                    user_service.admin_supabase.table("profiles")
                    .select("profile_image")
                    .eq("id", user_id)
                    .execute()
                )
                if profiles_response.data:
                    stored_path = profiles_response.data[0].get("profile_image")
                    if stored_path and not stored_path.startswith(
                        ("data:", "http", "__DEFAULT_IMAGE__")
                    ):
                        old_profile_image_path = stored_path
            except Exception as e:
                pass  # Silently handle lookup errors

            # Check if user wants to remove profile image
            if request.form.get("removeProfileImage") == "true":
                profile_data["profile_image"] = "__DEFAULT_IMAGE__"
                profile_image_handled = True

                # Clean up old profile image if it exists
                if old_profile_image_path:
                    storage_service.delete_file(old_profile_image_path)

            elif "profileImage" in request.files:
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
            elif (
                not profile_image_handled and request.form.get("profileImageUrl") == ""
            ):
                profile_data["profile_image"] = "__DEFAULT_IMAGE__"
                profile_image_handled = True

                # Clean up old profile image if it exists
                if old_profile_image_path:
                    storage_service.delete_file(old_profile_image_path)

            # If no profile image was handled but we're completing profile, set default
            elif not profile_image_handled and not current_user.get("profile_image"):
                profile_data["profile_image"] = "__DEFAULT_IMAGE__"

            # Update profile in database tables
            result = user_service.create_or_update_profile(user_id, profile_data)

            if not result["success"]:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": result.get("error", "Update failed"),
                        }
                    ),
                    500,
                )

            # Update session data
            if profile_data.get("first_name"):
                session["first_name"] = profile_data["first_name"]
            if profile_data.get("last_name"):
                session["last_name"] = profile_data["last_name"]
            if profile_data.get("profile_completed"):
                session["profile_completed"] = True

            # Get updated user data to return to frontend
            updated_user_data = user_service.get_user(user_id)

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Profile updated successfully",
                        **updated_user_data,  # Include all updated user data
                    }
                ),
                200,
            )

        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @user_bp.route("/api/complete-profile", methods=["POST"])
    def api_complete_profile():
        """API endpoint to complete user profile for the first time"""
        from flask import request

        if "user_id" not in session:
            return jsonify({"success": False, "error": "Not authenticated"}), 401

        user_id = session["user_id"]

        try:
            # Get current user data to determine account type
            current_user = user_service.get_user(user_id)
            if not current_user:
                return jsonify({"success": False, "error": "User not found"}), 404

            # Get form data - same as update profile but mark as completing
            profile_data = {}

            # Handle text fields
            if request.form.get("firstName"):
                profile_data["first_name"] = request.form.get("firstName")
            if request.form.get("lastName"):
                profile_data["last_name"] = request.form.get("lastName")
            if request.form.get("email"):
                profile_data["email"] = request.form.get("email")
            # Always include location, even if empty - COMPLETE PROFILE
            profile_data["location"] = request.form.get("location", "")

            # Handle child name fields for parents
            if current_user.get("account_type") == "parent":
                if request.form.get("childFirstName"):
                    profile_data["child_first_name"] = request.form.get(
                        "childFirstName"
                    )
                if request.form.get("childLastName"):
                    profile_data["child_last_name"] = request.form.get("childLastName")

            # Handle bio for teachers
            if current_user.get("account_type") == "teacher":
                # Always include bio field for teachers, even if empty
                profile_data["bio"] = request.form.get("bio", "")

            # Handle instruments
            if request.form.get("instruments"):
                import json

                try:
                    profile_data["instruments"] = json.loads(
                        request.form.get("instruments")
                    )
                except json.JSONDecodeError:
                    profile_data["instruments"] = []

            # Handle profile image upload - same logic as update profile
            profile_image_handled = False
            old_profile_image_path = None

            # Get current profile image path from database
            try:
                profiles_response = (
                    user_service.supabase.table("profiles")
                    .select("profile_image")
                    .eq("id", user_id)
                    .execute()
                )
                if profiles_response.data:
                    stored_path = profiles_response.data[0].get("profile_image")
                    if stored_path and not stored_path.startswith(
                        ("data:", "http", "__DEFAULT_IMAGE__")
                    ):
                        old_profile_image_path = stored_path
            except Exception as e:
                pass

            # Handle profile image file upload
            if "profileImage" in request.files:
                file = request.files["profileImage"]
                if file and file.filename:
                    # Validate and upload file (same validation as before)
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

                    file.seek(0, 2)
                    file_size = file.tell()
                    file.seek(0)

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
                        old_profile_image_path,
                    )

                    if upload_result["success"]:
                        profile_data["profile_image"] = upload_result["file_path"]
                        profile_image_handled = True
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

            # Check if profileImageUrl is provided (from OAuth or existing image)
            elif request.form.get("profileImageUrl"):
                profile_image_url = request.form.get("profileImageUrl")
                if profile_image_url and not profile_image_url.startswith(
                    "__DEFAULT_IMAGE__"
                ):
                    profile_data["profile_image"] = profile_image_url
                    profile_image_handled = True

            # Set default image if no image was uploaded or provided
            if not profile_image_handled:
                profile_data["profile_image"] = "__DEFAULT_IMAGE__"

            # Mark profile as completed and include account type
            profile_data["profile_completed"] = True
            profile_data["account_type"] = current_user.get("account_type")

            # Update profile in database tables
            result = user_service.create_or_update_profile(user_id, profile_data)

            if not result["success"]:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": result.get("error", "Profile completion failed"),
                        }
                    ),
                    500,
                )

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
                        **updated_user_data,
                    }
                ),
                200,
            )

        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    @user_bp.route("/api/proxy-image", methods=["GET"])
    def api_proxy_image():
        """Proxy endpoint to fetch external images (e.g., Google profile pictures)"""
        from flask import request

        image_url = request.args.get("url")
        if not image_url:
            return jsonify({"success": False, "error": "No URL provided"}), 400

        # Only allow specific domains for security
        allowed_domains = [
            "lh3.googleusercontent.com",
            "googleusercontent.com",
            "avatars.githubusercontent.com",
            "githubusercontent.com",
        ]

        # Check if the URL is from an allowed domain
        from urllib.parse import urlparse

        parsed_url = urlparse(image_url)
        if not any(domain in parsed_url.netloc for domain in allowed_domains):
            return jsonify({"success": False, "error": "Domain not allowed"}), 403

        try:
            # Fetch the image
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()

            # Return the image with appropriate headers
            return Response(
                response.content,
                mimetype=response.headers.get("Content-Type", "image/jpeg"),
                headers={
                    "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
                    "Access-Control-Allow-Origin": "*",
                },
            )
        except requests.exceptions.RequestException as e:
            return (
                jsonify(
                    {"success": False, "error": f"Failed to fetch image: {str(e)}"}
                ),
                500,
            )

    return user_bp
