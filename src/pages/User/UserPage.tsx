import styles from "./UserPage.module.css";
import Logo from "../../assets/images/logo.png";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import ExitIcon from "../../assets/icons/exit-icon.svg?react";
import MailIcon from "../../assets/icons/mail-icon.svg?react";
import QuestionIcon from "../../assets/icons/question-icon.svg?react";

type TicketStatus = "open" | "closed";
type TicketPriority = "low" | "medium" | "high";

type Ticket = {
    id: string;
    title: string;
    createdAt: string;
    priority: TicketPriority;
    assignee: string | null;
    status: TicketStatus;
};

type Activity = {
    id: string;
    text: string;
    when: string;
};

const mockTickets: Ticket[] = [
    {
        id: "000006",
        title: "Подключение нового сотрудника (Astra Linux и набор ПО)",
        createdAt: "12:31 08.02.2026",
        priority: "medium",
        assignee: null,
        status: "open",
    },
    {
        id: "000002",
        title: "Замена картриджа в принтере (кабинет 210)",
        createdAt: "09:30 19.01.2026",
        priority: "high",
        assignee: "Дмитрий Вяткин",
        status: "closed",
    },
    {
        id: "000001",
        title: "Установка ПК на рабочее место сотрудника отдела",
        createdAt: "11:23 15.02.2025",
        priority: "low",
        assignee: "Георгий Ким",
        status: "closed",
    },
];

const mockActivity: Activity[] = [
    { id: "000005", text: "Закрыто", when: "10 минут назад" },
    { id: "000005", text: "Назначен ответственный сотрудник", when: "20 минут назад" },
    { id: "000005", text: "Получен ответ на обращение", when: "32 минут назад" },
    { id: "000005", text: "Обращение отправлено", when: "45 минут назад" },
];

function statusLabel(s: TicketStatus) {
    return s === "open" ? "Открыто" : "Закрыто";
}

function priorityLabel(p: TicketPriority) {
    if (p === "high") return "Высокий";
    if (p === "medium") return "Средний";
    return "Низкий";
}

export function UserPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <div className={styles.page}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <img className={styles.logo} src={Logo} />
                    <div className={styles.subtitle}>Техническая поддержка</div>
                </div>

                <div className={styles.profile}>
                    <div className={styles.avatar} aria-hidden="true">
                        {user?.name.slice(0, 1).toUpperCase()}
                    </div>

                    <div className={styles.profileMeta}>
                        <div className={styles.profileRow}>
                            <div className={styles.profileName}>{user?.name ?? "—"}</div>
                            <button className={styles.iconBtn} type="button" onClick={onLogout} aria-label="Выйти"> <ExitIcon width={15} height={15} /> </button>
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
                                    {mockTickets.map((t) => (
                                        <tr key={`${t.id}-${t.createdAt}`} className={styles.row}>
                                            <td>
                                                <button className={styles.link} type="button">
                                                    {t.id}
                                                </button>
                                            </td>
                                            <td className={styles.ellipsis} title={t.title}>
                                                {t.title}
                                            </td>
                                            <td className={styles.mono}>{t.createdAt}</td>
                                            <td>{priorityLabel(t.priority)}</td>
                                            <td className={t.assignee ? "" : styles.muted}>
                                                {t.assignee ?? "Ещё не назначен"}
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.cardsUnderTable} aria-hidden="true">
                            <div className={styles.card}>
                                <div className={styles.cardTitle}>Последние действия</div>
                                <div className={styles.activityList}>
                                    {mockActivity.map((a) => (
                                        <div className={styles.activityItem}>
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
                                        <span className={styles.helpIcon} aria-hidden="true"><QuestionIcon width={18} height={18} /></span>
                                        <span className={styles.helpText}>Часто задаваемые вопросы</span>
                                    </button>
                                    <button className={styles.helpItem} type="button">
                                        <span className={styles.helpIcon} aria-hidden="true"><MailIcon width={18} height={18} /></span>
                                        <span className={styles.helpText}>Напишите нам</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                    <aside className={styles.right}>
                        <button className={styles.createBtnSide} type="button">Создать обращение</button>
                        <div className={styles.card}>
                            <div className={styles.cardTitle}>Последние действия</div>
                            <div className={styles.activityList}>
                                {mockActivity.map((a) => (
                                    <div className={styles.activityItem}>
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
                                    <span className={styles.helpIcon} aria-hidden="true"><QuestionIcon width={18} height={18} /></span>
                                    <span className={styles.helpText}>Часто задаваемые вопросы</span>
                                </button>
                                <button className={styles.helpItem} type="button">
                                    <span className={styles.helpIcon} aria-hidden="true"><MailIcon width={18} height={18} /></span>
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
