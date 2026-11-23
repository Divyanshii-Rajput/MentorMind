
import api from './api'

// Generate a quiz using an uploaded and indexed document
export const generateQuiz = async (payload) => {
    const response = await api.post(
        '/api/quizzes/generate',
        payload
    )

    return response.data
}

// Submit quiz answers and receive evaluation
export const submitQuiz = async (quizId, answers) => {
    const response = await api.post(
        `/api/quizzes/${quizId}/submit`,
        { answers }
    )

    return response.data
}

// Fetch an existing quiz
export const getQuiz = async (quizId) => {
    const response = await api.get(
        `/api/quizzes/${quizId}`
    )

    return response.data
}
