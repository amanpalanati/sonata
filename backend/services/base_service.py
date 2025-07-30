from supabase import create_client, Client
from typing import Optional


class SupabaseService:
    """Base service class for Supabase operations"""

    def __init__(
        self, supabase_url: str, supabase_key: str, service_role_key: str = None
    ):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        # Create admin client if service role key is provided
        if service_role_key:
            self.admin_supabase: Client = create_client(supabase_url, service_role_key)
        else:
            self.admin_supabase = None
