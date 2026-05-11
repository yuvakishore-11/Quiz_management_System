import React, { useEffect, useState } from 'react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';

import { teacherAPI } from '../../api/apiClient';

import './TeacherAnalytics.css';

const COLORS = [
  '#4f46e5',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
];

const TeacherAnalytics = () => {

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────
  // Load Analytics
  // ─────────────────────────────────────────────
  useEffect(() => {

    const loadData = async () => {

      try {

        const analyticsData =
          await teacherAPI.getAnalytics();

        console.log(
          'Analytics Response:',
          analyticsData
        );

        setAnalytics(analyticsData);

      } catch (err) {

        console.error(
          'Analytics load error:',
          err
        );

      } finally {

        setLoading(false);
      }
    };

    loadData();

  }, []);

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loading) {

    return (
      <div className="analytics-loading">
        Loading analytics...
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // No Data
  // ─────────────────────────────────────────────
  if (!analytics) {

    return (
      <div className="analytics-loading">
        Failed to load analytics.
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Stats
  // ─────────────────────────────────────────────
  const totalQuizzes =
    analytics.total_quizzes || 0;

  const publishedQuizzes =
    analytics.published_quizzes || 0;

  const draftQuizzes =
    analytics.draft_quizzes || 0;

  const totalAttempts =
    analytics.total_attempts || 0;

  const avgMarks =
    analytics.average_score || 0;

  const leaderboard =
    analytics.leaderboard || [];

  const recentQuizzes =
    analytics.recent_quizzes || [];

  // ─────────────────────────────────────────────
  // Charts
  // ─────────────────────────────────────────────
  const quizChartData =
    recentQuizzes.map((quiz) => ({

      name:
        quiz.title.length > 12
          ? quiz.title.slice(0, 12) + '...'
          : quiz.title,

      questions:
        quiz.questions || 0,
    }));

  const pieData = [
    {
      name: 'Published',
      value: publishedQuizzes,
    },

    {
      name: 'Drafts',
      value: draftQuizzes,
    },
  ];

  return (

    <div className="analytics-page">

      {/* ───────────────────────────────────── */}
      {/* Header */}
      {/* ───────────────────────────────────── */}

      <div className="analytics-header">

        <h1>
          Teacher Analytics
        </h1>

        <p>
          Overview of quiz performance
          and platform activity
        </p>

      </div>

      {/* ───────────────────────────────────── */}
      {/* Stats Cards */}
      {/* ───────────────────────────────────── */}

      <div className="stats-grid">

        <div className="stat-card">
          <h3>Total Quizzes</h3>

          <p>{totalQuizzes}</p>
        </div>

        <div className="stat-card">
          <h3>Published</h3>

          <p>{publishedQuizzes}</p>
        </div>

        <div className="stat-card">
          <h3>Draft Quizzes</h3>

          <p>{draftQuizzes}</p>
        </div>

        <div className="stat-card">
          <h3>Average Marks</h3>

          <p>{avgMarks}</p>
        </div>

        <div className="stat-card">
          <h3>Total Attempts</h3>

          <p>{totalAttempts}</p>
        </div>

      </div>

      {/* ───────────────────────────────────── */}
      {/* Charts */}
      {/* ───────────────────────────────────── */}

      <div className="charts-grid">

        {/* Bar Chart */}

        <div className="chart-card">

          <h2>
            Quiz Questions Distribution
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <BarChart
              data={quizChartData}
            >

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="name" />

              <YAxis />

              <Tooltip />

              <Bar
                dataKey="questions"
                fill="#4f46e5"
                radius={[6, 6, 0, 0]}
              />

            </BarChart>

          </ResponsiveContainer>

        </div>

        {/* Pie Chart */}

        <div className="chart-card">

          <h2>
            Quiz Status
          </h2>

          <ResponsiveContainer
            width="100%"
            height={300}
          >

            <PieChart>

              <Pie
                data={pieData}

                dataKey="value"

                nameKey="name"

                cx="50%"

                cy="50%"

                outerRadius={100}

                label
              >

                {pieData.map(
                  (entry, index) => (

                    <Cell
                      key={index}

                      fill={
                        COLORS[
                          index %
                          COLORS.length
                        ]
                      }
                    />
                  )
                )}

              </Pie>

              <Tooltip />

            </PieChart>

          </ResponsiveContainer>

        </div>

      </div>

      {/* ───────────────────────────────────── */}
      {/* Leaderboard */}
      {/* ───────────────────────────────────── */}

      <div className="analytics-section">

        <h2>
          Top Performers
        </h2>

        <div className="leaderboard-list">

          {leaderboard.length === 0 ? (

            <div className="empty-state">
              No quiz attempts yet.
            </div>

          ) : (

            leaderboard.map(
              (item, index) => (

                <div
                  key={index}
                  className="leaderboard-item"
                >

                  <div>

                    <strong>
                      {item.student}
                    </strong>

                    <p>
                      {item.quiz}
                    </p>

                  </div>

                  <div className="leaderboard-score">
                    {item.score}
                  </div>

                </div>
              )
            )
          )}

        </div>

      </div>

      {/* ───────────────────────────────────── */}
      {/* Recent Quizzes */}
      {/* ───────────────────────────────────── */}

      <div className="analytics-section">

        <h2>
          Recent Quizzes
        </h2>

        <div className="recent-quizzes">

          {recentQuizzes.length === 0 ? (

            <div className="empty-state">
              No quizzes created yet.
            </div>

          ) : (

            recentQuizzes.map((quiz) => (

              <div
                key={quiz.id}
                className="recent-quiz-card"
              >

                <h4>
                  {quiz.title}
                </h4>

                <p>
                  Questions:
                  {' '}
                  {quiz.questions}
                </p>

                <span
                  className={
                    quiz.published
                      ? 'status published'
                      : 'status draft'
                  }
                >
                  {quiz.published
                    ? 'Published'
                    : 'Draft'}
                </span>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
};

export default TeacherAnalytics;