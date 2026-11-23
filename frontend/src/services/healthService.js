import api from "./api";

export const checkBackendHealth = async () => {
  try {
    const response = await api.get("/api/health");
    return response.data;
  } catch (error) {
    console.error("Backend connection failed:", error);
    throw error;
  }
};