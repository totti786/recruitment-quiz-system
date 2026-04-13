const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Global handler for 401/403 auth errors — set via setAuthErrorHandler
let _authErrorHandler = null

export function setAuthErrorHandler(handler) {
  _authErrorHandler = handler
}

export function isAuthError(status) {
  return status === 401 || status === 403
}

export class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

function getAdminToken() {
  return localStorage.getItem('token')
}

function getQuizSessionToken() {
  return sessionStorage.getItem('quizAccessToken')
}

function buildHeaders(options = {}) {
  const headers = new Headers(options.headers || {})
  const authMode = options.auth ?? 'admin'
  const hasBody = options.body !== undefined && options.body !== null

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (authMode === 'admin') {
    const token = getAdminToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  if (authMode === 'quiz') {
    const token = getQuizSessionToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  return headers
}

async function parseErrorResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json().catch(() => ({}))
  }

  const text = await response.text().catch(() => '')
  return text ? { error: text } : {}
}

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: buildHeaders(options),
  })

  if (!response.ok) {
    const payload = await parseErrorResponse(response)
    if (_authErrorHandler && isAuthError(response.status)) {
      _authErrorHandler(response.status, payload)
    }
    throw new ApiError(
      payload.error || payload.message || 'Request failed',
      response.status,
      payload
    )
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

async function requestBlob(url, options = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: buildHeaders(options),
  })

  if (!response.ok) {
    const payload = await parseErrorResponse(response)
    if (_authErrorHandler && isAuthError(response.status)) {
      _authErrorHandler(response.status, payload)
    }
    throw new ApiError(
      payload.error || payload.message || 'Request failed',
      response.status,
      payload
    )
  }

  return response.blob()
}

export const authApi = {
  login: (username, password) => request('/auth/login', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ username, password }),
  }),
  verify: () => request('/auth/verify'),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  }),
}

export const candidatesApi = {
  getAll: () => request('/candidates'),
  getAvailable: () => request('/candidates/available', { auth: 'none' }),
  getById: (id) => request(`/candidates/${id}`),
  create: (data) => request('/candidates', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/candidates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/candidates/${id}`, {
    method: 'DELETE',
  }),
  assignSession: (id, sessionId) => request(`/candidates/${id}/assign-session`, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  }),
}

export const departmentsApi = {
  getAll: () => request('/departments'),
  getById: (id) => request(`/departments/${id}`),
  create: (data) => request('/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/departments/${id}`, {
    method: 'DELETE',
  }),
  getPositions: (id) => request(`/departments/${id}/positions`),
}

export const positionsApi = {
  getAll: () => request('/positions'),
  getById: (id) => request(`/positions/${id}`),
  create: (data) => request('/positions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/positions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/positions/${id}`, {
    method: 'DELETE',
  }),
}

export const sessionsApi = {
  getAll: () => request('/sessions'),
  getById: (id) => request(`/sessions/${id}`),
  create: (data) => request('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/sessions/${id}`, {
    method: 'DELETE',
  }),
}

export const quizzesApi = {
  getAll: () => request('/quizzes'),
  getPublic: () => request('/quizzes/public', { auth: 'none' }),
  getById: (id) => request(`/quizzes/${id}`),
  create: (data) => request('/quizzes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/quizzes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/quizzes/${id}`, {
    method: 'DELETE',
  }),
}

export const quizSessionsApi = {
  getCandidateSessions: (candidateId) => request(`/quiz-sessions/candidate/${candidateId}/sessions`, {
    auth: 'none',
  }),
  startSession: (candidateId, sessionId) => request('/quiz-sessions/start', {
    method: 'POST',
    auth: 'none',
    body: JSON.stringify({ candidateId, sessionId }),
  }),
  getQuizQuestions: (candidateSessionId, quizIndex) => request(`/quiz-sessions/session/${candidateSessionId}/quiz/${quizIndex}`, {
    auth: 'quiz',
  }),
  submitAnswer: (data) => request('/quiz-sessions/answer', {
    method: 'POST',
    auth: 'quiz',
    body: JSON.stringify(data),
  }),
  updateTimer: (candidateSessionId, timeRemaining) => request('/quiz-sessions/timer', {
    method: 'POST',
    auth: 'quiz',
    body: JSON.stringify({ candidateSessionId, timeRemaining }),
  }),
  nextQuiz: (candidateSessionId) => request('/quiz-sessions/next-quiz', {
    method: 'POST',
    auth: 'quiz',
    body: JSON.stringify({ candidateSessionId }),
  }),
  submitSession: (candidateSessionId) => request('/quiz-sessions/submit', {
    method: 'POST',
    auth: 'quiz',
    body: JSON.stringify({ candidateSessionId }),
  }),
}

export const questionsApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== '')
    )
    const suffix = params.toString() ? `?${params}` : ''
    return request(`/questions${suffix}`)
  },
  getCategories: () => request('/questions/categories'),
  getById: (id) => request(`/questions/${id}`),
  create: (data) => request('/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => request(`/questions/${id}`, {
    method: 'DELETE',
  }),
  importCsv: (questions) => request('/questions/import', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  }),
}

export const dashboardApi = {
  getStats: () => request('/dashboard/stats'),
  getResults: () => request('/dashboard/results'),
  getResultDetails: (sessionId) => request(`/dashboard/results/${sessionId}`),
  exportResults: () => requestBlob('/dashboard/export'),
}

export const gradingApi = {
  getPending: () => request('/grading/pending'),
  getSession: (candidateSessionId) => request(`/grading/session/${candidateSessionId}`),
  gradeAnswer: (answerId, data) => request(`/grading/answer/${answerId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  batchGrade: (candidateSessionId, grades) => request(`/grading/session/${candidateSessionId}/batch`, {
    method: 'POST',
    body: JSON.stringify({ grades }),
  }),
}
