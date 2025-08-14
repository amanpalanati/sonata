from flask import Blueprint, request, jsonify, session
from services.password_service import PasswordService

password_bp = Blueprint("password", __name__)


def create_password_routes(password_service: PasswordService):
    """Factory function to create password routes with dependency injection"""

    @password_bp.route("/api/forgot-password", methods=["POST"])
    def api_forgot_password():
        """API endpoint to initiate password reset via email"""
        try:
            data = request.get_json()

            # Validate required fields
            if not data or not data.get("email"):
                return jsonify({"success": False, "error": "Email is required"}), 400

            email = data["email"].lower().strip()

            # Initiate password reset (always returns success to prevent email enumeration)
            password_service.initiate_password_reset(email)

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "If an account with this email exists, a password reset link has been sent.",
                    }
                ),
                200,
            )

        except Exception as e:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "An unexpected error occurred. Please try again.",
                    }
                ),
                500,
            )

    @password_bp.route("/api/reset-password", methods=["POST"])
    def api_reset_password():
        """API endpoint for password reset using token from email"""
        try:
            data = request.get_json()

            # Validate required fields
            if not data or not data.get("newPassword") or not data.get("access_token"):
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Access token and new password are required",
                        }
                    ),
                    400,
                )

            access_token = data["access_token"]
            new_password = data["newPassword"]

            # Validate password length (basic validation)
            if len(new_password) < 8:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Password must be at least 8 characters long",
                        }
                    ),
                    400,
                )

            # Reset the password using the token
            result = password_service.reset_password_with_token(
                access_token, new_password
            )

            if result.get("success"):
                return (
                    jsonify(
                        {"success": True, "message": "Password updated successfully"}
                    ),
                    200,
                )
            else:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Invalid or expired reset link. Please request a new password reset.",
                        }
                    ),
                    400,
                )

        except Exception as e:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "An unexpected error occurred. Please try again.",
                    }
                ),
                500,
            )

    @password_bp.route("/api/change-password", methods=["POST"])
    def api_change_password():
        """API endpoint for changing password with current password verification"""
        try:
            # Check if user is authenticated
            if "user_id" not in session:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "You must be logged in to change your password",
                        }
                    ),
                    401,
                )

            data = request.get_json()

            # Validate required fields
            if not data or not all(
                key in data for key in ["currentPassword", "newPassword"]
            ):
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Current password and new password are required",
                        }
                    ),
                    400,
                )

            current_password = data["currentPassword"]
            new_password = data["newPassword"]
            user_id = session["user_id"]

            # Validate new password length (basic validation)
            if len(new_password) < 8:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "New password must be at least 8 characters long",
                        }
                    ),
                    400,
                )

            # Change the password (this will verify current password first)
            result = password_service.change_password(
                user_id, current_password, new_password
            )

            if result.get("success"):
                return (
                    jsonify(
                        {"success": True, "message": "Password changed successfully"}
                    ),
                    200,
                )
            else:
                error_type = result.get("error_type", "unknown")
                if error_type == "invalid_current_password":
                    return (
                        jsonify(
                            {"success": False, "error": "Current password is incorrect"}
                        ),
                        400,
                    )
                elif error_type == "same_password":
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": "New password must be different from current password",
                            }
                        ),
                        400,
                    )
                else:
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": result.get(
                                    "error", "Failed to change password"
                                ),
                            }
                        ),
                        400,
                    )

        except Exception as e:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "An unexpected error occurred. Please try again.",
                    }
                ),
                500,
            )

    return password_bp
