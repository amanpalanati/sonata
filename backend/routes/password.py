from flask import Blueprint, request, jsonify
from services.password_service import PasswordService

password_bp = Blueprint('password', __name__)

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
            result = password_service.reset_password_with_token(access_token, new_password)

            if result.get("success"):
                return (
                    jsonify({"success": True, "message": "Password updated successfully"}),
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

    return password_bp
