import api from "./api";

export const registerAccount = async ({ name, email, password }) => {
  const response = await api.post("/api/auth/register", { name, email, password });
  return response.data;
};

export const loginAccount = async ({ email, password }) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data;
};

export const logoutAccount = () => {
  sessionStorage.removeItem("mentormind_access_token");
  sessionStorage.removeItem("mentormind_user");
};
