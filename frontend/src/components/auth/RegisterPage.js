import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const RegisterPage = () => {
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'student',
    password: '',
    password2: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const redirectAfterRegister = (user) => {
    if (user.role === 'teacher') navigate('/teacher/dashboard', { replace: true });
    else navigate('/student/quizzes', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (form.password !== form.password2) {
      setLocalError('Passwords do not match.');
      return;
    }
    setIsSubmitting(true);
    try {
      const user = await register(form);
      redirectAfterRegister(user);
    } catch (err) {
      setLocalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLocalError('');
    try {
      const user = await googleLogin(credentialResponse.credential, form.role);
      redirectAfterRegister(user);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <span className="auth-logo">⚡</span>
          <h1>Create Account</h1>
          <p>Join QuizForge today</p>
        </div>

        {localError && (
          <div className="alert alert-error">{localError}</div>
        )}

        {/* Role Selector */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${form.role === 'student' ? 'active' : ''}`}
            onClick={() => setForm((p) => ({ ...p, role: 'student' }))}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === 'teacher' ? 'active' : ''}`}
            onClick={() => setForm((p) => ({ ...p, role: 'teacher' }))}
          >
            📚 Teacher
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                name="first_name"
                type="text"
                value={form.first_name}
                onChange={handleChange}
                placeholder="Jane"
                required
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                name="last_name"
                type="text"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              name="password2"
              type="password"
              value={form.password2}
              onChange={handleChange}
              placeholder="Repeat password"
              required
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : `Create ${form.role === 'teacher' ? 'Teacher' : 'Student'} Account`}
          </button>
        </form>

        <div className="divider"><span>or sign up with Google</span></div>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setLocalError('Google sign-up failed.')}
            shape="rectangular"
            size="large"
            width="100%"
            text="signup_with"
          />
          <p className="google-note">
            Will register as a <strong>{form.role}</strong> based on your selection above.
          </p>
        </div>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
