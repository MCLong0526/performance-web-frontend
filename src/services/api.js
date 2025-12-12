// src/services/api.js
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080",
    withCredentials: false,
});

api.interceptors.request.use(
    (config) => {
        // 🛑 IMPORTANT: The key used here must match your login component's key.
        const token = localStorage.getItem("jwtToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a global response interceptor for unified error messages
api.interceptors.response.use(
    (response) => response.data, // Return the body directly for convenience
    (error) => {
        if (error.response && error.response.status === 403) {
            // Handle 403 globally to ensure user logs in again
            throw new Error("Session expired or unauthorized access. Please log in again.");
        }
        // Use the backend's provided message if available
        let errorMessage = "An unknown error occurred.";
        if (error.response && error.response.data && (error.response.data.msg || error.response.data.error)) {
            errorMessage = error.response.data.msg || error.response.data.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        return Promise.reject(new Error(errorMessage));
    }
);

export default api;