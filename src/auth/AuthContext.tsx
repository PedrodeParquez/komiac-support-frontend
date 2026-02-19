import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "./types";
import { clearAccessToken, getAccessToken, setAccessToken } from "./tokenStorage";
import { loginRequest, logoutRequest, meRequest, refreshRequest } from "../api/auth";

type AuthState = {
    user: User | null;
    isAuthReady: boolean;
};

type AuthContextValue = AuthState & {
    login: (data: { login: string; password: string; remember: boolean }) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = getAccessToken();

                if (token) {
                    const me = await meRequest();
                    setUser(me.user);
                    return;
                }

                const refreshed = await refreshRequest();
                setAccessToken(refreshed.accessToken, false);
                const me = await meRequest();
                setUser(me.user);
            } catch {
                clearAccessToken();
                setUser(null);
            } finally {
                setIsAuthReady(true);
            }
        })();
    }, []);

    const login: AuthContextValue["login"] = async ({ login, password, remember }) => {
        const data = await loginRequest({ login, password });
        setAccessToken(data.accessToken, remember);
        setUser(data.user);
    };

    const logout: AuthContextValue["logout"] = async () => {
        try {
            await logoutRequest();
        } finally {
            clearAccessToken();
            setUser(null);
        }
    };

    const value = useMemo(
        () => ({ user, isAuthReady, login, logout }),
        [user, isAuthReady]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}