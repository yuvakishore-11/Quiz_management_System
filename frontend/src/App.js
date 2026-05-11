import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Context
import { AuthProvider } from './context/AuthContext';

// Common
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';

// Teacher pages
import TeacherDashboard from './components/teacher/TeacherDashboard';
import TeacherQuizList from './components/teacher/TeacherQuizList';
import QuizEditor from './components/teacher/QuizEditor';
import QuizResults from './components/teacher/QuizResults';
import TeacherAnalytics from './components/teacher/TeacherAnalytics';

// Student pages
import StudentQuizList from './components/student/StudentQuizList';
import QuizTaker from './components/student/QuizTaker';
import { StudentResultsList, StudentResultDetail } from './components/student/StudentResults';

// Misc pages (inline — small enough to not need their own files)
import UnauthorizedPage from './pages/UnauthorizedPage';
import HomePage from './pages/HomePage';

const App = () => {
  return (
    <BrowserRouter>
      {/*
        AuthProvider wraps everything inside BrowserRouter so that
        auth actions (e.g. logout → navigate('/login')) work correctly.
      */}
      <AuthProvider>
        {/* Navbar is always rendered; it reads auth state from context */}
        <Navbar />

        <Routes>
          {/* ── Public routes ──────────────────────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Teacher routes (role = 'teacher' required) ─────────────── */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherQuizList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes/create"
            element={
              <ProtectedRoute requiredRole="teacher">
                {/* QuizEditor with no quizId param = create mode */}
                <QuizEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes/:quizId/edit"
            element={
              <ProtectedRoute requiredRole="teacher">
                {/* QuizEditor with quizId param = edit mode */}
                <QuizEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/quizzes/:quizId/results"
            element={
              <ProtectedRoute requiredRole="teacher">
                <QuizResults />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/analytics"
            element={
              <ProtectedRoute requiredRole="teacher">
                <TeacherAnalytics />
            </ProtectedRoute>
            }
          />
          {/* ── Student routes (role = 'student' required) ─────────────── */}
          <Route
            path="/student/quizzes"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentQuizList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quizzes/:quizId"
            element={
              <ProtectedRoute requiredRole="student">
                <QuizTaker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentResultsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/results/:attemptId"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentResultDetail />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all: redirect unknown paths to home ──────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
