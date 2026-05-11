import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import {
  useParams,
  useNavigate,
} from 'react-router-dom';

import { studentAPI } from '../../api/apiClient';

import './Student.css';

const QuizTaker = () => {

  const { quizId } = useParams();

  const navigate = useNavigate();

  // ───────────────────────────────────────────────────────────
  // State
  // ───────────────────────────────────────────────────────────

  const [quiz, setQuiz] = useState(null);

  const [answers, setAnswers] = useState({});

  const [timeLeft, setTimeLeft] = useState(null);

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  const [currentQ, setCurrentQ] = useState(0);

  // Anti-cheat
  const [warnings, setWarnings] =
    useState(0);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const MAX_WARNINGS = 3;

  // ───────────────────────────────────────────────────────────
  // Refs
  // ───────────────────────────────────────────────────────────

  const hasSubmitted = useRef(false);

  // ───────────────────────────────────────────────────────────
  // Fullscreen
  // ───────────────────────────────────────────────────────────

  const enterFullscreen = async () => {

    try {

      if (
        document.documentElement
          .requestFullscreen
      ) {

        await document.documentElement
          .requestFullscreen();
      }

      setIsFullscreen(true);

    } catch (err) {

      console.error(
        'Fullscreen failed:',
        err
      );
    }
  };

  // ───────────────────────────────────────────────────────────
  // Load Quiz
  // ───────────────────────────────────────────────────────────

  useEffect(() => {

    const loadQuiz = async () => {

      try {

        const data =
          await studentAPI.getQuiz(
            quizId
          );

        setQuiz(data);

        // Persistent Timer
        const storageKey =
          `quiz_start_${quizId}`;

        let startTime =
          localStorage.getItem(
            storageKey
          );

        if (!startTime) {

          startTime = Date.now();

          localStorage.setItem(
            storageKey,
            startTime
          );
        }

        const elapsedSeconds =
          Math.floor(
            (
              Date.now() -
              parseInt(startTime)
            ) / 1000
          );

        const totalSeconds =
          data.time_limit_minutes * 60;

        const remainingSeconds =
          totalSeconds -
          elapsedSeconds;

        setTimeLeft(
          remainingSeconds > 0
            ? remainingSeconds
            : 0
        );

        // Enter fullscreen
        await enterFullscreen();

      } catch (err) {

        const msg =
          err.response?.data?.error ||
          'Failed to load quiz.';

        const attemptId =
          err.response?.data
            ?.attempt_id;

        if (attemptId) {

          navigate(
            `/student/results/${attemptId}`,
            {
              replace: true,
            }
          );

        } else {

          setError(msg);
        }

      } finally {

        setLoading(false);
      }
    };

    loadQuiz();

  }, [quizId, navigate]);

  // ───────────────────────────────────────────────────────────
  // Submit Quiz
  // ───────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (timedOut = false) => {

      if (
        hasSubmitted.current ||
        submitting
      ) {
        return;
      }

      hasSubmitted.current = true;

      setSubmitting(true);

      const answersPayload =
        Object.entries(answers).map(
          ([
            questionId,
            choiceId,
          ]) => ({
            question_id:
              parseInt(questionId),

            choice_id:
              choiceId,
          })
        );

      // Include unanswered
      if (quiz) {

        quiz.questions.forEach(
          (q) => {

            if (
              !(q.id in answers)
            ) {

              answersPayload.push({
                question_id:
                  q.id,

                choice_id:
                  null,
              });
            }
          }
        );
      }

      try {

        const result =
          await studentAPI.submitAttempt(
            quizId,
            {
              answers:
                answersPayload,

              timed_out:
                timedOut,
            }
          );

        // Clear timer storage
        localStorage.removeItem(
          `quiz_start_${quizId}`
        );

        navigate(
          `/student/results/${result.id}`,
          {
            replace: true,
          }
        );

      } catch (err) {

        const attemptId =
          err.response?.data
            ?.attempt_id;

        if (attemptId) {

          navigate(
            `/student/results/${attemptId}`,
            {
              replace: true,
            }
          );

        } else {

          setError(
            'Failed to submit quiz.'
          );

          hasSubmitted.current = false;

          setSubmitting(false);
        }
      }
    },
    [
      answers,
      quiz,
      quizId,
      navigate,
      submitting,
    ]
  );

  // ───────────────────────────────────────────────────────────
  // Timer
  // ───────────────────────────────────────────────────────────

  useEffect(() => {

    if (
      timeLeft === null ||
      !quiz
    ) {
      return;
    }

    if (timeLeft <= 0) {

      handleSubmit(true);

      return;
    }

    const interval =
      setInterval(() => {

        setTimeLeft((prev) => {

          if (prev <= 1) {

            clearInterval(
              interval
            );

            return 0;
          }

          return prev - 1;
        });

      }, 1000);

    return () =>
      clearInterval(interval);

  }, [
    timeLeft,
    quiz,
    handleSubmit,
  ]);

  // ───────────────────────────────────────────────────────────
  // Anti Cheat
  // ───────────────────────────────────────────────────────────

  useEffect(() => {

    if (!quiz) return;

    const handleViolation = (
      reason
    ) => {

      setWarnings((prev) => {

        const next = prev + 1;

        alert(
          `Warning ${next}/${MAX_WARNINGS}\n\nReason: ${reason}`
        );

        if (
          next >= MAX_WARNINGS
        ) {

          alert(
            'Maximum warnings reached. Quiz will be auto-submitted.'
          );

          handleSubmit(true);
        }

        return next;
      });
    };

    // Tab switching
    const handleVisibilityChange =
      () => {

        if (
          document.hidden
        ) {

          handleViolation(
            'Tab switching detected'
          );
        }
      };

    // Copy
    const preventCopy = (
      e
    ) => {

      e.preventDefault();

      handleViolation(
        'Copy attempt detected'
      );
    };

    // Paste
    const preventPaste = (
      e
    ) => {

      e.preventDefault();

      handleViolation(
        'Paste attempt detected'
      );
    };

    // Right click
    const preventContextMenu =
      (e) => {

        e.preventDefault();
      };

    // Fullscreen exit
    const handleFullscreenChange =
      () => {

        const fullscreenActive =
          !!document.fullscreenElement;

        setIsFullscreen(
          fullscreenActive
        );

        if (
          !fullscreenActive &&
          hasSubmitted.current === false
        ) {

          handleViolation(
            'Exited fullscreen mode'
          );
        }
      };

    // Listeners
    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    document.addEventListener(
      'copy',
      preventCopy
    );

    document.addEventListener(
      'paste',
      preventPaste
    );

    document.addEventListener(
      'contextmenu',
      preventContextMenu
    );

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    // Cleanup
    return () => {

      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );

      document.removeEventListener(
        'copy',
        preventCopy
      );

      document.removeEventListener(
        'paste',
        preventPaste
      );

      document.removeEventListener(
        'contextmenu',
        preventContextMenu
      );

      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );
    };

  }, [quiz, handleSubmit]);

  // ───────────────────────────────────────────────────────────
  // Prevent Refresh / Close
  // ───────────────────────────────────────────────────────────

  useEffect(() => {

    const handleBeforeUnload =
      (e) => {

        if (
          !hasSubmitted.current
        ) {

          e.preventDefault();

          e.returnValue =
            'Your quiz progress may be lost.';
        }
      };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );

    return () => {

      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
    };

  }, []);

  // ───────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────

  const selectAnswer = (
    questionId,
    choiceId
  ) => {

    setAnswers((prev) => ({
      ...prev,
      [questionId]:
        choiceId,
    }));
  };

  const formatTime = (
    seconds
  ) => {

    const m = Math.floor(
      seconds / 60
    );

    const s = seconds % 60;

    return `${String(m).padStart(
      2,
      '0'
    )}:${String(s).padStart(
      2,
      '0'
    )}`;
  };

  const answeredCount =
    Object.keys(answers).length;

  const totalCount =
    quiz?.questions.length || 0;

  const progressPct =
    totalCount > 0
      ? (
          answeredCount /
          totalCount
        ) * 100
      : 0;

  const isLowTime =
    timeLeft !== null &&
    timeLeft <= 60;

  const isCriticalTime =
    timeLeft !== null &&
    timeLeft <= 30;

  // ───────────────────────────────────────────────────────────
  // Render States
  // ───────────────────────────────────────────────────────────

  if (loading) {

    return (
      <div className="page-loading">
        Loading quiz...
      </div>
    );
  }

  if (error) {

    return (
      <div className="page-container">
        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion =
    quiz.questions[currentQ];

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────

  return (
    <div className="quiz-taker-page">

      {/* Header */}
      <div className="quiz-taker-header">

        <div className="quiz-taker-title">

          <h2>
            {quiz.title}
          </h2>

          <span className="quiz-progress-text">
            {answeredCount}/
            {totalCount} answered
          </span>

        </div>

        <div
          className={`timer-display ${
            isLowTime
              ? 'timer-warn'
              : ''
          } ${
            isCriticalTime
              ? 'timer-critical'
              : ''
          }`}
        >

          <span className="timer-icon">
            ⏱
          </span>

          <span className="timer-value">
            {timeLeft !== null
              ? formatTime(
                  timeLeft
                )
              : '--:--'}
          </span>

        </div>

      </div>

      {/* Progress */}
      <div className="progress-bar-track">

        <div
          className="progress-bar-fill"
          style={{
            width:
              `${progressPct}%`,
          }}
        />

      </div>

      {/* Security Banner */}
      <div className="security-banner">

        <div>
          Warnings:
          {' '}
          {warnings}/
          {MAX_WARNINGS}
        </div>

        <div>
          {isFullscreen
            ? '🟢 Fullscreen Active'
            : '🔴 Fullscreen Disabled'}
        </div>

      </div>

      {/* Main */}
      <div className="quiz-taker-body">

        {/* Sidebar */}
        <aside className="question-nav">

          <p className="nav-label">
            Questions
          </p>

          <div className="nav-grid">

            {quiz.questions.map(
              (q, i) => (

                <button
                  key={q.id}

                  onClick={() =>
                    setCurrentQ(i)
                  }

                  className={`nav-btn ${
                    i === currentQ
                      ? 'nav-btn-active'
                      : ''
                  } ${
                    answers[q.id]
                      ? 'nav-btn-answered'
                      : ''
                  }`}
                >
                  {i + 1}
                </button>
              )
            )}

          </div>

        </aside>

        {/* Question */}
        <main className="question-panel">

          <div className="question-number">

            Question
            {' '}
            {currentQ + 1}
            {' '}
            of
            {' '}
            {totalCount}

          </div>

          <p className="question-text">
            {currentQuestion.text}
          </p>

          <div className="choices-grid">

            {currentQuestion.choices.map(
              (choice) => {

                const isSelected =
                  answers[
                    currentQuestion.id
                  ] === choice.id;

                return (

                  <button
                    key={choice.id}

                    className={`choice-option ${
                      isSelected
                        ? 'selected'
                        : ''
                    }`}

                    onClick={() =>
                      selectAnswer(
                        currentQuestion.id,
                        choice.id
                      )
                    }

                    disabled={submitting}
                  >

                    <span
                      className={`choice-indicator ${
                        isSelected
                          ? 'selected'
                          : ''
                      }`}
                    >
                      {isSelected
                        ? '●'
                        : '○'}
                    </span>

                    {choice.text}

                  </button>
                );
              }
            )}

          </div>

          {/* Actions */}
          <div className="question-actions">

            <button
              onClick={() =>
                setCurrentQ((i) =>
                  Math.max(
                    0,
                    i - 1
                  )
                )
              }

              disabled={
                currentQ === 0 ||
                submitting
              }

              className="btn-nav"
            >
              ← Prev
            </button>

            {currentQ <
            totalCount - 1 ? (

              <button
                onClick={() =>
                  setCurrentQ(
                    (i) => i + 1
                  )
                }

                className="btn-nav btn-nav-next"

                disabled={submitting}
              >
                Next →
              </button>

            ) : (

              <button
                onClick={() =>
                  handleSubmit(
                    false
                  )
                }

                className="btn-submit-quiz"

                disabled={submitting}
              >
                {submitting
                  ? 'Submitting...'
                  : '✅ Submit Quiz'}
              </button>
            )}

          </div>

        </main>

      </div>

    </div>
  );
};

export default QuizTaker;