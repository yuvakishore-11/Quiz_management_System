import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Base URL
// ─────────────────────────────────────────────────────────────
const BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  'http://localhost:8000/api';

// ─────────────────────────────────────────────────────────────
// Axios Instance
// ─────────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────
const getStoredTokens = () => {
  try {
    const stored = localStorage.getItem('quiz_tokens');
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    return null;
  }
};

const storeTokens = (tokens) => {
  localStorage.setItem(
    'quiz_tokens',
    JSON.stringify(tokens)
  );
};

const clearAuthStorage = () => {
  localStorage.removeItem('quiz_tokens');
  localStorage.removeItem('quiz_user');
};

// ─────────────────────────────────────────────────────────────
// REQUEST INTERCEPTOR
// Attach access token automatically
// ─────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const tokens = getStoredTokens();

    if (tokens?.access) {
      config.headers.Authorization =
        `Bearer ${tokens.access}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────
// RESPONSE INTERCEPTOR
// Auto refresh expired access tokens
// ─────────────────────────────────────────────────────────────
let isRefreshing = false;

let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Ignore if no response
    if (!error.response) {
      return Promise.reject(error);
    }

    // Only handle 401
    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login/') &&
      !originalRequest.url.includes('/auth/token/refresh/')
    ) {
      originalRequest._retry = true;

      // If already refreshing, queue requests
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization =
              `Bearer ${token}`;

            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      const tokens = getStoredTokens();

      // No refresh token → logout
      if (!tokens?.refresh) {
        clearAuthStorage();

        window.location.href = '/login';

        return Promise.reject(error);
      }

      try {
        // Refresh access token
        const response = await axios.post(
          `${BASE_URL}/auth/token/refresh/`,
          {
            refresh: tokens.refresh,
          }
        );

        const newAccessToken = response.data.access;

        const updatedTokens = {
          ...tokens,
          access: newAccessToken,
        };

        // Save updated tokens
        storeTokens(updatedTokens);

        // Process waiting requests
        processQueue(null, newAccessToken);

        // Retry original request
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);

        clearAuthStorage();

        window.location.href = '/login';

        return Promise.reject(refreshError);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─────────────────────────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const response = await apiClient.post(
      '/auth/login/',
      {
        email,
        password,
      }
    );

    return response.data;
  },

  register: async (data) => {
    const response = await apiClient.post(
      '/auth/register/',
      data
    );

    return response.data;
  },

  googleAuth: async (token, role) => {
    const response = await apiClient.post(
      '/auth/google/',
      {
        token,
        role,
      }
    );

    return response.data;
  },

  refreshToken: async (refresh) => {
    const response = await apiClient.post(
      '/auth/token/refresh/',
      {
        refresh,
      }
    );

    return response.data;
  },

  getMe: async (accessToken) => {
    const response = await axios.get(
      `${BASE_URL}/auth/me/`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  },
};

// ─────────────────────────────────────────────────────────────
// TEACHER API
// ─────────────────────────────────────────────────────────────
export const teacherAPI = {
  getQuizzes: () =>
    apiClient
      .get('/quizzes/teacher/')
      .then((r) => r.data),

  getQuiz: (id) =>
    apiClient
      .get(`/quizzes/teacher/${id}/`)
      .then((r) => r.data),

  createQuiz: (data) =>
    apiClient
      .post('/quizzes/teacher/', data)
      .then((r) => r.data),

  updateQuiz: (id, data) =>
    apiClient
      .put(`/quizzes/teacher/${id}/`, data)
      .then((r) => r.data),

  patchQuiz: (id, data) =>
    apiClient
      .patch(`/quizzes/teacher/${id}/`, data)
      .then((r) => r.data),

  deleteQuiz: (id) =>
    apiClient
      .delete(`/quizzes/teacher/${id}/`)
      .then((r) => r.data),

  togglePublish: (id) =>
    apiClient
      .patch(`/quizzes/teacher/${id}/publish/`)
      .then((r) => r.data),

  getResults: (id) =>
    apiClient
      .get(`/quizzes/teacher/${id}/results/`)
      .then((r) => r.data),

  getAnalytics: () =>
  apiClient
    .get('/quizzes/teacher/analytics/')
    .then((r) => r.data),
};

// ─────────────────────────────────────────────────────────────
// STUDENT API
// ─────────────────────────────────────────────────────────────
export const studentAPI = {
  getPublishedQuizzes: () =>
    apiClient
      .get('/quizzes/published/')
      .then((r) => r.data),

  getQuiz: (id) =>
    apiClient
      .get(`/quizzes/published/${id}/`)
      .then((r) => r.data),

  submitAttempt: (id, data) =>
    apiClient
      .post(
        `/quizzes/published/${id}/attempt/`,
        data
      )
      .then((r) => r.data),

  getMyResults: () =>
    apiClient
      .get('/quizzes/my-results/')
      .then((r) => r.data),

  getAttemptDetail: (id) =>
    apiClient
      .get(`/quizzes/my-results/${id}/`)
      .then((r) => r.data),
};

export default apiClient;