from flask import (
    Flask,
    request,
    session,
    jsonify,
)
from flask_session import Session
from flask_cors import CORS
from config import Config
from models.user import User
import os
import time

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Initialize session
Session(app)

# Initialize user model
user_model = User(
    app.config["SUPABASE_URL"],
    app.config["SUPABASE_KEY"],
    app.config.get("SUPABASE_SERVICE_ROLE_KEY"),
)


# Resets session lifetime only for authenticated users who are actively using the app
@app.before_request
def refresh_session():
    # Only refresh if this is not a logout request and user is authenticated
    if "user_id" in session and request.endpoint != "api_logout":
        session.permanent = True


# API Routes for React Frontend


@app.route("/api/signup", methods=["POST"])
def api_signup():
    """API endpoint for user signup"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["email", "password", "accountType", "firstName", "lastName"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"success": False, "error": f"{field} is required"}), 400

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
        result = user_model.create_user(
            data["email"],
            data["password"],
            data["accountType"],
            data["firstName"],
            data["lastName"],
        )

        if result["success"]:
            # Log user in (set session)
            session["user_id"] = result["user"]["id"]
            session["user_email"] = result["user"]["email"]
            session["account_type"] = result["user"]["account_type"]
            session["first_name"] = result["user"]["first_name"]
            session["last_name"] = result["user"]["last_name"]
            session["user_verified_at"] = time.time()  # Mark as recently verified
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


@app.route("/api/login", methods=["POST"])
def api_login():
    """API endpoint for user login"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get("email") or not data.get("password"):
            return (
                jsonify({"success": False, "error": "Email and password are required"}),
                400,
            )

        # Authenticate user
        result = user_model.authenticate_user(data["email"], data["password"])

        if result["success"]:
            # Log user in (set session)
            user = result["user"]
            session["user_id"] = user["id"]
            session["user_email"] = user["email"]
            session["account_type"] = user["account_type"]
            session["first_name"] = user["first_name"]
            session["last_name"] = user["last_name"]
            session["user_verified_at"] = time.time()  # Mark as recently verified
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


@app.route("/api/logout", methods=["POST"])
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


@app.route("/api/user", methods=["GET"])
def api_get_user():
    """API endpoint to get current user data"""
    if "user_id" not in session:
        return jsonify({"success": False, "error": "Not authenticated"}), 401

    # Verify user still exists in Supabase
    user_data = user_model.get_user(session["user_id"])
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


@app.route("/api/check-auth", methods=["GET"])
def api_check_auth():
    """API endpoint to check if user is authenticated"""
    if "user_id" in session:
        # Only verify user exists in database if we haven't checked recently
        # Check if we have cached user verification (expires after 5 minutes)
        last_verified = session.get("user_verified_at", 0)
        current_time = time.time()

        if current_time - last_verified > 300:  # 5 minutes
            # Verify user still exists in Supabase
            user_data = user_model.get_user(session["user_id"])
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


@app.route("/api/oauth-callback", methods=["POST"])
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
        user_data = user_model.get_oauth_user(
            data["user_id"], data.get("user_metadata", {})
        )

        if not user_data:
            # Delete the incomplete user account
            user_model.delete_user(data["user_id"])
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
            # Delete the incomplete user account
            delete_success = user_model.delete_user(data["user_id"])
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
            success = user_model.update_user_metadata(user_data["id"], metadata_to_save)

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
        # If there's any error, try to delete the potentially incomplete account
        try:
            if data and data.get("user_id"):
                user_model.delete_user(data["user_id"])
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


if __name__ == "__main__":
    app.run(debug=True)
