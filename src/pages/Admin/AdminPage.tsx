import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";
import Logo from "../../assets/images/logo.png";
import ExitIcon from "../../assets/icons/exit-icon.svg?react";
import SearchIcon from "../../assets/icons/search-icon.svg?react";
import { useAuth } from "../../auth/AuthContext";
import { type SupportUser, listSupportUsers } from "../../api/users";
import type { TicketDetail, TicketListItem, AdminTabKey } from "../../api/tickets";
import { closeTicketAdmin, getTicketAdmin, listTicketsAdmin, replyTicketAdmin } from "../../api/tickets";

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

function deptLabel(d: string | { name?: string } | null | undefined) {
    if (!d) return "—";
    if (typeof d === "string") return d.trim() ? d : "—";
    return d.name?.trim() ? d.name : "—";
}

export function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState<AdminTabKey>("new");
    const [query, setQuery] = useState("");
    const [tickets, setTickets] = useState<TicketListItem[]>([]);
    const [loadingList, setLoadingList] = useState(true);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [selected, setSelected] = useState<TicketDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [supportUsers, setSupportUsers] = useState<SupportUser[]>([]);
    const [assigneeId, setAssigneeId] = useState<number | "">("");
    const [replyText, setReplyText] = useState("");
    const [savingReply, setSavingReply] = useState(false);
    const [closing, setClosing] = useState(false);

    const avatarLetter = useMemo(() => {
        const n = user?.name?.trim();
        return n ? n.slice(0, 1).toUpperCase() : "—";
    }, [user?.name]);

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    const isClosed = selected?.status === "closed";
    const hasReply = !!selected?.supportReply?.trim();
    const canClose = selected?.status === "in_progress";

    const loadSupport = async () => {
        try {
            const list = await listSupportUsers();
            setSupportUsers(list);
        } catch (e) {
            console.error(e);
        }
    };

    const loadTickets = async () => {
        try {
            setLoadingList(true);

            const q = query.trim() ? query.trim() : undefined;
            const list = await listTicketsAdmin({ tab, q });

            setTickets(list);

            if (!selectedId && list[0]?.id) setSelectedId(list[0].id);
            if (selectedId && !list.some((t) => t.id === selectedId)) setSelectedId(list[0]?.id ?? null);
        } catch (e) {
            console.error(e);

            alert("Ошибка сети при загрузке списка (см. console).");
        } finally {
            setLoadingList(false);
        }
    };

    const loadDetail = async (id: number) => {
        try {
            setLoadingDetail(true);

            const t = await getTicketAdmin(id);

            setSelected(t);
            setAssigneeId(t.assigneeId ?? "");
            setReplyText(t.supportReply ?? "");
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        void loadSupport();
    }, []);

    useEffect(() => {
        void loadTickets();
    }, [tab, query]);

    useEffect(() => {
        if (!selectedId) {
            setSelected(null);
            setAssigneeId("");
            setReplyText("");
            return;
        }
        void loadDetail(selectedId);
    }, [selectedId]);

    const saveReply = async () => {
        if (!selectedId || !selected) return;

        const reply = replyText.trim();

        try {
            setSavingReply(true);

            await replyTicketAdmin({ id: selectedId, assigneeId, reply });

            await loadDetail(selectedId);
            await loadTickets();
        } catch (e) {
            console.error(e);
        } finally {
            setSavingReply(false);
        }
    };

    const closeTicket = async () => {
        if (!selectedId) return;
        if (!canClose) return;

        try {
            setClosing(true);

            await closeTicketAdmin(selectedId);

            await loadDetail(selectedId);
            await loadTickets();
        } catch (e) {
            console.error(e);
        } finally {
            setClosing(false);
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
                    <div className={styles.topLeft}>
                        <h1 className={styles.h1}>Обращения</h1>
                        <div className={styles.tabsRow}>
                            <nav className={styles.tabs}>
                                <button
                                    className={`${styles.tab} ${tab === "all" ? styles.tabActive : ""}`}
                                    type="button"
                                    onClick={() => setTab("all")}
                                >
                                    Все
                                </button>
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
                                        <th>Ответственный</th>
                                        <th>Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingList ? (
                                        <tr>
                                            <td className={styles.muted} colSpan={5} style={{ padding: 14 }}>
                                                Загрузка...
                                            </td>
                                        </tr>
                                    ) : tickets.length === 0 ? (
                                        <tr>
                                            <td className={styles.empty} colSpan={5}>
                                                Ничего не найдено
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
                                            <textarea className={styles.textarea} value={selected.message ?? ""} readOnly />
                                            <div className={styles.detailRow}>
                                                <div className={styles.detailLabel}>От</div>
                                                <div className={styles.detailValue}>
                                                    <span className={styles.fromName}>{selected.fromName ?? "—"}</span>
                                                    {deptLabel(selected.dept) !== "—" && (
                                                        <>
                                                            <span className={styles.fromSep}> из отдела </span>
                                                            <span className={styles.fromDept}>{deptLabel(selected.dept)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className={styles.detailRowCol}>
                                                <div className={styles.detailLabel}>Ответственный</div>
                                                <select
                                                    className={styles.select}
                                                    value={assigneeId}
                                                    onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : "")}
                                                    disabled={isClosed || hasReply}
                                                >
                                                    <option value="" disabled>
                                                        Выбрать сотрудника
                                                    </option>
                                                    {supportUsers.length === 0 ? (
                                                        <option value="" disabled>
                                                            (админы не загружены)
                                                        </option>
                                                    ) : (
                                                        supportUsers.map((u) => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.name}
                                                            </option>
                                                        ))
                                                    )}
                                                </select>
                                            </div>
                                            <div className={styles.detailRowCol}>
                                                <div className={styles.detailLabel}>Ответ</div>
                                                <textarea
                                                    className={styles.textarea}
                                                    placeholder="Напишите ответ пользователю"
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    readOnly={hasReply || isClosed}
                                                />
                                            </div>
                                            {!hasReply && !isClosed && (
                                                <button className={styles.primaryBtn} type="button" onClick={saveReply} disabled={savingReply}>
                                                    {savingReply ? "Сохранение..." : "Сохранить ответ"}
                                                </button>
                                            )}
                                            {canClose && (
                                                <button
                                                    className={styles.primaryBtn}
                                                    type="button"
                                                    onClick={closeTicket}
                                                    disabled={closing}
                                                    style={{ marginTop: !hasReply && !isClosed ? 10 : 0, background: "#2e7d32" }}
                                                >
                                                    {closing ? "Закрытие..." : "Закрыть обращение"}
                                                </button>
                                            )}
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