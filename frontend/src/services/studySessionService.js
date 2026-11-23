
import api from './api'

// Start a new study session
export const startStudySession = async (studentEmail, payload) => {
    const response = await api.post(
        `/api/study-sessions/${encodeURIComponent(studentEmail)}/start`,
        payload
    )

    return response.data
}

// Complete an existing study session
export const completeStudySession = async (
    studentEmail,
    sessionId,
    payload
) => {
    const response = await api.post(
        `/api/study-sessions/${encodeURIComponent(studentEmail)}/${encodeURIComponent(sessionId)}/complete`,
        payload
    )

    return response.data
}

// Fetch study session history
export const getStudySessionHistory = async (
    studentEmail,
    limit = 50
) => {
    const response = await api.get(
        `/api/study-sessions/${encodeURIComponent(studentEmail)}/history`,
        {
            params: { limit }
        }
    )

    return response.data
}

// Fetch study session summary
export const getStudySessionSummary = async (studentEmail) => {
    const response = await api.get(
        `/api/study-sessions/${encodeURIComponent(studentEmail)}/summary`
    )

    return response.data
}
