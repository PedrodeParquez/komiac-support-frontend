export type UserRole = "user" | "support";

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