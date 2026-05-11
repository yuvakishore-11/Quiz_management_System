import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teacherAPI } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import './Teacher.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await teacherAPI.getQuizzes();
        setQuizzes(data);
      } catch {
        setError('Failed to load quizzes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const published = quizzes.filter((q) => q.is_published).length;
  const drafts = quizzes.filter((q) => !q.is_published).length;
  const totalQuestions = quizzes.reduce((acc, q) => acc + q.question_count, 0);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.first_name || 'Teacher'} 👋</h1>
          <p className="page-subtitle">Here's an overview of your quizzes</p>
        </div>
        <Link to="/teacher/quizzes/create" className="btn-primary">
          + Create Quiz
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{quizzes.length}</div>
          <div className="stat-label">Total Quizzes</div>
        </div>
        <div className="stat-card stat-published">
          <div className="stat-icon">🌐</div>
          <div className="stat-value">{published}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card stat-draft">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{drafts}</div>
          <div className="stat-label">Drafts</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❓</div>
          <div className="stat-value">{totalQuestions}</div>
          <div className="stat-label">Total Questions</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Recent Quizzes</h2>
        <Link to="/teacher/quizzes" className="link-secondary">View all →</Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎯</span>
          <p>No quizzes yet. Create your first one!</p>
          <Link to="/teacher/quizzes/create" className="btn-primary">Create Quiz</Link>
        </div>
      ) : (
        <div className="quiz-list">
          {quizzes.slice(0, 5).map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-info">
                <h3>{quiz.title}</h3>
                <div className="quiz-meta">
                  <span>{quiz.question_count} questions</span>
                  <span>·</span>
                  <span>{quiz.time_limit_minutes} min</span>
                  <span>·</span>
                  <span className={`status-badge ${quiz.is_published ? 'published' : 'draft'}`}>
                    {quiz.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="quiz-card-actions">
                <Link to={`/teacher/quizzes/${quiz.id}/results`} className="btn-secondary-sm">
                  📊 Results
                </Link>
                <Link to={`/teacher/quizzes/${quiz.id}/edit`} className="btn-secondary-sm">
                  ✏️ Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
