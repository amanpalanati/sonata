# filepath: c:\Users\luisf\OneDrive\Desktop\Sonata\music-teacher-app\backend\app.py
from flask import Flask, session, request, jsonify
from services.teachers_service import TeachersService
# ...existing code...
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")
print("DEBUG SUPABASE_URL =", os.environ.get("SUPABASE_URL"))

from flask import Flask, session, request
from flask_session import Session
from flask_cors import CORS
from config import Config

# Import services
from services import AuthService, UserService, PasswordService, StorageService

# Import route factories
from routes import create_auth_routes, create_user_routes, create_password_routes

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

# Initialize session
Session(app)

# Initialize services
storage_service = StorageService(
    app.config["SUPABASE_URL"],
    app.config["SUPABASE_KEY"],
    app.config.get("SUPABASE_SERVICE_ROLE_KEY"),
)

auth_service = AuthService(
    app.config["SUPABASE_URL"],
    app.config["SUPABASE_KEY"],
    app.config.get("SUPABASE_SERVICE_ROLE_KEY"),
)

user_service = UserService(
    app.config["SUPABASE_URL"],
    app.config["SUPABASE_KEY"],
    app.config.get("SUPABASE_SERVICE_ROLE_KEY"),
    storage_service,  # Inject storage service
)

# Inject user_service into auth_service after both are created
auth_service.user_service = user_service

password_service = PasswordService(
    app.config["SUPABASE_URL"],
    app.config["SUPABASE_KEY"],
    app.config.get("SUPABASE_SERVICE_ROLE_KEY"),
    user_service,
)
# filepath: c:\Users\luisf\OneDrive\Desktop\Sonata\music-teacher-app\backend\app.py
teachers_service = TeachersService(
    app.config["SUPABASE_URL"],
    app.config["SUPABASE_KEY"],
    app.config.get("SUPABASE_SERVICE_ROLE_KEY"),
)
# ...existing code...


# Resets session lifetime only for authenticated users who are actively using the app
@app.before_request
def refresh_session():
    # Only refresh if this is not a logout request and user is authenticated
    if "user_id" in session and request.endpoint != "api_logout":
        session.permanent = True


# Register blueprints with dependency injection
auth_blueprint = create_auth_routes(auth_service, user_service)
user_blueprint = create_user_routes(
    user_service, storage_service
)  # Pass storage service
password_blueprint = create_password_routes(password_service)

app.register_blueprint(auth_blueprint)
app.register_blueprint(user_blueprint)
app.register_blueprint(password_blueprint)

# filepath: c:\Users\luisf\OneDrive\Desktop\Sonata\music-teacher-app\backend\app.py
@app.get("/api/teachers")
def list_teachers():
    try:
        q = request.args.get("q")
        teachers = teachers_service.list_teachers(q=q)
        return jsonify(teachers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ...existing code...
if __name__ == "__main__":
    app.run(debug=True)
