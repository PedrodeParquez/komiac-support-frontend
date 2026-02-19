import { http } from "./http";
import type { LoginRequest, LoginResponse, MeResponse } from "../auth/types";

export async function loginRequest(data: LoginRequest) {
    const res = await http.post<LoginResponse>("/auth/login", data);
    return res.data;
}

export async function meRequest() {
    const res = await http.get<MeResponse>("/auth/me");
    return res.data;
}

export async function refreshRequest() {
    const res = await http.post<{ accessToken: string }>("/auth/refresh");
    return res.data;
}

export async function logoutRequest() {
    await http.post("/auth/logout");
}