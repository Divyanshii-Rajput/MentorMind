import api from './api'

export const uploadDocument = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  // Let the browser/Axios set the multipart boundary automatically.
  const response = await api.post('/api/documents/upload', formData)
  return response.data
}
