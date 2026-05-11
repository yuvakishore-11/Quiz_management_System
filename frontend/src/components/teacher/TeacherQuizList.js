import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherAPI } from '../../api/apiClient';
import './Teacher.css';

const TeacherQuizList = () => {

  const [quizzes, setQuizzes] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [filterStatus, setFilterStatus] =
    useState('all');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [actionLoading, setActionLoading] =
    useState(null);

  useEffect(() => {
    loadQuizzes();
  }, []);

  // ─────────────────────────────────────
  // Load Quizzes
  // ─────────────────────────────────────

  const loadQuizzes = async () => {

    try {

      const data =
        await teacherAPI.getQuizzes();

      setQuizzes(data);

    } catch {

      setError(
        'Failed to load quizzes.'
      );

    } finally {

      setLoading(false);
    }
  };

  // ─────────────────────────────────────
  // Toggle Publish
  // ─────────────────────────────────────

  const handleTogglePublish = async (
    quiz
  ) => {

    setActionLoading(quiz.id);

    try {

      const updated =
        await teacherAPI.togglePublish(
          quiz.id
        );

      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === quiz.id
            ? {
                ...q,
                is_published:
                  updated.is_published,
              }
            : q
        )
      );

    } catch {

      setError(
        'Failed to toggle publish status.'
      );

    } finally {

      setActionLoading(null);
    }
  };

  // ─────────────────────────────────────
  // Delete Quiz
  // ─────────────────────────────────────

  const handleDelete = async (
    quiz
  ) => {

    const confirmed =
      window.confirm(
        `Delete "${quiz.title}"? This cannot be undone.`
      );

    if (!confirmed) return;

    setActionLoading(quiz.id);

    try {

      await teacherAPI.deleteQuiz(
        quiz.id
      );

      setQuizzes((prev) =>
        prev.filter(
          (q) => q.id !== quiz.id
        )
      );

    } catch {

      setError(
        'Failed to delete quiz.'
      );

    } finally {

      setActionLoading(null);
    }
  };

  // ─────────────────────────────────────
  // Search + Filter Logic
  // ─────────────────────────────────────

  const filteredQuizzes =
    quizzes.filter((quiz) => {

      const matchesSearch =
        quiz.title
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      const matchesFilter =
        filterStatus === 'all'
          ? true
          : filterStatus === 'published'
          ? quiz.is_published
          : !quiz.is_published;

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  // ─────────────────────────────────────
  // Loading
  // ─────────────────────────────────────

  if (loading) {
    return (
      <div className="page-loading">
        Loading quizzes...
      </div>
    );
  }

  return (

    <div className="page-container">

      {/* Header */}

      <div className="page-header">

        <div>

          <h1>
            My Quizzes
          </h1>

          <p className="page-subtitle">
            {quizzes.length}
            {' '}
            quiz
            {quizzes.length !== 1
              ? 'zes'
              : ''}
            {' '}
            total
          </p>

        </div>

        <Link
          to="/teacher/quizzes/create"
          className="btn-primary"
        >
          + Create Quiz
        </Link>

      </div>

      {/* Search + Filter */}

      <div className="quiz-controls">

        <input
          type="text"
          placeholder="Search quizzes..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(
              e.target.value
            )
          }
          className="quiz-search"
        />

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(
              e.target.value
            )
          }
          className="quiz-filter"
        >

          <option value="all">
            All
          </option>

          <option value="published">
            Published
          </option>

          <option value="draft">
            Draft
          </option>

        </select>

      </div>

      {/* Error */}

      {error && (

        <div className="alert alert-error">
          {error}
        </div>

      )}

      {/* Empty State */}

      {filteredQuizzes.length === 0 ? (

        <div className="empty-state">

          <span className="empty-icon">
            📋
          </span>

          <p>
            No quizzes found.
          </p>

        </div>

      ) : (

        <div className="quiz-list">

          {filteredQuizzes.map(
            (quiz) => (

              <div
                key={quiz.id}
                className={`quiz-card ${
                  actionLoading === quiz.id
                    ? 'loading'
                    : ''
                }`}
              >

                {/* Quiz Info */}

                <div className="quiz-card-info">

                  <h3>
                    {quiz.title}
                  </h3>

                  {quiz.description && (

                    <p className="quiz-desc">
                      {quiz.description}
                    </p>

                  )}

                  <div className="quiz-meta">

                    <span>
                      ❓
                      {' '}
                      {quiz.question_count}
                      {' '}
                      questions
                    </span>

                    <span>·</span>

                    <span>
                      ⏱
                      {' '}
                      {quiz.time_limit_minutes}
                      {' '}
                      min
                    </span>

                    <span>·</span>

                    <span
                      className={`status-badge ${
                        quiz.is_published
                          ? 'published'
                          : 'draft'
                      }`}
                    >

                      {quiz.is_published
                        ? '🌐 Published'
                        : '📝 Draft'}

                    </span>

                  </div>

                </div>

                {/* Actions */}

                <div className="quiz-card-actions">

                  <Link
                    to={`/teacher/quizzes/${quiz.id}/results`}
                    className="btn-secondary-sm"
                  >
                    📊 Results
                  </Link>

                  <Link
                    to={`/teacher/quizzes/${quiz.id}/edit`}
                    className="btn-secondary-sm"
                  >
                    ✏️ Edit
                  </Link>

                  <button
                    onClick={() =>
                      handleTogglePublish(
                        quiz
                      )
                    }
                    disabled={
                      actionLoading === quiz.id
                    }
                    className={`btn-secondary-sm ${
                      quiz.is_published
                        ? 'btn-warn'
                        : 'btn-success'
                    }`}
                  >

                    {quiz.is_published
                      ? '🔒 Unpublish'
                      : '🌐 Publish'}

                  </button>

                  <button
                    onClick={() =>
                      handleDelete(quiz)
                    }
                    disabled={
                      actionLoading === quiz.id
                    }
                    className="btn-danger-sm"
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
};

export default TeacherQuizList;