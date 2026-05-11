import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teacherAPI } from '../../api/apiClient';
import './Teacher.css';

const QuizResults = () => {
  const { quizId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const result = await teacherAPI.getResults(quizId);
        setData(result);
      } catch {
        setError('Failed to load results.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [quizId]);

  if (loading) return <div className="page-loading">Loading results...</div>;
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;

  const results = data?.results || [];
  const avg = results.length > 0
    ? (results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length).toFixed(1)
    : null;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Results: {data?.quiz_title}</h1>
          <p className="page-subtitle">{data?.total_attempts} student submission{data?.total_attempts !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/teacher/quizzes" className="btn-secondary">← Back to Quizzes</Link>
      </div>

      {avg !== null && (
        <div className="stats-grid stats-small">
          <div className="stat-card">
            <div className="stat-value">{data?.total_attempts}</div>
            <div className="stat-label">Total Attempts</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avg}%</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {results.filter((r) => (r.score || 0) >= 80).length}
            </div>
            <div className="stat-label">Scored ≥ 80%</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {results.filter((r) => r.status === 'timed_out').length}
            </div>
            <div className="stat-label">Timed Out</div>
          </div>
        </div>
      )}

      {results.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <p>No students have submitted this quiz yet.</p>
        </div>
      ) : (
        <div className="results-table-wrapper">
          <table className="results-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Score</th>
                <th>Correct / Total</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="student-name">{r.student.full_name || '—'}</td>
                  <td>{r.student.email}</td>
                  <td>
                    <span className={`score-badge ${getScoreClass(r.score)}`}>
                      {r.score != null ? `${r.score}%` : '—'}
                    </span>
                  </td>
                  <td>{r.correct_answers} / {r.total_questions}</td>
                  <td>
                    <span className={`status-badge ${r.status === 'submitted' ? 'published' : 'draft'}`}>
                      {r.status === 'timed_out' ? '⏰ Timed Out' : '✅ Submitted'}
                    </span>
                  </td>
                  <td className="time-cell">
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const getScoreClass = (score) => {
  if (score == null) return '';
  if (score >= 80) return 'score-high';
  if (score >= 50) return 'score-mid';
  return 'score-low';
};

export default QuizResults;
