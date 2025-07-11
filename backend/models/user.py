from supabase import create_client, Client
import bcrypt
from typing import Optional, Dict, Any

class User:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
    def create_user(self, email: str, password: str, account_type: str, 
                   first_name: str, last_name: str) -> Dict[str, Any]:
        """Create a new user account"""
        try:
            # Hash the password
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

            # Insert the user into the database
            result = self.supabase.table('users').insert({
                'email': email.lower(),
                'password_hash': password_hash,
                'account_type': account_type,
                'first_name': first_name,
                'last_name': last_name
            }).execute()
            
            user_data = {k: v for k, v in result.data[0].items() if k != 'password_hash'}
            return {'success': True, 'user': user_data}
        except Exception as e:
            return {'success': False, 'error': str(e)}
        
    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Authenticate user login"""
        try:
            # Get user from database
            result = self.supabase.table('users').select('*').eq('email', email.lower()).execute()
            
            if not result.data:
                return {'success': False, 'error': 'User not found'}
            
            user = result.data[0]
            
            # Check password
            if bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                # Remove password hash from returned data
                user_data = {k: v for k, v in user.items() if k != 'password_hash'}
                return {'success': True, 'user': user_data}
            else:
                return {'success': False, 'error': 'Invalid password'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
        
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            if result.data:
                user = result.data[0]
                # Remove password hash from returned data
                return {k: v for k, v in user.items() if k != 'password_hash'}
            return None
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
        
    def email_exists(self, email: str) -> bool:
        """Check if email already exists"""
        try:
            result = self.supabase.table('users').select('email').eq('email', email.lower()).execute()
            return len(result.data) > 0
        except Exception as e:
            print(f"Error checking email: {e}")
            return False