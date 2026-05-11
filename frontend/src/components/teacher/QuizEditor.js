import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherAPI } from '../../api/apiClient';
import './Teacher.css';

const emptyChoice = () => ({ text: '', is_correct: false, order: 0 });
const emptyQuestion = () => ({
  text: '',
  order: 0,
  choices: [emptyChoice(), emptyChoice(), emptyChoice(), emptyChoice()],
});

const QuizEditor = () => {
  const { quizId } = useParams();
  const isEdit = Boolean(quizId);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    time_limit_minutes: 10,
    is_published: false,
    questions: [emptyQuestion()],
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const data = await teacherAPI.getQuiz(quizId);
        setForm({
          title: data.title,
          description: data.description || '',
          time_limit_minutes: data.time_limit_minutes,
          is_published: data.is_published,
          questions: data.questions.length > 0 ? data.questions : [emptyQuestion()],
        });
      } catch {
        setError('Failed to load quiz.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, quizId]);

  // ── Field helpers ────────────────────────────────────────────────────────────

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const setQuestion = (qi, field, value) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[qi] = { ...questions[qi], [field]: value };
      return { ...prev, questions };
    });
  };

  const setChoice = (qi, ci, field, value) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      const choices = [...questions[qi].choices];
      choices[ci] = { ...choices[ci], [field]: value };

      // Only one correct choice per question
      if (field === 'is_correct' && value === true) {
        choices.forEach((c, i) => { if (i !== ci) choices[i] = { ...c, is_correct: false }; });
      }

      questions[qi] = { ...questions[qi], choices };
      return { ...prev, questions };
    });
  };

  const addQuestion = () => setForm((prev) => ({
    ...prev,
    questions: [...prev.questions, emptyQuestion()],
  }));

  const removeQuestion = (qi) => setForm((prev) => ({
    ...prev,
    questions: prev.questions.filter((_, i) => i !== qi),
  }));

  const addChoice = (qi) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[qi] = {
        ...questions[qi],
        choices: [...questions[qi].choices, emptyChoice()],
      };
      return { ...prev, questions };
    });
  };

  const removeChoice = (qi, ci) => {
    setForm((prev) => {
      const questions = [...prev.questions];
      questions[qi] = {
        ...questions[qi],
        choices: questions[qi].choices.filter((_, i) => i !== ci),
      };
      return { ...prev, questions };
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────────

  const validate = () => {
    if (!form.title.trim()) return 'Quiz title is required.';
    for (let qi = 0; qi < form.questions.length; qi++) {
      const q = form.questions[qi];
      if (!q.text.trim()) return `Question ${qi + 1} text is required.`;
      const choices = q.choices.filter((c) => c.text.trim());
      if (choices.length < 2) return `Question ${qi + 1} needs at least 2 choices.`;
      const hasCorrect = choices.some((c) => c.is_correct);
      if (!hasCorrect) return `Question ${qi + 1} needs at least one correct answer.`;
    }
    return null;
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Clean up payload — filter out empty choices, add order
    const payload = {
      ...form,
      questions: form.questions.map((q, qi) => ({
        ...q,
        order: qi + 1,
        choices: q.choices
          .filter((c) => c.text.trim())
          .map((c, ci) => ({ ...c, order: ci + 1 })),
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await teacherAPI.updateQuiz(quizId, payload);
        setSuccess('Quiz updated successfully!');
      } else {
        const created = await teacherAPI.createQuiz(payload);
        setSuccess('Quiz created! Redirecting...');
        setTimeout(() => navigate(`/teacher/quizzes/${created.id}/edit`), 1200);
      }
    } catch (err) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : 'Failed to save quiz.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-loading">Loading quiz...</div>;

  return (
    <div className="page-container page-container-wide">
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit Quiz' : 'Create New Quiz'}</h1>
          <p className="page-subtitle">
            {form.questions.length} question{form.questions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button form="quiz-form" type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving...' : isEdit ? '💾 Save Changes' : '✨ Create Quiz'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form id="quiz-form" onSubmit={handleSubmit}>
        {/* ── Quiz Metadata ─────────────────────────────────────────────────── */}
        <div className="editor-section">
          <h2 className="section-title">Quiz Details</h2>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g. Introduction to Python"
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Optional description for students"
              rows={2}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Time Limit (minutes)</label>
              <input
                type="number"
                min="1"
                max="180"
                value={form.time_limit_minutes}
                onChange={(e) => setField('time_limit_minutes', parseInt(e.target.value))}
              />
            </div>
            <div className="form-group form-group-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setField('is_published', e.target.checked)}
                />
                Publish immediately
              </label>
            </div>
          </div>
        </div>

        {/* ── Questions ─────────────────────────────────────────────────────── */}
        <div className="questions-section">
          {form.questions.map((question, qi) => (
            <div key={qi} className="question-card">
              <div className="question-header">
                <h3>Question {qi + 1}</h3>
                {form.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qi)}
                    className="btn-icon-danger"
                    title="Remove question"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  value={question.text}
                  onChange={(e) => setQuestion(qi, 'text', e.target.value)}
                  placeholder="Enter your question..."
                  rows={2}
                  required
                />
              </div>

              <div className="choices-list">
                <label className="choices-label">Answer Choices (select the correct one)</label>
                {question.choices.map((choice, ci) => (
                  <div key={ci} className={`choice-row ${choice.is_correct ? 'correct' : ''}`}>
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={choice.is_correct}
                      onChange={() => setChoice(qi, ci, 'is_correct', true)}
                      title="Mark as correct"
                    />
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(e) => setChoice(qi, ci, 'text', e.target.value)}
                      placeholder={`Choice ${ci + 1}`}
                      className="choice-input"
                    />
                    {question.choices.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeChoice(qi, ci)}
                        className="btn-icon-danger btn-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addChoice(qi)}
                  className="btn-add-choice"
                >
                  + Add Choice
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="btn-add-question">
            + Add Question
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizEditor;
