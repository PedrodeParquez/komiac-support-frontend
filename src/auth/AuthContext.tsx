import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";
import { clearTokens, getAccessToken } from "./tokenStorage";

type User = authApi.Me;

type AuthContextValue = {
    user: User | null;
    isAuthReady: boolean;
    login: (p: authApi.LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const token = getAccessToken();

                // если токена нет — не дергаем /auth/me и не ловим 401 на /login
                if (!token) {
                    setUser(null);
                    return;
                }

                const me = await authApi.me();
                setUser(me);
            } catch {
                clearTokens();
                setUser(null);
            } finally {
                setIsAuthReady(true);
            }
        })();
    }, []);

    const login = async (p: authApi.LoginRequest) => {
        const u = await authApi.login(p);
        setUser(u);
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    const value = useMemo<AuthContextValue>(
        () => ({ user, isAuthReady, login, logout }),
        [user, isAuthReady]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}