from rest_framework import serializers
from .models import Quiz, Question, Choice, Attempt, Answer
from users.serializers import UserSerializer


# ─── Choice Serializers ───────────────────────────────────────────────────────

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ['id', 'text', 'order', 'is_correct']


class ChoicePublicSerializer(serializers.ModelSerializer):
    """Choice serializer that hides correct answer — used for students taking a quiz."""
    class Meta:
        model = Choice
        fields = ['id', 'text', 'order']


# ─── Question Serializers ─────────────────────────────────────────────────────

class QuestionSerializer(serializers.ModelSerializer):
    """Full question with answers — for teachers."""
    choices = ChoiceSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'choices']

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for choice_data in choices_data:
            Choice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if choices_data is not None:
            instance.choices.all().delete()
            for choice_data in choices_data:
                Choice.objects.create(question=instance, **choice_data)

        return instance


class QuestionPublicSerializer(serializers.ModelSerializer):
    """Question serializer without correct answers — for students."""
    choices = ChoicePublicSerializer(many=True)

    class Meta:
        model = Question
        fields = ['id', 'text', 'order', 'choices']


# ─── Quiz Serializers ─────────────────────────────────────────────────────────

class QuizListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    teacher = UserSerializer(read_only=True)
    question_count = serializers.ReadOnlyField()

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'teacher', 'is_published',
                  'time_limit_minutes', 'question_count', 'created_at', 'updated_at']


class QuizDetailSerializer(serializers.ModelSerializer):
    """Full quiz with questions — for teachers editing/viewing."""
    teacher = UserSerializer(read_only=True)
    questions = QuestionSerializer(many=True)
    question_count = serializers.ReadOnlyField()

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'teacher', 'is_published',
                  'time_limit_minutes', 'question_count', 'questions', 'created_at', 'updated_at']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = Quiz.objects.create(**validated_data)
        for q_data in questions_data:
            choices_data = q_data.pop('choices', [])
            question = Question.objects.create(quiz=quiz, **q_data)
            for c_data in choices_data:
                Choice.objects.create(question=question, **c_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if questions_data is not None:
            instance.questions.all().delete()
            for q_data in questions_data:
                choices_data = q_data.pop('choices', [])
                question = Question.objects.create(quiz=instance, **q_data)
                for c_data in choices_data:
                    Choice.objects.create(question=question, **c_data)

        return instance


class QuizPublicSerializer(serializers.ModelSerializer):
    """Quiz with questions but no correct answers — for students."""
    teacher = UserSerializer(read_only=True)
    questions = QuestionPublicSerializer(many=True)
    question_count = serializers.ReadOnlyField()

    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'teacher', 'is_published',
                  'time_limit_minutes', 'question_count', 'questions', 'created_at']


# ─── Attempt Serializers ──────────────────────────────────────────────────────

class AnswerSubmitSerializer(serializers.Serializer):
    question_id = serializers.IntegerField()
    choice_id = serializers.IntegerField(allow_null=True)


class AttemptSubmitSerializer(serializers.Serializer):
    answers = AnswerSubmitSerializer(many=True)
    timed_out = serializers.BooleanField(default=False)


class AnswerResultSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.text')
    selected_choice_text = serializers.SerializerMethodField()
    correct_choice = serializers.SerializerMethodField()
    is_correct = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = ['question_text', 'selected_choice_text', 'correct_choice', 'is_correct']

    def get_selected_choice_text(self, obj):
        return obj.selected_choice.text if obj.selected_choice else None

    def get_correct_choice(self, obj):
        correct = obj.question.choices.filter(is_correct=True).first()
        return correct.text if correct else None

    def get_is_correct(self, obj):
        return obj.selected_choice and obj.selected_choice.is_correct


class AttemptResultSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    quiz_title = serializers.CharField(source='quiz.title')
    answers = AnswerResultSerializer(many=True)

    class Meta:
        model = Attempt
        fields = ['id', 'quiz_title', 'student', 'status', 'score',
                  'total_questions', 'correct_answers', 'started_at', 'submitted_at', 'answers']


class AttemptSummarySerializer(serializers.ModelSerializer):
    """Lightweight — used in teacher's student results view."""
    student = UserSerializer(read_only=True)
    quiz_title = serializers.CharField(source='quiz.title')

    class Meta:
        model = Attempt
        fields = ['id', 'quiz_title', 'student', 'status', 'score',
                  'total_questions', 'correct_answers', 'started_at', 'submitted_at']
