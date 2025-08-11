from typing import Dict, Any, Optional
from .base_service import SupabaseService
import uuid
import os
from datetime import datetime, timedelta


class StorageService(SupabaseService):
    """Service for handling file storage operations with Supabase Storage"""

    def __init__(self, supabase_url: str, supabase_key: str, service_role_key: str):
        """Initialize StorageService"""
        super().__init__(supabase_url, supabase_key, service_role_key)
        self.bucket_name = (
            "profile-images"  # Private bucket for profile images (pre-configured)
        )

    def upload_profile_image(
        self,
        user_id: str,
        file_content: bytes,
        file_name: str,
        content_type: str,
        old_image_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Upload a profile image to Supabase Storage

        Args:
            user_id: The user's ID
            file_content: The file content as bytes
            file_name: Original filename
            content_type: MIME type of the file
            old_image_path: Optional path to old image to delete after successful upload

        Returns:
            Dict with success status and file path or error message
        """
        try:
            # Generate unique filename to avoid conflicts
            file_extension = os.path.splitext(file_name)[1].lower()
            unique_filename = f"{user_id}/profile/{uuid.uuid4()}{file_extension}"

            # Upload file to private bucket
            result = self.admin_supabase.storage.from_(self.bucket_name).upload(
                path=unique_filename,
                file=file_content,
                file_options={"content-type": content_type},
            )

            if result:
                # If upload successful and we have an old image to delete, clean it up
                if (
                    old_image_path
                    and old_image_path != "__DEFAULT_IMAGE__"
                    and not old_image_path.startswith(("data:", "http"))
                ):
                    delete_result = self.delete_file(old_image_path)
                    # Silently handle cleanup - don't fail upload if cleanup fails

                return {
                    "success": True,
                    "file_path": unique_filename,
                    "message": "File uploaded successfully",
                }
            else:
                return {"success": False, "error": "Upload failed"}

        except Exception as e:
            return {"success": False, "error": f"Upload error: {str(e)}"}

    def get_signed_url(self, file_path: str, expires_in: int = 3600) -> Dict[str, Any]:
        """
        Generate a signed URL for accessing a private file

        Args:
            file_path: Path to the file in storage
            expires_in: URL expiration time in seconds (default 1 hour)

        Returns:
            Dict with success status and signed URL or error message
        """
        try:
            # Generate signed URL that expires in specified time
            result = self.admin_supabase.storage.from_(
                self.bucket_name
            ).create_signed_url(path=file_path, expires_in=expires_in)

            if result and "signedURL" in result:
                return {
                    "success": True,
                    "signed_url": result["signedURL"],
                    "expires_in": expires_in,
                }
            else:
                return {"success": False, "error": "Failed to generate signed URL"}

        except Exception as e:
            return {"success": False, "error": f"Signed URL error: {str(e)}"}

    def delete_file(self, file_path: str) -> Dict[str, Any]:
        """
        Delete a file from storage

        Args:
            file_path: Path to the file in storage

        Returns:
            Dict with success status and message
        """
        try:
            result = self.admin_supabase.storage.from_(self.bucket_name).remove(
                [file_path]
            )

            if result:
                return {"success": True, "message": "File deleted successfully"}
            else:
                return {"success": False, "error": "Failed to delete file"}

        except Exception as e:
            return {"success": False, "error": f"Delete error: {str(e)}"}

    def get_profile_image_url(
        self, user_id: str, stored_path: Optional[str]
    ) -> Optional[str]:
        """
        Get a signed URL for a user's profile image

        Args:
            user_id: The user's ID
            stored_path: The stored file path (from database)

        Returns:
            Signed URL string or None if no image or error
        """
        if not stored_path or stored_path == "__DEFAULT_IMAGE__":
            return None

        # Generate signed URL valid for 24 hours
        result = self.get_signed_url(stored_path, expires_in=86400)  # 24 hours

        if result["success"]:
            return result["signed_url"]
        else:
            # Silently handle errors - return None for missing images
            return None

    def cleanup_old_profile_images(self, user_id: str, current_path: str) -> bool:
        """
        Clean up old profile images for a user (except the current one)

        Args:
            user_id: The user's ID
            current_path: The current profile image path to keep

        Returns:
            True if cleanup was successful, False otherwise
        """
        try:
            # List all files in the user's profile folder
            user_folder = f"{user_id}/profile/"
            result = self.admin_supabase.storage.from_(self.bucket_name).list(
                user_folder
            )

            if result:
                files_to_delete = []
                for file_info in result:
                    file_path = f"{user_folder}{file_info['name']}"
                    if file_path != current_path:
                        files_to_delete.append(file_path)

                if files_to_delete:
                    delete_result = self.admin_supabase.storage.from_(
                        self.bucket_name
                    ).remove(files_to_delete)
                    # Silently handle cleanup results

            return True

        except Exception as e:
            # Silently handle cleanup errors
            return False
