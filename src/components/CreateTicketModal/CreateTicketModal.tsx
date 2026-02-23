import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./CreateTicketModal.module.css";

export type TicketPriority = "low" | "medium" | "high";

export type CreateTicketPayload = {
    title: string;
    description: string;
    priority: TicketPriority;
};

type Props = {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: CreateTicketPayload) => void;
};

function priorityLabel(p: TicketPriority) {
    if (p === "high") return "Высокий";
    if (p === "medium") return "Средний";
    return "Низкий";
}

export function CreateTicketModal({ open, onClose, onSubmit }: Props) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TicketPriority>("medium");

    const titleInputRef = useRef<HTMLInputElement | null>(null);

    const canSubmit = useMemo(() => title.trim().length >= 3, [title]);

    useEffect(() => {
        if (!open) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const t = window.setTimeout(() => {
            titleInputRef.current?.focus();
        }, 0);

        return () => {
            window.clearTimeout(t);
            document.body.style.overflow = prevOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (open) return;
        setTitle("");
        setDescription("");
        setPriority("medium");
    }, [open]);

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        onSubmit({
            title: title.trim(),
            description: description.trim(),
            priority,
        });
    };

    return (
        <div
            className={styles.overlay}
            role="presentation"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-ticket-title"
            >
                <div className={styles.header}>
                    <div className={styles.title} id="create-ticket-title">
                        Создать обращение
                    </div>
                    <button className={styles.closeBtn} type="button" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                <form className={styles.body} onSubmit={handleSubmit}>
                    <label className={styles.field}>
                        <span className={styles.label}>Тема</span>
                        <input
                            ref={titleInputRef}
                            className={styles.input}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например: Не работает принтер в кабинете 210"
                            maxLength={120}
                        />
                        <span className={styles.hint}>Минимум 3 символа</span>
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>Описание</span>
                        <textarea
                            className={styles.textarea}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Опиши проблему, что уже пробовал(а), где находится оборудование и т.д."
                            rows={6}
                            maxLength={2000}
                        />
                    </label>

                    <label className={styles.field}>
                        <span className={styles.label}>Приоритет</span>
                        <div className={styles.priorityRow}>
                            {(["low", "medium", "high"] as TicketPriority[]).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    className={`${styles.pill} ${priority === p ? styles.pillActive : ""}`}
                                    onClick={() => setPriority(p)}
                                >
                                    {priorityLabel(p)}
                                </button>
                            ))}
                        </div>
                    </label>

                    <div className={styles.footer}>
                        <button className={styles.secondaryBtn} type="button" onClick={onClose}>
                            Отмена
                        </button>
                        <button className={styles.primaryBtn} type="submit" disabled={!canSubmit}>
                            Создать
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}