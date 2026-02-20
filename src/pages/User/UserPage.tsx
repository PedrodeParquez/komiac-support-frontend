import { useEffect, useState } from "react";
import styles from "./UserPage.module.css";
import Logo from "../../assets/images/logo.png";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import ExitIcon from "../../assets/icons/exit-icon.svg?react";
import MailIcon from "../../assets/icons/mail-icon.svg?react";
import QuestionIcon from "../../assets/icons/question-icon.svg?react";
import { listMyTickets } from "../../api/tickets";
import type { TicketListItem, TicketPriority, TicketStatus } from "../../api/tickets";

type Activity = {
    id: string;
    text: string;
    when: string;
};

const mockActivity: Activity[] = [
    { id: "000005", text: "Закрыто", when: "10 минут назад" },
    { id: "000005", text: "Назначен ответственный сотрудник", when: "20 минут назад" },
    { id: "000005", text: "Получен ответ на обращение", when: "32 минут назад" },
    { id: "000005", text: "Обращение отправлено", when: "45 минут назад" },
];

function statusLabel(s: TicketStatus) {
    if (s === "open") return "Открыто";
    if (s === "in_progress") return "В работе";
    return "Закрыто";
}

function priorityLabel(p: TicketPriority) {
    if (p === "high") return "Высокий";
    if (p === "medium") return "Средний";
    return "Низкий";
}

export function UserPage() {
    const { user, isAuthReady, logout } = useAuth();
    const navigate = useNavigate();

    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    // Роут-guard прямо в компоненте (чтобы не ловить 401 и странные состояния)
    useEffect(() => {
        if (!isAuthReady) return;

        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        if (user.role === "support") {
            navigate("/admin", { replace: true });
        }
    }, [isAuthReady, user, navigate]);

    // Загрузка тикетов только когда auth готов и user точно есть
    useEffect(() => {
        if (!isAuthReady) return;
        if (!user) return;
        if (user.role !== "user") return;

        let alive = true;

        (async () => {
            setIsLoading(true);
            setErr(null);
            try {
                const data = await listMyTickets();
                if (!alive) return;
                setTickets(data);
            } catch {
                if (!alive) return;
                setErr("Не удалось загрузить обращения.");
            } finally {
                if (!alive) return;
                setIsLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [isAuthReady, user]);

    // Пока идёт проверка авторизации — можно показывать пустой экран/лоадер
    if (!isAuthReady) {
        return <div className={styles.page} />;
    }

    // На всякий случай, пока редирект не сработал
    if (!user || user.role !== "user") {
        return <div className={styles.page} />;
    }

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <img className={styles.logo} src={Logo} alt="Комиац" />
                    <div className={styles.subtitle}>Техническая поддержка</div>
                </div>

                <div className={styles.profile}>
                    <div className={styles.avatar} aria-hidden="true">
                        {(user?.name?.trim()?.[0] ?? "П").toUpperCase()}
                    </div>

                    <div className={styles.profileMeta}>
                        <div className={styles.profileRow}>
                            <div className={styles.profileName}>{user?.name ?? "—"}</div>
                            <button className={styles.iconBtn} type="button" onClick={onLogout} aria-label="Выйти">
                                <ExitIcon width={15} height={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className={styles.content}>
                <div className={styles.topRow}>
                    <h1 className={styles.h1}>Мои обращения</h1>
                    <button className={styles.createBtnTop} type="button">
                        Создать обращение
                    </button>
                </div>

                <div className={styles.grid}>
                    <section className={styles.left}>
                        <div className={styles.tableCard}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Номер</th>
                                        <th>Тема</th>
                                        <th>Дата отправки</th>
                                        <th>Приоритет</th>
                                        <th>Ответственный</th>
                                        <th>Статус</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {isLoading && (
                                        <tr>
                                            <td className={styles.empty} colSpan={6}>
                                                Загрузка...
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading && err && (
                                        <tr>
                                            <td className={styles.empty} colSpan={6}>
                                                {err}
                                            </td>
                                        </tr>
                                    )}

                                    {!isLoading &&
                                        !err &&
                                        tickets.map((t) => (
                                            <tr key={t.id} className={styles.row}>
                                                <td>
                                                    <button className={styles.link} type="button">
                                                        {t.ticketNumber}
                                                    </button>
                                                </td>

                                                <td className={styles.ellipsis} title={t.title}>
                                                    {t.title}
                                                </td>

                                                <td className={styles.mono}>{t.createdAt}</td>
                                                <td>{priorityLabel(t.priority)}</td>

                                                <td className={t.assigneeName ? "" : styles.muted}>
                                                    {t.assigneeName ?? "Ещё не назначен"}
                                                </td>

                                                <td>
                                                    <span
                                                        className={`${styles.badge} ${t.status === "open"
                                                            ? styles.badgeOpen
                                                            : t.status === "in_progress"
                                                                ? (styles as any).badgeProgress ?? styles.badgeOpen
                                                                : styles.badgeClosed
                                                            }`}
                                                    >
                                                        {statusLabel(t.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                    {!isLoading && !err && tickets.length === 0 && (
                                        <tr>
                                            <td className={styles.empty} colSpan={6}>
                                                Обращений пока нет
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.cardsUnderTable} aria-hidden="true">
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Последние действия</div>
                                <div className={styles.activityList}>
                                    {mockActivity.map((a, idx) => (
                                        <div key={idx} className={styles.activityItem}>
                                            <button className={styles.activityLink} type="button">
                                                {a.id}
                                            </button>
                                            <div>
                                                <span className={styles.activityText}>{a.text}</span>
                                                <span className={styles.activityWhen}>{a.when}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Нужна помощь?</div>
                                <div className={styles.helpList}>
                                    <button className={styles.helpItem} type="button">
                                        <span className={styles.helpIcon} aria-hidden="true">
                                            <QuestionIcon width={18} height={18} />
                                        </span>
                                        <span className={styles.helpText}>Часто задаваемые вопросы</span>
                                    </button>

                                    <button className={styles.helpItem} type="button">
                                        <span className={styles.helpIcon} aria-hidden="true">
                                            <MailIcon width={18} height={18} />
                                        </span>
                                        <span className={styles.helpText}>Напишите нам</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className={styles.right}>
                        <button className={styles.createBtnSide} type="button">
                            Создать обращение
                        </button>

                        <div className={styles.card}>
                            <div className={styles.cardTitle}>Последние действия</div>
                            <div className={styles.activityList}>
                                {mockActivity.map((a, idx) => (
                                    <div key={idx} className={styles.activityItem}>
                                        <button className={styles.activityLink} type="button">
                                            {a.id}
                                        </button>
                                        <div>
                                            <span className={styles.activityText}>{a.text}</span>
                                            <span className={styles.activityWhen}>{a.when}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.card}>
                            <div className={styles.cardTitle}>Нужна помощь?</div>
                            <div className={styles.helpList}>
                                <button className={styles.helpItem} type="button">
                                    <span className={styles.helpIcon} aria-hidden="true">
                                        <QuestionIcon width={18} height={18} />
                                    </span>
                                    <span className={styles.helpText}>Часто задаваемые вопросы</span>
                                </button>

                                <button className={styles.helpItem} type="button">
                                    <span className={styles.helpIcon} aria-hidden="true">
                                        <MailIcon width={18} height={18} />
                                    </span>
                                    <span className={styles.helpText}>Напишите нам</span>
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}