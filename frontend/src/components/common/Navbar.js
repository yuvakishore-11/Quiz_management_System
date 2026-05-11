import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, isTeacher, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname.startsWith(path) ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="brand-link">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">QuizForge</span>
        </Link>
      </div>

      <div className="navbar-links">
        {isAuthenticated && isTeacher && (
          <>
            <Link to="/teacher/dashboard" className={isActive('/teacher/dashboard')}>Dashboard</Link>
            <Link to="/teacher/quizzes" className={isActive('/teacher/quizzes')}>My Quizzes</Link>
            <Link to="/teacher/quizzes/create" className={isActive('/teacher/quizzes/create')}>+ New Quiz</Link>
            <Link to="/teacher/analytics" className={isActive('/teacher/analytics')}>Analytics</Link>
          </>
        )}
        {isAuthenticated && isStudent && (
          <>
            <Link to="/student/quizzes" className={isActive('/student/quizzes')}>Browse Quizzes</Link>
            <Link to="/student/results" className={isActive('/student/results')}>My Results</Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        {isAuthenticated ? (
          <div className="user-menu">
            {user?.avatar && (
              <img src={user.avatar} alt="avatar" className="user-avatar" />
            )}
            <span className="user-name">{user?.first_name || user?.email}</span>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        ) : (
          <div className="auth-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn-primary-sm">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
