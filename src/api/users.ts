import { http } from "./http";

export type UserRole = "user" | "support";

export type SupportUser = { id: number; name: string };

export type User = {
    id: number;
    name: string;
    role: "user" | "support";
    username?: string;
    email?: string;
};

export type LoginRequest = {
    login: string;
    password: string;
};

export type LoginResponse = {
    accessToken: string;
    user: User;
};

export type MeResponse = {
    user: User;
};

export async function listSupportUsers() {
    const { data } = await http.get<{ users: SupportUser[] }>("/users/support");
    return Array.isArray(data.users) ? data.users : [];
}
