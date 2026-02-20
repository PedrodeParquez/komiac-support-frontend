const ACCESS_LOCAL_KEY = "access_token";

export function setAccessToken(accessToken: string | null, remember: boolean) {
    if (!accessToken) {
        localStorage.removeItem(ACCESS_LOCAL_KEY);
        sessionStorage.removeItem(ACCESS_LOCAL_KEY);
        return;
    }

    if (remember) {
        localStorage.setItem(ACCESS_LOCAL_KEY, accessToken);
        sessionStorage.removeItem(ACCESS_LOCAL_KEY);
    } else {
        sessionStorage.setItem(ACCESS_LOCAL_KEY, accessToken);
        localStorage.removeItem(ACCESS_LOCAL_KEY);
    }
}

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_LOCAL_KEY) ?? sessionStorage.getItem(ACCESS_LOCAL_KEY);
}

export function clearTokens() {
    localStorage.removeItem(ACCESS_LOCAL_KEY);
    sessionStorage.removeItem(ACCESS_LOCAL_KEY);
}

export function isRememberMode(): boolean {
    return !!localStorage.getItem(ACCESS_LOCAL_KEY);
}