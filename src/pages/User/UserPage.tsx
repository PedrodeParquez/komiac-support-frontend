import { useEffect, useMemo, useState } from "react";
import styles from "./UserPage.module.css";
import Logo from "../../assets/images/logo.png";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import ExitIcon from "../../assets/icons/exit-icon.svg?react";
import MailIcon from "../../assets/icons/mail-icon.svg?react";
import QuestionIcon from "../../assets/icons/question-icon.svg?react";
import { CreateTicketModal, type CreateTicketPayload } from "../../components/CreateTicketModal/CreateTicketModal";
import { getAccessToken } from "../../auth/tokenStorage";
import { refresh } from "../../api/auth";

type TicketListItem = {
    id: number;
    ticketNumber: string;
    title: string;
    createdAt: string;
    priority: string;
    status: string;
    assigneeName?: string;
};

type Activity = { id: string; text: string; when: string };

const mockActivity: Activity[] = [
    { id: "000005", text: "Закрыто", when: "10 минут назад" },
    { id: "000005", text: "Назначен ответственный сотрудник", when: "20 минут назад" },
    { id: "000005", text: "Получен ответ на обращение", when: "32 минут назад" },
    { id: "000005", text: "Обращение отправлено", when: "45 минут назад" },
];

function statusLabel(s: string) {
    if (s === "open") return "Открыто";
    if (s === "in_progress") return "В работе";
    if (s === "resolved") return "Решено";
    return "Закрыто";
}

function priorityLabel(p: string) {
    if (p === "high") return "Высокий";
    if (p === "medium") return "Средний";
    return "Низкий";
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
    const baseUrl = import.meta.env.VITE_API_URL as string;
    if (!baseUrl) {
        throw new Error("VITE_API_URL is empty. Set it in .env like http://localhost:8080");
    }

    const doFetch = (token: string | null) => {
        const headers = new Headers(init?.headers);

        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
        if (token) headers.set("Authorization", `Bearer ${token}`);

        return fetch(`${baseUrl}${path}`, {
            ...init,
            headers,
        });
    };

    const token1 = getAccessToken();
    let res = await doFetch(token1);
    if (res.status !== 401) return res;

    try {
        await refresh();

        const token2 = getAccessToken();
        res = await doFetch(token2);
        return res;
    } catch {
        return res;
    }
}

export function UserPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [loading, setLoading] = useState(true);

    const openCreate = () => setIsCreateOpen(true);
    const closeCreate = () => setIsCreateOpen(false);

    const avatarLetter = useMemo(() => {
        const n = user?.name?.trim();
        return n ? n.slice(0, 1).toUpperCase() : "—";
    }, [user?.name]);

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const loadMyTickets = async () => {
        try {
            setLoading(true);

            const res = await authedFetch("/tickets/my", { method: "GET" });

            if (res.status === 401) {
                alert("Сессия истекла. Пожалуйста, войдите снова.");
                await onLogout();
                return;
            }

            if (!res.ok) {
                const text = await res.text();
                console.error("Failed to load tickets:", res.status, text);
                alert(`Ошибка загрузки обращений: ${res.status}`);
                return;
            }

            const data = (await res.json()) as { tickets: TicketListItem[] };
            const list = Array.isArray(data.tickets) ? data.tickets : [];
            const sorted = [...list].sort((a, b) => b.id - a.id);

            setTickets(sorted);
        } catch (e) {
            console.error(e);
            alert("Ошибка сети при загрузке обращений (см. console).");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadMyTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreate = async (payload: CreateTicketPayload) => {
        try {
            const body = {
                title: payload.title.trim(),
                description: payload.description.trim(),
                priority: payload.priority,
            };

            const res = await authedFetch("/tickets", {
                method: "POST",
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Create ticket failed:", res.status, text);
                alert(`Ошибка создания обращения: ${res.status}`);
                return;
            }

            const data = (await res.json()) as { ticket: any };
            console.log("Created ticket:", data.ticket);

            closeCreate();

            await loadMyTickets();
        } catch (e) {

        }
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <img className={styles.logo} src={Logo} alt="Комиац" />
                    <div className={styles.subtitle}>Техническая поддержка</div>
                </div>

                <div className={styles.profile}>
                    <div className={styles.avatar} aria-hidden="true">
                        {avatarLetter}
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
                    <button className={styles.createBtnTop} type="button" onClick={openCreate}>
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
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className={styles.muted} style={{ padding: 14 }}>
                                                Загрузка...
                                            </td>
                                        </tr>
                                    ) : tickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className={styles.emptyCell}>
                                                Пока нет обращений
                                            </td>
                                        </tr>
                                    ) : (
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
                                                        className={`${styles.badge} ${t.status === "open" ? styles.badgeOpen : styles.badgeClosed
                                                            }`}
                                                    >
                                                        {statusLabel(t.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className={styles.cardsUnderTable} aria-hidden="true">
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Последние действия</div>
                                <div className={styles.activityList}>
                                    {mockActivity.map((a, idx) => (
                                        <div key={`${a.id}-${a.text}-${idx}`} className={styles.activityItem}>
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
                        <button className={styles.createBtnSide} type="button" onClick={openCreate}>
                            Создать обращение
                        </button>

                        <div className={styles.card}>
                            <div className={styles.cardTitle}>Последние действия</div>
                            <div className={styles.activityList}>
                                {mockActivity.map((a, idx) => (
                                    <div key={`${a.id}-${a.text}-${idx}`} className={styles.activityItem}>
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
            <CreateTicketModal open={isCreateOpen} onClose={closeCreate} onSubmit={handleCreate} />
        </div>
    );
}