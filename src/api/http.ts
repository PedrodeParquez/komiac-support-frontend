import axios from "axios";
import { getAccessToken } from "../auth/tokenStorage";

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

http.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});