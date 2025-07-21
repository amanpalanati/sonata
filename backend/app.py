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

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Initialize session
Session(app)

# Initialize user model
user_model = User(app.config["SUPABASE_URL"], app.config["SUPABASE_KEY"])


# Resets session lifetime
@app.before_request
def refresh_session():
    if "user_id" in session:
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
            return jsonify({"success": False, "error": "Invalid account type"}), 400

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
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"}), 200


@app.route("/api/user", methods=["GET"])
def api_get_user():
    """API endpoint to get current user data"""
    if "user_id" not in session:
        return jsonify({"success": False, "error": "Not authenticated"}), 401

    # Get fresh user data
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
        # Verify user still exists in database
        user_data = user_model.get_user(session["user_id"])
        if not user_data:
            # User no longer exists, clear session
            session.clear()
            return jsonify({"authenticated": False, "session_cleared": True}), 200

        return (
            jsonify(
                {
                    "authenticated": True,
                    "user_id": session["user_id"],
                    "user_email": session.get("user_email"),
                    "account_type": session.get("account_type"),
                    "first_name": session.get("first_name"),
                }
            ),
            200,
        )
    else:
        return jsonify({"authenticated": False}), 200


if __name__ == "__main__":
    app.run(debug=True)
