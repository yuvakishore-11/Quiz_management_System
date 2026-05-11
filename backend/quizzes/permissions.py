from rest_framework.permissions import BasePermission


class IsTeacher(BasePermission):
    """
    Allows access only to users with the 'teacher' role.
    """
    message = 'Only teachers can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'teacher'
        )


class IsStudent(BasePermission):
    """
    Allows access only to users with the 'student' role.
    """
    message = 'Only students can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )


class IsTeacherOrReadOnly(BasePermission):
    """
    Allows full access to teachers; read-only access to everyone else.
    """
    def has_permission(self, request, view):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and request.user.role == 'teacher'


class IsQuizOwner(BasePermission):
    """
    Object-level permission: only the teacher who owns the quiz can modify it.
    """
    message = 'You do not own this quiz.'

    def has_object_permission(self, request, view, obj):
        # obj is a Quiz instance
        return obj.teacher == request.user
