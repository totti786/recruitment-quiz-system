const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('token')
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(error.error || error.message || 'Request failed', response.status)
  }
  
  return response.json()
}

// Auth API
export const authApi = {
  login: (username, password) => fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  verify: () => fetchWithAuth('/auth/verify'),
  changePassword: (currentPassword, newPassword) => fetchWithAuth('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  })
}

// Candidates API
export const candidatesApi = {
  getAll: () => fetchWithAuth('/candidates'),
  getAvailable: () => fetch(`${API_BASE_URL}/candidates/available`).then(r => r.json()),
  getById: (id) => fetchWithAuth(`/candidates/${id}`),
  create: (data) => fetchWithAuth('/candidates', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetchWithAuth(`/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => fetchWithAuth(`/candidates/${id}`, {
    method: 'DELETE'
  }),
  assignSession: (id, sessionId) => fetchWithAuth(`/candidates/${id}/assign-session`, {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  })
}

// Departments API
export const departmentsApi = {
  getAll: () => fetchWithAuth('/departments'),
  getById: (id) => fetchWithAuth(`/departments/${id}`),
  create: (data) => fetchWithAuth('/departments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetchWithAuth(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => fetchWithAuth(`/departments/${id}`, {
    method: 'DELETE'
  }),
  getPositions: (id) => fetchWithAuth(`/departments/${id}/positions`)
}

// Positions API
export const positionsApi = {
  getAll: () => fetchWithAuth('/positions'),
  getById: (id) => fetchWithAuth(`/positions/${id}`),
  create: (data) => fetchWithAuth('/positions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetchWithAuth(`/positions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => fetchWithAuth(`/positions/${id}`, {
    method: 'DELETE'
  })
}

// Sessions API
export const sessionsApi = {
  getAll: () => fetchWithAuth('/sessions'),
  getById: (id) => fetchWithAuth(`/sessions/${id}`),
  create: (data) => fetchWithAuth('/sessions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetchWithAuth(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => fetchWithAuth(`/sessions/${id}`, {
    method: 'DELETE'
  })
}

// Quizzes API
export const quizzesApi = {
  getAll: () => fetchWithAuth('/quizzes'),
  getPublic: () => fetch(`${API_BASE_URL}/quizzes/public`).then(r => r.json()),
  getById: (id) => fetchWithAuth(`/quizzes/${id}`),
  create: (data) => fetchWithAuth('/quizzes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetchWithAuth(`/quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => fetchWithAuth(`/quizzes/${id}`, {
    method: 'DELETE'
  })
}

// Quiz Sessions API (for taking quizzes)
export const quizSessionsApi = {
  getCandidateSessions: (candidateId) => fetch(`${API_BASE_URL}/quiz-sessions/candidate/${candidateId}/sessions`).then(r => r.json()),
  startSession: (candidateId, sessionId) => fetch(`${API_BASE_URL}/quiz-sessions/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateId, sessionId })
  }).then(r => r.json()),
  getQuizQuestions: (candidateSessionId, quizIndex) => fetch(`${API_BASE_URL}/quiz-sessions/session/${candidateSessionId}/quiz/${quizIndex}`).then(r => r.json()),
  submitAnswer: (data) => fetch(`${API_BASE_URL}/quiz-sessions/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateTimer: (candidateSessionId, timeRemaining) => fetch(`${API_BASE_URL}/quiz-sessions/timer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateSessionId, timeRemaining })
  }).then(r => r.json()),
  nextQuiz: (candidateSessionId) => fetch(`${API_BASE_URL}/quiz-sessions/next-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateSessionId })
  }).then(r => r.json()),
  submitSession: (candidateSessionId) => fetch(`${API_BASE_URL}/quiz-sessions/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidateSessionId })
  }).then(r => r.json())
}

// Questions API
export const questionsApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters)
    return fetchWithAuth(`/questions?${params}`)
  },
  getCategories: () => fetchWithAuth('/questions/categories'),
  getById: (id) => fetchWithAuth(`/questions/${id}`),
  create: (data) => fetchWithAuth('/questions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  update: (id, data) => fetchWithAuth(`/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (id) => fetchWithAuth(`/questions/${id}`, {
    method: 'DELETE'
  })
}

// Dashboard API
export const dashboardApi = {
  getStats: () => fetchWithAuth('/dashboard/stats'),
  getResults: () => fetchWithAuth('/dashboard/results'),
  getResultDetails: (sessionId) => fetchWithAuth(`/dashboard/results/${sessionId}`),
  export: () => fetchWithAuth('/dashboard/export')
}

// Grading API
export const gradingApi = {
  getPending: () => fetchWithAuth('/grading/pending'),
  getSession: (candidateSessionId) => fetchWithAuth(`/grading/session/${candidateSessionId}`),
  gradeAnswer: (answerId, data) => fetchWithAuth(`/grading/answer/${answerId}`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  batchGrade: (candidateSessionId, grades) => fetchWithAuth(`/grading/session/${candidateSessionId}/batch`, {
    method: 'POST',
    body: JSON.stringify({ grades })
  })
}