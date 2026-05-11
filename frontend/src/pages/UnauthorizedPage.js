import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const { isAuthenticated, isTeacher } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = isTeacher ? '/teacher/dashboard' : '/student/quizzes';

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={styles.icon}>🚫</span>
        <h1 style={styles.title}>Access Denied</h1>
        <p style={styles.desc}>
          You don't have permission to view this page. It's restricted to a
          different user role.
        </p>
        <div style={styles.actions}>
          {isAuthenticated ? (
            <button style={styles.btnPrimary} onClick={() => navigate(dashboardPath)}>
              Go to my Dashboard
            </button>
          ) : (
            <Link to="/login" style={styles.btnPrimary}>
              Sign In
            </Link>
          )}
          <button style={styles.btnSecondary} onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 64px)',
    padding: '2rem',
    background: '#f8fafc',
  },
  card: {
    textAlign: 'center',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 16,
    padding: '3rem 2.5rem',
    maxWidth: 420,
    width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  },
  icon:  { fontSize: '3rem', display: 'block', marginBottom: '1rem' },
  title: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '0.75rem',
  },
  desc: {
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: '1.75rem',
    fontSize: '0.95rem',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  btnPrimary: {
    padding: '0.65rem 1.5rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    textAlign: 'center',
  },
  btnSecondary: {
    padding: '0.65rem 1.5rem',
    background: 'transparent',
    color: '#64748b',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    fontWeight: 500,
    cursor: 'pointer',
  },
};

export default UnauthorizedPage;
