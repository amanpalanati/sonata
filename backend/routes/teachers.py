from flask import Blueprint, request, jsonify
from services.teacher_service import TeacherService

teachers_bp = Blueprint("teachers", __name__)


def create_teachers_routes(teacher_service: TeacherService):
    """Factory function to create teacher routes with dependency injection"""

    @teachers_bp.get("/api/teachers")
    def list_teachers():
        try:
            q = request.args.get("q")
            teachers = teacher_service.list_teachers(q=q)
            return jsonify(teachers), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return teachers_bp
