import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { studentAPI } from '../../api/apiClient';
import './Student.css';

// ── My Results List ───────────────────────────────────────────────────────────
export const StudentResultsList = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentAPI.getMyResults();
        setResults(data);
      } catch {
        setError('Failed to load results.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="page-loading">Loading results...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Results</h1>
          <p className="page-subtitle">{results.length} completed quiz{results.length !== 1 ? 'zes' : ''}</p>
        </div>
        <Link to="/student/quizzes" className="btn-secondary">Browse Quizzes</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {results.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏆</span>
          <p>No completed quizzes yet. Go take one!</p>
          <Link to="/student/quizzes" className="btn-primary">Browse Quizzes</Link>
        </div>
      ) : (
        <div className="results-list">
          {results.map((r) => (
            <Link key={r.id} to={`/student/results/${r.id}`} className="result-card">
              <div className="result-info">
                <h3>{r.quiz_title}</h3>
                <div className="quiz-meta">
                  <span>{r.correct_answers}/{r.total_questions} correct</span>
                  <span>·</span>
                  <span className={`status-badge ${r.status === 'submitted' ? 'published' : 'draft'}`}>
                    {r.status === 'timed_out' ? '⏰ Timed Out' : '✅ Submitted'}
                  </span>
                  <span>·</span>
                  <span>{r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}</span>
                </div>
              </div>
              <div className={`result-score-bubble ${getScoreClass(r.score)}`}>
                {r.score != null ? `${r.score}%` : '—'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Result Detail ─────────────────────────────────────────────────────────────
export const StudentResultDetail = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await studentAPI.getAttemptDetail(attemptId);
        setResult(data);
      } catch {
        setError('Failed to load result.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  if (loading) return <div className="page-loading">Loading result...</div>;
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!result) return null;

  const correctCount = result.answers.filter((a) => a.is_correct).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>{result.quiz_title}</h1>
          <p className="page-subtitle">
            Submitted {result.submitted_at ? new Date(result.submitted_at).toLocaleString() : '—'}
          </p>
        </div>
        <Link to="/student/results" className="btn-secondary">← All Results</Link>
      </div>

      {/* Score Summary */}
      <div className={`score-summary ${getScoreClass(result.score)}`}>
        <div className="score-big">{result.score != null ? `${result.score}%` : '—'}</div>
        <div className="score-detail">
          {correctCount} out of {result.total_questions} correct
        </div>
        {result.status === 'timed_out' && (
          <div className="score-timeout">⏰ Quiz was auto-submitted when time ran out</div>
        )}
      </div>

      {/* Answer Breakdown */}
      <h2 className="breakdown-title">Answer Breakdown</h2>
      <div className="answers-list">
        {result.answers.map((a, i) => (
          <div key={i} className={`answer-card ${a.is_correct ? 'correct' : 'incorrect'}`}>
            <div className="answer-header">
              <span className="answer-num">Q{i + 1}</span>
              <span className="answer-verdict">{a.is_correct ? '✅ Correct' : '❌ Incorrect'}</span>
            </div>
            <p className="answer-question">{a.question_text}</p>
            <div className="answer-choices">
              <div className="answer-row your-answer">
                <span className="answer-label">Your answer:</span>
                <span>{a.selected_choice_text || <em>Not answered</em>}</span>
              </div>
              {!a.is_correct && (
                <div className="answer-row correct-answer">
                  <span className="answer-label">Correct answer:</span>
                  <span>{a.correct_choice}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="result-footer">
        <Link to="/student/quizzes" className="btn-primary">Take Another Quiz</Link>
      </div>
    </div>
  );
};

const getScoreClass = (score) => {
  if (score == null) return '';
  if (score >= 80) return 'score-high';
  if (score >= 50) return 'score-mid';
  return 'score-low';
};
