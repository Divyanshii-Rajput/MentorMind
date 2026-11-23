
import api from './api'

// Get all saved study tasks
export const getStudyTasks = async (email) => {
  const response = await api.get(
    `/api/planner/${encodeURIComponent(email)}/tasks`
  )
  return response.data
}

// Add a new study task
export const createStudyTask = async (email, task) => {
  const response = await api.post(
    `/api/planner/${encodeURIComponent(email)}/tasks`,
    task
  )
  return response.data
}

// Update a study task
export const updateStudyTask = async (email, taskId, updates) => {
  const response = await api.patch(
    `/api/planner/${encodeURIComponent(email)}/tasks/${taskId}`,
    updates
  )
  return response.data
}

// Delete a study task
export const deleteStudyTask = async (email, taskId) => {
  const response = await api.delete(
    `/api/planner/${encodeURIComponent(email)}/tasks/${taskId}`
  )
  return response.data
}

// Generate an AI-personalized study plan
export const generateStudyPlan = async (
  email,
  studyDays = 7,
  minutesPerDay = 60
) => {
  const response = await api.get(
    `/api/planner/${encodeURIComponent(email)}`,
    {
      params: {
        study_days: studyDays,
        minutes_per_day: minutesPerDay,
      },
    }
  )

  return response.data
}
