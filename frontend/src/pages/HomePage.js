import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * HomePage
 *
 * - If the user is already logged in, redirect them straight to their
 *   role-appropriate dashboard instead of showing the landing page.
 * - If they are not logged in, show a simple marketing landing page with
 *   sign-up / sign-in CTAs.
 */
const HomePage = () => {
  const { isAuthenticated, isTeacher, loading } = useAuth();

  // While the auth state is being hydrated from localStorage, show nothing
  // (ProtectedRoute already handles a full-page spinner; here a blank flash
  // is preferable to a redirect race condition).
  if (loading) return null;

  if (isAuthenticated) {
    return isTeacher
      ? <Navigate to="/teacher/dashboard" replace />
      : <Navigate to="/student/quizzes" replace />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <span style={styles.logo}>⚡</span>
        <h1 style={styles.title}>QuizForge</h1>
        <p style={styles.subtitle}>
          Create, publish, and take quizzes — built for teachers and students.
        </p>
        <div style={styles.cta}>
          <Link to="/register" style={styles.btnPrimary}>Get Started Free</Link>
          <Link to="/login" style={styles.btnSecondary}>Sign In</Link>
        </div>
      </div>

      <div style={styles.features}>
        {FEATURES.map((f) => (
          <div key={f.title} style={styles.featureCard}>
            <span style={styles.featureIcon}>{f.icon}</span>
            <h3 style={styles.featureTitle}>{f.title}</h3>
            <p style={styles.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const FEATURES = [
  { icon: '📝', title: 'Easy Quiz Builder', desc: 'Create multi-question quizzes with multiple-choice answers and a live preview.' },
  { icon: '⏱',  title: 'Timed Exams',      desc: 'Set per-quiz time limits. Students are auto-submitted if the clock hits zero.' },
  { icon: '📊', title: 'Instant Results',   desc: 'Teachers see per-student scores; students see a full answer breakdown.' },
  { icon: '🔒', title: 'Role-Based Access', desc: 'Strict teacher/student separation — no student can ever see correct answers before submitting.' },
];

const styles = {
  page: {
    maxWidth: 960,
    margin: '0 auto',
    padding: '3rem 1.5rem',
  },
  hero: {
    textAlign: 'center',
    padding: '4rem 1rem',
  },
  logo: {
    fontSize: '3.5rem',
    display: 'block',
    marginBottom: '1rem',
  },
  title: {
    fontFamily: "'Sora', sans-serif",
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 800,
    color: '#0f172a',
    marginBottom: '1rem',
  },
  subtitle: {
    fontSize: '1.15rem',
    color: '#64748b',
    maxWidth: 480,
    margin: '0 auto 2rem',
    lineHeight: 1.6,
  },
  cta: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    padding: '0.75rem 2rem',
    background: '#4f46e5',
    color: 'white',
    borderRadius: 10,
    fontWeight: 700,
    fontSize: '1rem',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
  btnSecondary: {
    padding: '0.75rem 2rem',
    border: '2px solid #e2e8f0',
    color: '#0f172a',
    borderRadius: 10,
    fontWeight: 600,
    fontSize: '1rem',
    textDecoration: 'none',
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem',
    marginTop: '2rem',
  },
  featureCard: {
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    padding: '1.5rem',
  },
  featureIcon: {
    fontSize: '1.75rem',
    display: 'block',
    marginBottom: '0.6rem',
  },
  featureTitle: {
    fontFamily: "'Sora', sans-serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '0.4rem',
  },
  featureDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    lineHeight: 1.5,
  },
};

export default HomePage;
