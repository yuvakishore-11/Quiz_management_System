from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


from .models import Quiz, Question, Choice, Attempt, Answer
from .permissions import IsTeacher, IsStudent, IsQuizOwner
from .serializers import (
    QuizListSerializer, QuizDetailSerializer, QuizPublicSerializer,
    AttemptSubmitSerializer, AttemptResultSerializer, AttemptSummarySerializer,
)


# ─── Teacher: Quiz CRUD ───────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsTeacher])
def teacher_quiz_list_create(request):
    """
    GET  /api/quizzes/teacher/  → list all quizzes owned by the teacher
    POST /api/quizzes/teacher/  → create a new quiz
    """
    if request.method == 'GET':
        quizzes = Quiz.objects.filter(teacher=request.user)
        serializer = QuizListSerializer(quizzes, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = QuizDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(teacher=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsTeacher])
def teacher_quiz_detail(request, quiz_id):
    """
    GET    /api/quizzes/teacher/<id>/  → full quiz detail with questions
    PUT    /api/quizzes/teacher/<id>/  → full update (replaces questions)
    PATCH  /api/quizzes/teacher/<id>/  → partial update (metadata only)
    DELETE /api/quizzes/teacher/<id>/  → delete quiz
    """
    try:
        quiz = Quiz.objects.get(pk=quiz_id)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Ownership check
    if quiz.teacher != request.user:
        return Response({'error': 'You do not own this quiz.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = QuizDetailSerializer(quiz)
        return Response(serializer.data)

    elif request.method in ('PUT', 'PATCH'):
        partial = request.method == 'PATCH'
        serializer = QuizDetailSerializer(quiz, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        quiz.delete()
        return Response({'message': 'Quiz deleted.'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsTeacher])
def toggle_publish(request, quiz_id):
    """PATCH /api/quizzes/teacher/<id>/publish/ → toggle published state"""
    try:
        quiz = Quiz.objects.get(pk=quiz_id, teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

    quiz.is_published = not quiz.is_published
    quiz.save(update_fields=['is_published'])
    return Response({
        'id': quiz.id,
        'is_published': quiz.is_published,
        'message': f'Quiz {"published" if quiz.is_published else "unpublished"} successfully.'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def teacher_quiz_results(request, quiz_id):
    """GET /api/quizzes/teacher/<id>/results/ → view all student scores for a quiz"""
    try:
        quiz = Quiz.objects.get(pk=quiz_id, teacher=request.user)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

    attempts = Attempt.objects.filter(
        quiz=quiz,
        status__in=[Attempt.Status.SUBMITTED, Attempt.Status.TIMED_OUT]
    ).select_related('student')
    serializer = AttemptSummarySerializer(attempts, many=True)
    return Response({
        'quiz_title': quiz.title,
        'total_attempts': attempts.count(),
        'results': serializer.data,
    })


# ─── Student: Browse & Attempt Quizzes ───────────────────────────────────────

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_quiz_list(request):
    """GET /api/quizzes/published/ → list all published quizzes (all authenticated users)"""
    quizzes = Quiz.objects.filter(is_published=True)
    serializer = QuizListSerializer(quizzes, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStudent])
def student_quiz_detail(request, quiz_id):
    """GET /api/quizzes/published/<id>/ → full quiz (no correct answers exposed)"""
    try:
        quiz = Quiz.objects.get(pk=quiz_id, is_published=True)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found or not published.'}, status=status.HTTP_404_NOT_FOUND)

    # Check if student already attempted
    existing = Attempt.objects.filter(quiz=quiz, student=request.user).first()
    if existing and existing.status != Attempt.Status.IN_PROGRESS:
        return Response(
            {'error': 'You have already completed this quiz.', 'attempt_id': existing.id},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = QuizPublicSerializer(quiz)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsStudent])
def submit_attempt(request, quiz_id):
    """
    POST /api/quizzes/published/<id>/attempt/
    Body: { answers: [{question_id, choice_id}, ...], timed_out: bool }
    """
    try:
        quiz = Quiz.objects.get(pk=quiz_id, is_published=True)
    except Quiz.DoesNotExist:
        return Response({'error': 'Quiz not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Prevent re-attempting
    existing = Attempt.objects.filter(quiz=quiz, student=request.user).first()
    if existing and existing.status != Attempt.Status.IN_PROGRESS:
        return Response(
            {'error': 'You have already submitted this quiz.', 'attempt_id': existing.id},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = AttemptSubmitSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    timed_out = serializer.validated_data.get('timed_out', False)
    answers_data = serializer.validated_data['answers']

    # Get or create in-progress attempt
    attempt, _ = Attempt.objects.get_or_create(
        quiz=quiz,
        student=request.user,
        defaults={'status': Attempt.Status.IN_PROGRESS}
    )

    # Save answers
    attempt.answers.all().delete()
    for answer_data in answers_data:
        question_id = answer_data['question_id']
        choice_id = answer_data.get('choice_id')

        try:
            question = Question.objects.get(pk=question_id, quiz=quiz)
        except Question.DoesNotExist:
            continue

        choice = None
        if choice_id:
            try:
                choice = Choice.objects.get(pk=choice_id, question=question)
            except Choice.DoesNotExist:
                pass

        Answer.objects.create(attempt=attempt, question=question, selected_choice=choice)

    # Calculate score and finalize
    attempt.calculate_score()
    attempt.status = Attempt.Status.TIMED_OUT if timed_out else Attempt.Status.SUBMITTED
    attempt.submitted_at = timezone.now()
    attempt.save()

    result_serializer = AttemptResultSerializer(attempt)
    return Response(result_serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStudent])
def student_my_results(request):
    """GET /api/quizzes/my-results/ → student sees all their own attempt results"""
    attempts = Attempt.objects.filter(
        student=request.user,
        status__in=[Attempt.Status.SUBMITTED, Attempt.Status.TIMED_OUT]
    ).select_related('quiz', 'student')
    serializer = AttemptSummarySerializer(attempts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStudent])
def student_attempt_detail(request, attempt_id):
    """GET /api/quizzes/my-results/<attempt_id>/ → full result with answer breakdown"""
    try:
        attempt = Attempt.objects.get(pk=attempt_id, student=request.user)
    except Attempt.DoesNotExist:
        return Response({'error': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AttemptResultSerializer(attempt)
    return Response(serializer.data)

class TeacherAnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def get(self, request):
        if request.user.role != 'teacher':
            return Response(
                {"error": "Only teachers can access analytics"},
                status=403
            )

        quizzes = Quiz.objects.filter(
            teacher=request.user
        )

        total_quizzes = quizzes.count()

        published_quizzes = quizzes.filter(
            is_published=True
        ).count()

        draft_quizzes = quizzes.filter(
            is_published=False
        ).count()

        attempts = Attempt.objects.filter(
            quiz__teacher=request.user
        )

        total_attempts = attempts.count()

        average_score = attempts.aggregate(
            avg=Avg('score')
        )['avg'] or 0

        leaderboard = attempts.select_related(
            'student',
            'quiz'
        ).order_by(
            '-score'
        )[:5]

        leaderboard_data = [
            {
                "student": a.student.email,
                "quiz": a.quiz.title,
                "score": a.score,
            }
            for a in leaderboard
        ]

        return Response({
            "total_quizzes": total_quizzes,

            "published_quizzes": published_quizzes,

            "draft_quizzes": draft_quizzes,

            "total_attempts": total_attempts,

            "average_score": round(
                average_score,
                2
            ),

            "leaderboard": leaderboard_data,

            "recent_quizzes": [
                {
                    "id": q.id,
                    "title": q.title,
                    "published": q.is_published,
                    "questions": q.questions.count(),
                }
                for q in quizzes.order_by('-created_at')[:5]
            ]
        })