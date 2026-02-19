import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../pages/Login/LoginPage";
import { AdminPage } from "../pages/Admin/AdminPage";
import { UserPage } from "../pages/User/UserPage";
import { useAuth } from "../auth/AuthContext";

function Protected({ children }: { children: React.ReactNode }) {
    const { user, isAuthReady } = useAuth();

    if (!isAuthReady) return null;
    if (!user) return <Navigate to="/login" replace />;

    return <>{children}</>;
}

export function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/user"
                element={
                    <Protected>
                        <UserPage />
                    </Protected>
                }
            />
            <Route
                path="/admin"
                element={
                    <Protected>
                        <AdminPage />
                    </Protected>
                }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
