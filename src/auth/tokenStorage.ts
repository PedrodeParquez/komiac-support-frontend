const ACCESS_LOCAL_KEY = "access_token";

export function setAccessToken(token: string, remember: boolean) {
    if (remember) {
        localStorage.setItem(ACCESS_LOCAL_KEY, token);
        sessionStorage.removeItem(ACCESS_LOCAL_KEY);
    } else {
        sessionStorage.setItem(ACCESS_LOCAL_KEY, token);
        localStorage.removeItem(ACCESS_LOCAL_KEY);
    }
}

export function getAccessToken() {
    return localStorage.getItem(ACCESS_LOCAL_KEY) ?? sessionStorage.getItem(ACCESS_LOCAL_KEY);
}

export function clearAccessToken() {
    localStorage.removeItem(ACCESS_LOCAL_KEY);
    sessionStorage.removeItem(ACCESS_LOCAL_KEY);
}