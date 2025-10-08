from typing import List, Dict, Any, Optional
from .base_service import SupabaseService

SAFE_FIELDS = "id,first_name,last_name,instruments,profile_image"


class TeacherService(SupabaseService):
    def list_teachers(self, q: Optional[str] = None) -> List[Dict[str, Any]]:
        supabase_client = self.admin_supabase or self.supabase
        query = (
            supabase_client.table("profiles")  # changed from "teachers" to "profiles"
            .select(SAFE_FIELDS)
            .eq("account_type", "teacher")
            .order("first_name", desc=False)
        )

        if q:
            data = query.execute().data or []
            qlow = q.lower()
            # Search in first_name, last_name, and instruments (joined as string)
            return [
                t
                for t in data
                if qlow
                in (
                    t["first_name"]
                    + " "
                    + t["last_name"]
                    + " "
                    + " ".join(t.get("instruments", []))
                ).lower()
            ]

        return query.execute().data or []
