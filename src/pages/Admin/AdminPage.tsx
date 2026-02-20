import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AdminPage.module.css";
import Logo from "../../assets/images/logo.png";
import ExitIcon from "../../assets/icons/exit-icon.svg?react";
import SearchIcon from "../../assets/icons/search-icon.svg?react";
import { useAuth } from "../../auth/AuthContext";
import { addTicketMessage, assignTicket, getTicket, listTickets } from "../../api/tickets";
import type { TicketDetail, TicketListItem, TicketPriority, TicketStatus } from "../../api/tickets";

type TabKey = "new" | "in_progress" | "closed" | "all";

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

export function AdminPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState<TabKey>("new");
    const [query, setQuery] = useState("");

    const [list, setList] = useState<TicketListItem[]>([]);
    const [isListLoading, setIsListLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [detail, setDetail] = useState<TicketDetail | null>(null);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const [reply, setReply] = useState("");
    const [isSending, setIsSending] = useState(false);

    const [assigneeId, setAssigneeId] = useState<number | "">("");

    const filtered = useMemo(() => list, [list]);

    const onLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    useEffect(() => {
        let alive = true;

        (async () => {
            setIsListLoading(true);
            setListError(null);
            try {
                const data = await listTickets({ tab, q: query });

                const arr = Array.isArray(data)
                    ? data
                    : Array.isArray((data as any)?.tickets)
                        ? (data as any).tickets
                        : Array.isArray((data as any)?.items)
                            ? (data as any).items
                            : [];

                if (!alive) return;
                setList(arr);
                if (data.length > 0) {
                    setSelectedId((prev) => (prev && data.some((x) => x.id === prev) ? prev : data[0].id));
                } else {
                    setSelectedId(null);
                    setDetail(null);
                }
            } catch {
                if (!alive) return;
                setListError("Не удалось загрузить обращения.");
            } finally {
                if (!alive) return;
                setIsListLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [tab, query]);

    useEffect(() => {
        if (!selectedId) return;

        let alive = true;

        (async () => {
            setIsDetailLoading(true);
            setDetailError(null);
            try {
                const d = await getTicket(selectedId);
                if (!alive) return;
                setDetail(d);
                setAssigneeId(d.assigneeId ?? "");
                setReply("");
            } catch {
                if (!alive) return;
                setDetailError("Не удалось загрузить обращение.");
                setDetail(null);
            } finally {
                if (!alive) return;
                setIsDetailLoading(false);
            }
        })();

        return () => {
            alive = false;
        };
    }, [selectedId]);

    const isClosed = detail?.status === "closed";

    const onAssign = async (v: number) => {
        if (!detail) return;
        try {
            const updated = await assignTicket(detail.id, v);
            setDetail(updated);
            setAssigneeId(updated.assigneeId ?? "");
            setList((prev) =>
                prev.map((x) =>
                    x.id === updated.id
                        ? {
                            ...x,
                            status: updated.status,
                            assigneeName: updated.assigneeName ?? null,
                        }
                        : x
                )
            );
        } catch {
            setDetailError("Не удалось назначить ответственного.");
        }
    };

    const onSend = async () => {
        if (!detail) return;
        const msg = reply.trim();
        if (!msg) return;

        setIsSending(true);
        try {
            await addTicketMessage(detail.id, msg);
            setReply("");
        } catch {
            setDetailError("Не удалось отправить сообщение.");
        } finally {
            setIsSending(false);
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
                                    {isListLoading && (
                                        <tr>
                                            <td className={styles.empty} colSpan={6}>
                                                Загрузка...
                                            </td>
                                        </tr>
                                    )}

                                    {!isListLoading && listError && (
                                        <tr>
                                            <td className={styles.empty} colSpan={6}>
                                                {listError}
                                            </td>
                                        </tr>
                                    )}

                                    {!isListLoading &&
                                        !listError &&
                                        filtered.map((t) => (
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

                                                <td className={t.assigneeName ? "" : styles.muted}>{t.assigneeName ?? "Ещё не назначен"}</td>

                                                <td>
                                                    <span
                                                        className={`${styles.badge} ${t.status === "open" ? styles.badgeOpen : t.status === "in_progress" ? styles.badgeProgress : styles.badgeClosed
                                                            }`}
                                                    >
                                                        {statusLabel(t.status)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}

                                    {!isListLoading && !listError && filtered.length === 0 && (
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
                            {isDetailLoading && <div className={styles.empty}>Загрузка...</div>}
                            {!isDetailLoading && detailError && <div className={styles.empty}>{detailError}</div>}

                            {!isDetailLoading && !detailError && detail && (
                                <>
                                    <div className={styles.detailHead}>
                                        <div className={styles.detailTitle}>Обращение {detail.ticketNumber}</div>
                                        <div className={styles.detailDate}>от {detail.createdAt}</div>
                                    </div>

                                    <div className={styles.detailGrid}>
                                        <div className={styles.detailRow}>
                                            <div className={styles.detailLabel}>Тема:</div>
                                            <div className={styles.detailValue}>{detail.topic || detail.title || "—"}</div>
                                        </div>

                                        <div className={styles.detailRow}>
                                            <div className={styles.detailLabel}>От кого:</div>
                                            <div className={styles.detailValue}>{detail.fromName || "—"}</div>
                                        </div>

                                        <div className={styles.detailRow}>
                                            <div className={styles.detailLabel}>Отдел:</div>
                                            <div className={styles.detailValue}>{detail.dept ?? "—"}</div>
                                        </div>

                                        <div className={styles.detailRow}>
                                            <div className={styles.detailLabel}>Телефон:</div>
                                            <div className={styles.detailValue}>{detail.phone ?? "—"}</div>
                                        </div>

                                        <div className={styles.detailRowCol}>
                                            <div className={styles.detailLabel}>Сообщение</div>
                                            <textarea className={styles.textarea} value={detail.message ?? ""} rows={3} readOnly />
                                        </div>

                                        <div className={styles.detailRowCol}>
                                            <div className={styles.detailLabel}>Ответственный</div>
                                            <select
                                                className={styles.select}
                                                value={assigneeId}
                                                disabled={!!isClosed}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    if (!Number.isFinite(v)) return;
                                                    setAssigneeId(v);
                                                    onAssign(v);
                                                }}
                                            >
                                                <option value="" disabled>
                                                    Выбрать сотрудника
                                                </option>
                                                <option value={1}>Иван Машин</option>
                                                <option value={2}>Дмитрий Вяткин</option>
                                            </select>
                                        </div>

                                        {!isClosed && (
                                            <>
                                                <div className={styles.detailRowCol}>
                                                    <div className={styles.detailLabel}>Сообщение</div>
                                                    <textarea
                                                        className={styles.textarea}
                                                        placeholder="Напишите что-нибудь"
                                                        rows={3}
                                                        value={reply}
                                                        onChange={(e) => setReply(e.target.value)}
                                                    />
                                                </div>

                                                <button className={styles.primaryBtn} type="button" onClick={onSend} disabled={isSending}>
                                                    {isSending ? "Отправка..." : "Отправить"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}

                            {!isDetailLoading && !detailError && !detail && <div className={styles.empty}>Выберите обращение</div>}
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}