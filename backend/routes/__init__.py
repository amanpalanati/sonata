from .auth import auth_bp, create_auth_routes
from .user import user_bp, create_user_routes
from .password import password_bp, create_password_routes

__all__ = [
    "auth_bp",
    "user_bp",
    "password_bp",
    "create_auth_routes",
    "create_user_routes",
    "create_password_routes",
]
