const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type Tokens = {
    accessToken: string;
    refreshToken: string;
};

let tokens: Tokens | null = null;

export function setTokens(next: Tokens | null) {
    tokens = next;
    if (next) {
        localStorage.setItem("tokens", JSON.stringify(next));
    } else {
        localStorage.removeItem("tokens");
    }
}

export function loadTokens() {
    const raw = localStorage.getItem("tokens");
    if (!raw) return null;
    try {
        const t = JSON.parse(raw) as Tokens;
        if (!t?.accessToken || !t?.refreshToken) return null;
        tokens = t;
        return t;
    } catch {
        return null;
    }
}

export function getAccessToken() {
    return tokens?.accessToken || null;
}

async function refreshTokens() {
    if (!tokens?.refreshToken) throw new Error("no refresh token");

    const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!res.ok) throw new Error("refresh failed");

    const data = (await res.json()) as Partial<Tokens>;
    if (!data.accessToken || !data.refreshToken) throw new Error("bad refresh payload");

    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data as Tokens;
}

type RequestOptions = Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>;
    auth?: boolean;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_URL}${path}`;
    const auth = options.auth !== false;

    const headers: Record<string, string> = {
        ...(options.headers ?? {}),
    };

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (auth) {
        const token = getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const doFetch = () =>
        fetch(url, {
            ...options,
            headers,
        });

    let res = await doFetch();

    if (res.status === 401 && auth && tokens?.refreshToken) {
        await refreshTokens();
        const newToken = getAccessToken();
        if (newToken) headers.Authorization = `Bearer ${newToken}`;
        res = await doFetch();
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
    }

    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
}