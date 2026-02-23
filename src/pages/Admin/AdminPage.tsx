import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";
import Logo from "../../assets/images/logo.png";
import ExitIcon from "../../assets/icons/exit-icon.svg?react";
import SearchIcon from "../../assets/icons/search-icon.svg?react";
import { useAuth } from "../../auth/AuthContext";
import { getAccessToken } from "../../auth/tokenStorage";

type TabKey = "new" | "in_progress" | "closed" | "all";

type Department = {
    id: number;
    name: string;
};

type TicketListItem = {
    id: number;
    ticketNumber: string;
    title: string;
    createdAt: string;
    priority: string;
    status: string;
    assigneeName?: string;
    dept?: string | Department | null;
};

type TicketDetail = {
    id: number;
    ticketNumber: string;
    title: string;
    createdAt: string;
    priority: string;
    status: string;
    assigneeId?: number;
    assigneeName?: string;

    topic: string;

    fromName?: string;
    fromUser?: {
        name?: string;
        phone?: string | null;
        department?: string | Department | null;
        dept?: string | Department | null;
    };
    user?: {
        name?: string;
        phone?: string | null;
        department?: string | Department | null;
        dept?: string | Department | null;
    };

    dept?: string | Department | null;
    department?: string | Department | null;
    phone?: string | null;
    phoneNumber?: string | null;

    message: string;
    supportReply?: string;
    repliedAt?: string;
};

type SupportUser = { id: number; name: string };

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

function priorityLabel(p: string) {
    if (p === "high") return "Высокий";
    if (p === "medium") return "Средний";
    return "Низкий";
}

function deptLabel(d: string | { name?: string } | null | undefined) {
    if (!d) return "—";
    if (typeof d === "string") return d.trim() ? d : "—";
    return d.name?.trim() ? d.name : "—";
}

function phoneLabel(p: unknown) {
    if (typeof p !== "string") return "—";
    const s = p.trim();
    return s ? s : "—";
}

function normalizeTicketDetail(raw: any): TicketDetail {
    const dept =
        raw?.dept ??
        raw?.department ??
        raw?.fromUser?.department ??
        raw?.fromUser?.dept ??
        raw?.user?.department ??
        raw?.user?.dept ??
        null;

    const phone =
        raw?.phone ??
        raw?.phoneNumber ??
        raw?.fromUser?.phone ??
        raw?.fromUser?.phoneNumber ??
        raw?.user?.phone ??
        raw?.user?.phoneNumber ??
        null;

    const fromName = raw?.fromName ?? raw?.from_user_name ?? raw?.fromUser?.name ?? raw?.user?.name ?? "—";

    return {
        ...raw,
        dept,
        phone,
        fromName,
    } as TicketDetail;
}

function normalizeTicketListItem(raw: any): TicketListItem {
    const dept = raw?.dept ?? raw?.department ?? null;
    return { ...raw, dept } as TicketListItem;
}

import { refresh } from "../../api/auth";

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
    const baseUrl = import.meta.env.VITE_API_URL as string;
    if (!baseUrl) throw new Error("VITE_API_URL is empty. Set .env like http://localhost:8080");

    const doFetch = (token: string | null) => {
        const headers = new Headers(init?.headers);
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(`${baseUrl}${path}`, { ...init, headers });
    };

    const t1 = getAccessToken();
    let res = await doFetch(t1);
    if (res.status !== 401) return res;

    try {
        await refresh();
        const t2 = getAccessToken();
        res = await doFetch(t2);
        return res;
    } catch {
        return res;
    }
}

export function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState<TabKey>("new");
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

    const isClosed = selected?.status === "closed" || selected?.status === "resolved";
    const hasReply = !!selected?.supportReply?.trim();
    const canClose = selected?.status === "in_progress";

    const loadSupportUsers = async () => {
        const res = await authedFetch("/users/support", { method: "GET" });
        if (res.status === 401) {
            alert("Сессия истекла. Пожалуйста, войдите снова.");
            await onLogout();
            return;
        }
        if (!res.ok) {
            const t = await res.text();
            console.error("GET /users/support:", res.status, t);
            return;
        }
        const data = (await res.json()) as { users: SupportUser[] };
        setSupportUsers(Array.isArray(data.users) ? data.users : []);
    };

    const loadTickets = async () => {
        try {
            setLoadingList(true);

            const qs = new URLSearchParams();
            qs.set("tab", tab);
            if (query.trim()) qs.set("q", query.trim());

            const res = await authedFetch(`/tickets?${qs.toString()}`, { method: "GET" });

            if (res.status === 401) {
                alert("Сессия истекла. Пожалуйста, войдите снова.");
                await onLogout();
                return;
            }
            if (res.status === 403) {
                alert("Недостаточно прав. Эта страница для роли support.");
                return;
            }
            if (!res.ok) {
                const text = await res.text();
                console.error("GET /tickets failed:", res.status, text);
                alert(`Ошибка загрузки обращений: ${res.status}`);
                return;
            }

            const data = (await res.json()) as { tickets: any[] };
            const listRaw = Array.isArray(data.tickets) ? data.tickets : [];
            const list = listRaw.map(normalizeTicketListItem);

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

            const res = await authedFetch(`/tickets/${id}`, { method: "GET" });
            if (res.status === 401) {
                alert("Сессия истекла. Пожалуйста, войдите снова.");
                await onLogout();
                return;
            }
            if (res.status === 403) {
                alert("Недостаточно прав. Эта страница для роли support.");
                return;
            }
            if (!res.ok) {
                const text = await res.text();
                console.error("GET /tickets/:id failed:", res.status, text);
                alert(`Ошибка загрузки тикета: ${res.status}`);
                return;
            }

            const data = (await res.json()) as { ticket: any };
            const normalized = normalizeTicketDetail(data.ticket);

            setSelected(normalized);
            setAssigneeId(normalized.assigneeId ?? "");
            setReplyText(normalized.supportReply ?? "");
        } catch (e) {
            console.error(e);
            alert("Ошибка сети при загрузке тикета (см. console).");
        } finally {
            setLoadingDetail(false);
        }
    };

    useEffect(() => {
        void loadSupportUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void loadTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, query]);

    useEffect(() => {
        if (!selectedId) {
            setSelected(null);
            setAssigneeId("");
            setReplyText("");
            return;
        }
        void loadDetail(selectedId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId]);

    const saveReply = async () => {
        if (!selectedId || !selected) return;

        const reply = replyText.trim();
        if (!reply) {
            alert("Введите ответ");
            return;
        }
        if (assigneeId === "") {
            alert("Выберите ответственного");
            return;
        }

        try {
            setSavingReply(true);

            const res = await authedFetch(`/tickets/${selectedId}/reply`, {
                method: "POST",
                body: JSON.stringify({ assigneeId, reply }),
            });

            if (res.status === 401) {
                alert("Сессия истекла. Пожалуйста, войдите снова.");
                await onLogout();
                return;
            }
            if (!res.ok) {
                const t = await res.text();
                console.error("reply failed:", res.status, t);
                alert(`Ошибка сохранения ответа: ${res.status}`);
                return;
            }

            await loadDetail(selectedId);
            await loadTickets();
        } catch (e) {
            console.error(e);
            alert("Ошибка сети при сохранении (см. console).");
        } finally {
            setSavingReply(false);
        }
    };

    const closeTicket = async () => {
        if (!selectedId) return;
        if (!canClose) return;

        // eslint-disable-next-line no-restricted-globals
        if (!confirm("Закрыть обращение?")) return;

        try {
            setClosing(true);

            const res = await authedFetch(`/tickets/${selectedId}/close`, { method: "POST" });
            if (res.status === 401) {
                alert("Сессия истекла. Пожалуйста, войдите снова.");
                await onLogout();
                return;
            }
            if (!res.ok) {
                const t = await res.text();
                console.error("close failed:", res.status, t);
                alert(`Ошибка закрытия: ${res.status}`);
                return;
            }

            await loadDetail(selectedId);
            await loadTickets();
        } catch (e) {
            console.error(e);
            alert("Ошибка сети при закрытии (см. console).");
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
                            <nav className={styles.tabs} aria-label="Фильтр обращений">
                                <button className={`${styles.tab} ${tab === "new" ? styles.tabActive : ""}`} type="button" onClick={() => setTab("new")}>
                                    Новые
                                </button>
                                <button
                                    className={`${styles.tab} ${tab === "in_progress" ? styles.tabActive : ""}`}
                                    type="button"
                                    onClick={() => setTab("in_progress")}
                                >
                                    В работе
                                </button>
                                <button className={`${styles.tab} ${tab === "closed" ? styles.tabActive : ""}`} type="button" onClick={() => setTab("closed")}>
                                    Закрытые
                                </button>
                                <button className={`${styles.tab} ${tab === "all" ? styles.tabActive : ""}`} type="button" onClick={() => setTab("all")}>
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
                                    {loadingList ? (
                                        <tr>
                                            <td className={styles.muted} colSpan={6} style={{ padding: 14 }}>
                                                Загрузка...
                                            </td>
                                        </tr>
                                    ) : tickets.length === 0 ? (
                                        <tr>
                                            <td className={styles.empty} colSpan={6}>
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
                                                <td>{priorityLabel(t.priority)}</td>
                                                <td className={t.assigneeName ? "" : styles.muted}>
                                                    {t.assigneeName ?? "Ещё не назначен"}
                                                </td>
                                                <td>
                                                    <span className={`${styles.badge} ${statusBadgeClass(t.status)}`}>
                                                        {statusLabel(t.status)}
                                                    </span>
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
                                            <div className={styles.detailRow}>
                                                <div className={styles.detailLabel}>От кого:</div>
                                                <div className={styles.detailValue}>{selected.fromName ?? "—"}</div>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <div className={styles.detailLabel}>Отдел:</div>
                                                <div className={styles.detailValue}>{deptLabel(selected.dept)}</div>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <div className={styles.detailLabel}>Телефон:</div>
                                                <div className={styles.detailValue}>{phoneLabel(selected.phone)}</div>
                                            </div>
                                            <div className={styles.detailRowCol}>
                                                <div className={styles.detailLabel}>Сообщение</div>
                                                <textarea className={styles.textarea} value={selected.message ?? ""} rows={3} readOnly />
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
                                                    rows={3}
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