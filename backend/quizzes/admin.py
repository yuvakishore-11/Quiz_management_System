from django.contrib import admin
from .models import Quiz, Question, Choice, Attempt, Answer


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 4
    fields = ['text', 'is_correct', 'order']


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 1
    fields = ['text', 'order']
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'teacher', 'is_published', 'time_limit_minutes', 'question_count', 'created_at']
    list_filter = ['is_published', 'created_at']
    search_fields = ['title', 'teacher__email']
    inlines = [QuestionInline]
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['text', 'quiz', 'order']
    inlines = [ChoiceInline]


@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz', 'status', 'score', 'started_at', 'submitted_at']
    list_filter = ['status']
    readonly_fields = ['started_at', 'submitted_at']


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'selected_choice']
