import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";
import Logo from "../../assets/images/logo.png";
import ExitIcon from "../../assets/icons/exit-icon.svg?react";
import SearchIcon from "../../assets/icons/search-icon.svg?react";
import { useAuth } from "../../auth/AuthContext";

type TicketStatus = "open" | "in_progress" | "closed";
type TicketPriority = "low" | "medium" | "high";

type Ticket = {
    id: string;
    title: string;
    createdAt: string;
    priority: TicketPriority;
    assignee: string | null;
    status: TicketStatus;

    topic?: string;
    fromName?: string;
    dept?: string;
    phone?: string;
    message?: string;
};

type TabKey = "new" | "in_progress" | "closed" | "all";

const mockTickets: Ticket[] = [
    {
        id: "000007",
        title: "Не работает интернет на рабочем месте в кабинете 305",
        createdAt: "10:48 07.02.2026",
        priority: "high",
        assignee: null,
        status: "open",
        topic: "Не работает интернет на рабочем месте",
        fromName: "Ирина Белова",
        dept: "Бухгалтерский отдел",
        phone: "412-321",
        message: "Интернет не работает со вчерашнего вечера, прошу помочь.",
    },
    {
        id: "000006",
        title: "Подключение нового сотрудника (Astra Linux и набор ПО)",
        createdAt: "08:23 06.02.2026",
        priority: "medium",
        assignee: null,
        status: "open",
        topic: "Подключение нового сотрудника",
        fromName: "Ирина Белова",
        dept: "Бухгалтерский отдел",
        phone: "412-321",
        message:
            "Здравствуйте, к нам пришёл новый сотрудник в отдел, нужно установить Astra Linux и все необходимые программы на рабочий ПК.",
    },
    {
        id: "000005",
        title: "Забыла пароль от учётной записи",
        createdAt: "09:40 08.02.2026",
        priority: "low",
        assignee: "Дмитрий Вяткин",
        status: "in_progress",
        topic: "Забыла пароль от учётной записи",
        fromName: "Марина Шпегель",
        dept: "Отдел кадров",
        phone: "410-100",
        message: "Не получается войти в учетную запись, помогите восстановить пароль.",
    },
    {
        id: "000004",
        title: "Восстановление учётной записи после смены ПК",
        createdAt: "11:23 07.02.2026",
        priority: "medium",
        assignee: "Иван Машин",
        status: "in_progress",
        topic: "Восстановление учётной записи",
        fromName: "Ольга Иванова",
        dept: "Склад",
        phone: "411-222",
        message: "После смены ПК не могу зайти в систему, нужна помощь.",
    },
    {
        id: "000003",
        title: "Не работает интернет на 2 этаже, возможно проблема с роутером",
        createdAt: "11:20 01.02.2026",
        priority: "high",
        assignee: "Иван Машин",
        status: "closed",
        topic: "Не работает интернет на 2 этаже",
        fromName: "Алексей Петров",
        dept: "Продажи",
        phone: "400-111",
        message: "Интернет восстановился, спасибо.",
    },
    {
        id: "000002",
        title: "Замена картриджа в принтере (кабинет 210)",
        createdAt: "09:30 19.01.2026",
        priority: "medium",
        assignee: "Дмитрий Вяткин",
        status: "closed",
        topic: "Замена картриджа в принтере",
        fromName: "Екатерина Смирнова",
        dept: "Бухгалтерия",
        phone: "402-222",
        message: "Картридж заменен, всё работает.",
    },
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

function tabToStatuses(tab: TabKey): TicketStatus[] {
    if (tab === "new") return ["open"];
    if (tab === "in_progress") return ["in_progress"];
    if (tab === "closed") return ["closed"];
    return ["open", "in_progress", "closed"];
}

export function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState<TabKey>("new");
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const allowed = new Set(tabToStatuses(tab));
        const q = query.trim().toLowerCase();

        return mockTickets.filter((t) => {
            if (!allowed.has(t.status)) return false;
            if (!q) return true;

            return t.id.includes(q) || t.title.toLowerCase().includes(q);
        });
    }, [tab, query]);

    const [selectedId, setSelectedId] = useState<string>(mockTickets[0]?.id ?? "000001");

    const selected = useMemo(() => {
        const inFiltered = filtered.find((t) => t.id === selectedId);
        if (inFiltered) return inFiltered;

        if (filtered[0]) return filtered[0];

        return mockTickets[0];
    }, [filtered, selectedId]);

    const nextSelectedId = useMemo(() => {
        if (filtered.some((t) => t.id === selectedId)) return selectedId;
        return filtered[0]?.id ?? selectedId;
    }, [filtered, selectedId]);

    if (nextSelectedId !== selectedId) {
        setSelectedId(nextSelectedId);
    }

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const isClosed = selected.status === "closed";

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
                    <div className={styles.topLeft}>
                        <h1 className={styles.h1}>Обращения</h1>

                        <div className={styles.tabsRow}>
                            <nav className={styles.tabs} aria-label="Фильтр обращений">
                                <button
                                    className={`${styles.tab} ${tab === "new" ? styles.tabActive : ""}`}
                                    type="button"
                                    onClick={() => setTab("new")}
                                >
                                    Новые
                                </button>
                                <button
                                    className={`${styles.tab} ${tab === "in_progress" ? styles.tabActive : ""}`}
                                    type="button"
                                    onClick={() => setTab("in_progress")}
                                >
                                    В работе
                                </button>
                                <button
                                    className={`${styles.tab} ${tab === "closed" ? styles.tabActive : ""}`}
                                    type="button"
                                    onClick={() => setTab("closed")}
                                >
                                    Закрытые
                                </button>
                                <button
                                    className={`${styles.tab} ${tab === "all" ? styles.tabActive : ""}`}
                                    type="button"
                                    onClick={() => setTab("all")}
                                >
                                    Все
                                </button>
                            </nav>

                            <div className={styles.search}>
                                <span className={styles.searchIcon} aria-hidden="true">
                                    <SearchIcon width={18} height={18} />
                                </span>
                                <input
                                    className={styles.searchInput}
                                    placeholder="Поиск обращений"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.topRight} />
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
                                    {filtered.map((t) => (
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
                                                    {t.id}
                                                </button>
                                            </td>
                                            <td className={styles.ellipsis} title={t.title}>
                                                {t.title}
                                            </td>
                                            <td className={styles.mono}>{t.createdAt}</td>
                                            <td>{priorityLabel(t.priority)}</td>
                                            <td className={t.assignee ? "" : styles.muted}>{t.assignee ?? "Ещё не назначен"}</td>
                                            <td>
                                                <span
                                                    className={`${styles.badge} ${t.status === "open"
                                                        ? styles.badgeOpen
                                                        : t.status === "in_progress"
                                                            ? styles.badgeProgress
                                                            : styles.badgeClosed
                                                        }`}
                                                >
                                                    {statusLabel(t.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td className={styles.empty} colSpan={6}>
                                                Ничего не найдено
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <aside className={styles.right}>
                        <div className={styles.detailCard}>
                            <div className={styles.detailHead}>
                                <div className={styles.detailTitle}>Обращение {selected.id}</div>
                                <div className={styles.detailDate}>от {selected.createdAt}</div>
                            </div>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailRow}>
                                    <div className={styles.detailLabel}>Тема:</div>
                                    <div className={styles.detailValue}>{selected.topic ?? selected.title ?? "—"}</div>
                                </div>
                                <div className={styles.detailRow}>
                                    <div className={styles.detailLabel}>От кого:</div>
                                    <div className={styles.detailValue}>{selected.fromName ?? "—"}</div>
                                </div>
                                <div className={styles.detailRow}>
                                    <div className={styles.detailLabel}>Отдел:</div>
                                    <div className={styles.detailValue}>{selected.dept ?? "—"}</div>
                                </div>
                                <div className={styles.detailRow}>
                                    <div className={styles.detailLabel}>Телефон:</div>
                                    <div className={styles.detailValue}>{selected.phone ?? "—"}</div>
                                </div>
                                <div className={styles.detailRowCol}>
                                    <div className={styles.detailLabel}>Сообщение</div>
                                    <textarea
                                        className={styles.textarea}
                                        defaultValue={selected.message ?? ""}
                                        rows={3}
                                        readOnly
                                    />
                                </div>
                                <div className={styles.detailRowCol}>
                                    <div className={styles.detailLabel}>Ответственный</div>
                                    <select className={styles.select} defaultValue="" disabled={isClosed}>
                                        <option value="" disabled>
                                            Выбрать сотрудника
                                        </option>
                                        <option>Иван Машин</option>
                                        <option>Дмитрий Вяткин</option>
                                    </select>
                                </div>
                                {!isClosed && (
                                    <>
                                        <div className={styles.detailRowCol}>
                                            <div className={styles.detailLabel}>Сообщение</div>
                                            <textarea className={styles.textarea} placeholder="Напишите что-нибудь" rows={3} />
                                        </div>
                                        <button className={styles.primaryBtn} type="button">
                                            Отправить
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
