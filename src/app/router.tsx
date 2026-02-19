import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../pages/Login/LoginPage";
import { useAuth } from "../auth/AuthContext";

function Protected({ children }: { children: React.ReactNode }) {
    const { user, isAuthReady } = useAuth();

    if (!isAuthReady) return null;
    if (!user) return <Navigate to="/login" replace />;

    return <>{children}</>;
}

function UserHome() {
    return <div style={{ padding: 24 }}>Пользовательский экран</div>;
}
function AdminHome() {
    return <div style={{ padding: 24 }}>Админский экран</div>;
}

export function AppRouter() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/user"
                element={
                    <Protected>
                        <UserHome />
                    </Protected>
                }
            />
            <Route
                path="/admin"
                element={
                    <Protected>
                        <AdminHome />
                    </Protected>
                }
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}
