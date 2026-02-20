import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, setAccessToken, clearTokens, isRememberMode } from "../auth/tokenStorage";

export const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // важно для cookie refresh_token
});

function isAuthEndpoint(url: string): boolean {
    // url может быть относительный "/auth/me" или полный
    return (
        url.includes("/auth/login") ||
        url.includes("/auth/refresh") ||
        url.includes("/auth/logout")
    );
}

http.interceptors.request.use((config) => {
    const token = getAccessToken();

    console.log("TOKEN =", token);
    console.log("REQUEST URL =", config.url);

    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
    try {
        const { data } = await http.post<{ accessToken: string }>(
            "/auth/refresh",
            null,
            { headers: { Authorization: undefined } }
        );

        setAccessToken(data.accessToken, isRememberMode());
        return data.accessToken;
    } catch {
        clearTokens();
        return null;
    }
}

http.interceptors.response.use(
    (res) => res,
    async (err: AxiosError) => {
        const original = err.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
        if (!original) throw err;

        const url = original.url ?? "";
        if (isAuthEndpoint(url)) throw err;

        if (err.response?.status !== 401) throw err;
        if (original._retry) throw err;

        original._retry = true;

        if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
                refreshPromise = null;
            });
        }

        const newAccess = await refreshPromise;
        if (!newAccess) throw err;

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccess}`;

        return http.request(original);
    }
);