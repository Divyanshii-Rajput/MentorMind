import api from "./api";

export const askRAGQuestion = async (question) => {
  const response = await api.post("/api/rag/ask", {
    question: question,
    top_k: 5,
  });

  return response.data;
};