import { http } from "./http";
import type { UserRole } from "./users";
import { setAccessToken, clearTokens } from "../auth/tokenStorage";

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
    const { data } = await http.post<LoginResponse>("/auth/login", req);
    setAccessToken(data.accessToken, req.remember);
    return data.user;
}

export async function logout() {
    await http.post("/auth/logout", null).catch(() => { });
    clearTokens();
}

export async function me() {
    const { data } = await http.get<{ user: Me }>("/auth/me");
    return data.user;
}