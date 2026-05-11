import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../api/apiClient';
import './Student.css';

const StudentQuizList = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentAPI.getPublishedQuizzes();
        setQuizzes(data);
      } catch {
        setError('Failed to load quizzes.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="page-loading">Loading quizzes...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Browse Quizzes</h1>
          <p className="page-subtitle">{quizzes.length} published quiz{quizzes.length !== 1 ? 'zes' : ''} available</p>
        </div>
        <Link to="/student/results" className="btn-secondary">📊 My Results</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎯</span>
          <p>No quizzes published yet. Check back soon!</p>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-browse-card">
              <div className="quiz-browse-icon">📝</div>
              <div className="quiz-browse-info">
                <h3>{quiz.title}</h3>
                {quiz.description && <p>{quiz.description}</p>}
                <div className="quiz-meta">
                  <span>by {quiz.teacher.full_name || quiz.teacher.email}</span>
                  <span>·</span>
                  <span>❓ {quiz.question_count} questions</span>
                  <span>·</span>
                  <span>⏱ {quiz.time_limit_minutes} min</span>
                </div>
              </div>
              <Link to={`/student/quizzes/${quiz.id}`} className="btn-primary btn-take">
                Take Quiz →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentQuizList;
