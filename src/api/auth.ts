import { http } from "./http";
import { setAccessToken, clearTokens, isRememberMode } from "../auth/tokenStorage";

export type UserRole = "user" | "support";

export type Me = {
    id: number;
    name: string;
    role: UserRole;
    username?: string;
    email?: string;
};

export type LoginRequest = {
    login: string;
    password: string;
    remember: boolean;
};

export type LoginResponse = {
    accessToken: string;
    user: Me;
};

export async function login(req: LoginRequest) {
    const { data } = await http.post<LoginResponse>("/auth/login", req, {
        // на login не нужно подставлять Bearer
        headers: { Authorization: undefined },
    });

    setAccessToken(data.accessToken, req.remember);
    return data.user;
}

export async function logout() {
    // refresh token в HttpOnly cookie, просто просим бэк удалить cookie
    await http
        .post("/auth/logout", null, { headers: { Authorization: undefined } })
        .catch(() => { });

    clearTokens();
}

export async function me() {
    // бэк возвращает { user: { ... } }
    const { data } = await http.get<{ user: Me }>("/auth/me");
    return data.user;
}

/**
 * Если тебе надо руками дергать refresh где-то ещё.
 * В основном refresh делается автоматически через interceptor.
 */
export async function refresh() {
    const { data } = await http.post<{ accessToken: string }>(
        "/auth/refresh",
        null,
        { headers: { Authorization: undefined } }
    );

    setAccessToken(data.accessToken, isRememberMode());
    return data.accessToken;
}