from django.urls import path
from . import views

urlpatterns = [

    # ── Teacher endpoints ──────────────────────────────────────────────

    # IMPORTANT:
    # Keep analytics ABOVE <int:quiz_id> route
    # otherwise Django treats "analytics" as quiz_id

    path(
        'teacher/analytics/',
        views.TeacherAnalyticsView.as_view(),
        name='teacher-analytics'
    ),

    path(
        'teacher/',
        views.teacher_quiz_list_create,
        name='teacher-quiz-list-create'
    ),

    path(
        'teacher/<int:quiz_id>/',
        views.teacher_quiz_detail,
        name='teacher-quiz-detail'
    ),

    path(
        'teacher/<int:quiz_id>/publish/',
        views.toggle_publish,
        name='toggle-publish'
    ),

    path(
        'teacher/<int:quiz_id>/results/',
        views.teacher_quiz_results,
        name='teacher-quiz-results'
    ),

    # ── Student endpoints ──────────────────────────────────────────────

    path(
        'published/',
        views.student_quiz_list,
        name='student-quiz-list'
    ),

    path(
        'published/<int:quiz_id>/',
        views.student_quiz_detail,
        name='student-quiz-detail'
    ),

    path(
        'published/<int:quiz_id>/attempt/',
        views.submit_attempt,
        name='submit-attempt'
    ),

    path(
        'my-results/',
        views.student_my_results,
        name='student-my-results'
    ),

    path(
        'my-results/<int:attempt_id>/',
        views.student_attempt_detail,
        name='student-attempt-detail'
    ),
]