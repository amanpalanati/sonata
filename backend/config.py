import os
from dotenv import load_dotenv

load_dotenv()  # This loads variables from the .env file


class Config:
    SECRET_KEY = (
        os.environ.get("SECRET_KEY")
        or "06176fdef3d3f5280810e7b70eb87beeb44c432903be651031b9e1cc8d2ec48d"
    )
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    SESSION_TYPE = "filesystem"
    SESSION_PERMANENT = False
    SESSION_USE_SIGNER = True
    PERMANENT_SESSION_LIFETIME = 604800  # 7 days
