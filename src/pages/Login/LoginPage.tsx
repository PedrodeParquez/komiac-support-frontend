import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../auth/AuthContext";
import Logo from "../../assets/images/logo.png"
import styles from "./LoginPage.module.css";
import { z } from "zod";

const schema = z.object({
    login: z.string().min(1, "Введите логин"),
    password: z.string().min(1, "Введите пароль"),
    remember: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
    const { user, isAuthReady, login } = useAuth();
    const navigate = useNavigate();

    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { login: "", password: "", remember: false },
    });

    useEffect(() => {
        if (!isAuthReady) return;
        if (!user) return;
        navigate(user.role === "support" ? "/admin" : "/user", { replace: true });
    }, [isAuthReady, user, navigate]);

    const onSubmit = async (values: FormValues) => {
        setServerError(null);
        try {
            await login(values);
        } catch (e) {
            setServerError("Не удалось войти, проверьте логин и пароль.");
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.wrapper}>
                <div className={styles.brand}>
                    <img src={Logo} />
                    <div className={styles.subtitle}>Техническая поддержка</div>
                </div>
                <div className={styles.card}>
                    <h1 className={styles.title}>Авторизация</h1>
                    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                        <label className={styles.label}>
                            Логин
                            <input
                                className={styles.input}
                                autoComplete="username"
                                {...register("login")}
                            />
                            {errors.login && <div className={styles.error}>{errors.login.message}</div>}
                        </label>
                        <label className={styles.label}>
                            Пароль
                            <input
                                className={styles.input}
                                type="password"
                                autoComplete="current-password"
                                {...register("password")}
                            />
                            {errors.password && <div className={styles.error}>{errors.password.message}</div>}
                        </label>
                        <label className={styles.remember}>
                            <span className={styles.rememberText}>Запомнить меня на этом устройстве</span>
                            <input
                                className={styles.checkboxInput}
                                type="checkbox"
                                {...register("remember")}
                            />
                            <span className={styles.checkboxBox} aria-hidden="true" />
                        </label>

                        {serverError && <div className={styles.serverError}>{serverError}</div>}

                        <button className={styles.submit} type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Вход..." : "Войти"}
                        </button>

                        <button className={styles.forgot} type="button">
                            Забыли свой пароль?
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
