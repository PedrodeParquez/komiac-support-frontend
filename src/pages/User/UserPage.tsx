import { useEffect, useMemo, useState } from "react";
import styles from "./UserPage.module.css";
import Logo from "../../assets/images/logo.png";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import ExitIcon from "../../assets/icons/exit-icon.svg?react";
import MailIcon from "../../assets/icons/mail-icon.svg?react";
import QuestionIcon from "../../assets/icons/question-icon.svg?react";
import { createMyTicket, getMyTicket, listMyTickets, type TicketListItem, type TicketDetail } from "../../api/tickets";

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
    return "Закрыто";
}

function statusBadgeClass(s: string) {
    if (s === "open") return styles.badgeOpen;
    if (s === "in_progress") return styles.badgeProgress;
    return styles.badgeClosed;
}

export function UserPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selected, setSelected] = useState<TicketDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [creating, setCreating] = useState(false);

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
            setLoadingList(true);

            const sorted = await listMyTickets();
            setTickets(sorted);

            if (!selectedId && sorted[0]?.id) setSelectedId(sorted[0].id);
            if (selectedId && !sorted.some((t) => t.id === selectedId)) setSelectedId(sorted[0]?.id ?? null);
        } catch (e) {
            console.error(e);
            alert("Ошибка сети при загрузке обращений (см. console).");
        } finally {
            setLoadingList(false);
        }
    };

    const loadDetail = async (id: number) => {
        try {
            setLoadingDetail(true);
            const detail = await getMyTicket(id);
            setSelected(detail);
        } catch (e) {
            console.error(e);
            alert("Ошибка сети при загрузке обращения (см. console).");
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        void loadMyTickets();
    }, []);

    useEffect(() => {
        if (!selectedId) {
            setSelected(null);
            return;
        }
        void loadDetail(selectedId);
    }, [selectedId]);

    const submitCreate = async () => {
        const t = title.trim();
        const d = description.trim();

        if (!t) {
            alert("Введите тему обращения");
            return;
        }
        if (!d) {
            alert("Введите описание");
            return;
        }

        try {
            setCreating(true);

            await createMyTicket({ title: t, description: d });

            setTitle("");
            setDescription("");

            await loadMyTickets();
        } catch (e) {
            console.error(e);
            alert("Ошибка сети при создании обращения (см. console).");
        } finally {
            setCreating(false);
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
                <div className={styles.grid}>
                    <section className={styles.left}>
                        <div className={styles.aboveTable}>
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
                                <div className={styles.cardTitle}>Создать обращение</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formLabelInline}>Тема</div>
                                        <input
                                            className={styles.input}
                                            placeholder="Например: Нужно поменять пароль"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className={styles.formRowCol}>
                                        <div className={styles.formLabel}>Описание</div>
                                        <textarea
                                            className={styles.textarea}
                                            placeholder="Опишите проблему"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                    <button className={styles.primaryBtn} type="button" onClick={submitCreate} disabled={creating}>
                                        {creating ? "Создание..." : "Отправить обращение"}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <h1 className={styles.h1}>Мои обращения</h1>
                        <div className={styles.tableCard}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Номер</th>
                                        <th>Тема</th>
                                        <th>Дата отправки</th>
                                        <th>Ответственный</th>
                                        <th>Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingList ? (
                                        <tr>
                                            <td colSpan={5} className={styles.muted} style={{ padding: 14 }}>
                                                Загрузка...
                                            </td>
                                        </tr>
                                    ) : tickets.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className={styles.emptyCell}>
                                                Пока нет обращений
                                            </td>
                                        </tr>
                                    ) : (
                                        tickets.map((t) => (
                                            <tr
                                                key={t.id}
                                                className={`${styles.row} ${t.id === selectedId ? styles.rowActive : ""}`}
                                                onClick={() => setSelectedId(t.id)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") setSelectedId(t.id);
                                                }}
                                            >
                                                <td>
                                                    <button
                                                        className={styles.link}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedId(t.id);
                                                        }}
                                                    >
                                                        {t.ticketNumber}
                                                    </button>
                                                </td>
                                                <td className={styles.ellipsis} title={t.title}>
                                                    {t.title}
                                                </td>
                                                <td className={styles.mono}>{t.createdAt}</td>
                                                <td className={t.assigneeName ? "" : styles.muted}>{t.assigneeName ?? "Ещё не назначен"}</td>
                                                <td>
                                                    <span className={`${styles.badge} ${statusBadgeClass(t.status)}`}>{statusLabel(t.status)}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className={styles.helpWideCard}>
                            <div className={styles.cardTitle} style={{ marginBottom: 2 }}>
                                Нужна помощь?
                            </div>
                            <div className={styles.helpWideRow}>
                                <button className={styles.helpWideItem} type="button">
                                    <span className={styles.helpIcon} aria-hidden="true">
                                        <QuestionIcon width={18} height={18} />
                                    </span>
                                    <span className={styles.helpText}>Часто задаваемые вопросы</span>
                                </button>
                                <button className={styles.helpWideItem} type="button">
                                    <span className={styles.helpIcon} aria-hidden="true">
                                        <MailIcon width={18} height={18} />
                                    </span>
                                    <span className={styles.helpText}>Напишите нам</span>
                                </button>
                            </div>
                        </div>
                    </section>
                    <aside className={styles.right}>
                        {!selected ? (
                            <div className={styles.emptyDetail}>Выберите обращение</div>
                        ) : (
                            <div className={styles.detailCard}>
                                <div className={styles.detailHead}>
                                    <div className={styles.detailTitle}>{`Обращение ${selected.ticketNumber}`}</div>
                                    <div className={styles.detailDate}>{`от ${selected.createdAt}`}</div>
                                </div>

                                <div className={styles.detailGrid}>
                                    {loadingDetail ? (
                                        <div className={styles.muted}>Загрузка...</div>
                                    ) : (
                                        <>
                                            <div className={styles.detailRow}>
                                                <div className={styles.detailLabel}>Тема:</div>
                                                <div className={styles.detailValue}>{selected.topic ?? selected.title ?? "—"}</div>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <div className={styles.detailLabel}>Ответственный:</div>
                                                <div className={styles.detailValue}>{selected.assigneeName ?? "Ещё не назначен"}</div>
                                            </div>
                                            <div className={styles.detailRowCol}>
                                                <div className={styles.detailLabel}>Сообщение</div>
                                                <textarea className={styles.textarea} value={selected.message ?? ""} readOnly />
                                            </div>
                                            <div className={styles.detailRowCol}>
                                                <div className={styles.detailLabel}>Ответ поддержки</div>
                                                <textarea
                                                    className={styles.textarea}
                                                    value={"Ответа пока нет"}
                                                    readOnly
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </div>
    );
}