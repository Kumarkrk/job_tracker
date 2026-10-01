import axios from "axios";

export const TOKEN_KEY = "jobTrackerToken";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = ["/user/login", "/user/register"].includes(
      error.config?.url,
    );

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event("auth:expired"));
    }

    return Promise.reject(error);
  },
);

export function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again.",
) {
  return (
    error.response?.data?.message ||
    (error.code === "ERR_NETWORK"
      ? "Unable to reach the server. Make sure the backend is running."
      : fallback)
  );
}

export default api;
