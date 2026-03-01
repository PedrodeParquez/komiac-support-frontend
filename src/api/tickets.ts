import { http } from "./http";

export type TicketStatus = "open" | "in_progress" | "closed";

export type AdminTabKey = "new" | "in_progress" | "closed" | "all";

export type TicketListItem = {
    id: number;
    ticketNumber: string;
    title: string;
    createdAt: string;
    status: TicketStatus;
    assigneeName: string | null;
};

export type TicketDetail = TicketListItem & {
    topic: string;
    fromName: string;
    dept: string | { id?: number; name?: string } | null;
    phone: string | null;
    message: string | null;
    assigneeId: number | null;
    supportReply?: string | null;
    repliedAt?: string | null;
};

type ListResponse =
    | TicketListItem[]
    | { tickets: TicketListItem[] }
    | { items: TicketListItem[] };

function normalizeList(data: ListResponse): TicketListItem[] {
    if (Array.isArray(data)) return data;
    const anyData = data as any;
    if (Array.isArray(anyData?.tickets)) return anyData.tickets;
    if (Array.isArray(anyData?.items)) return anyData.items;
    return [];
}

function normalizeStatus(s: any): TicketStatus {
    if (s === "open" || s === "in_progress" || s === "closed") return s;
    if (s === "resolved") return "closed";
    return "open";
}

function deptFrom(raw: any) {
    return raw?.dept ?? raw?.department ?? raw?.fromUser?.dept ?? raw?.user?.dept ?? null;
}

function phoneFrom(raw: any) {
    return raw?.phone ?? raw?.phoneNumber ?? raw?.fromUser?.phone ?? raw?.user?.phone ?? null;
}

function fromNameFrom(raw: any) {
    return raw?.fromName ?? raw?.from_user_name ?? raw?.fromUser?.name ?? raw?.user?.name ?? "—";
}

function normalizeDetail(raw: any): TicketDetail {
    return {
        id: raw?.id,
        ticketNumber: raw?.ticketNumber ?? raw?.ticket_number ?? "—",
        title: raw?.title ?? "—",
        createdAt: raw?.createdAt ?? raw?.created_at ?? "—",
        status: normalizeStatus(raw?.status),
        assigneeName: raw?.assigneeName ?? raw?.assignee_name ?? null,

        topic: raw?.topic ?? raw?.title ?? "—",
        fromName: fromNameFrom(raw),
        dept: deptFrom(raw),
        phone: phoneFrom(raw),
        message: raw?.message ?? raw?.description ?? null,
        assigneeId: raw?.assigneeId ?? raw?.assignee_id ?? null,

        supportReply: raw?.supportReply ?? raw?.support_reply ?? null,
        repliedAt: raw?.repliedAt ?? raw?.replied_at ?? null,
    };
}

export async function listMyTickets() {
    const { data } = await http.get<ListResponse>("/tickets/my");
    const list = normalizeList(data);
    return [...list].sort((a, b) => b.id - a.id);
}

export async function getMyTicket(id: number) {
    const { data } = await http.get<{ ticket: any }>(`/tickets/my/${id}`);
    return normalizeDetail(data.ticket);
}

export async function createMyTicket(payload: { title: string; description: string }) {
    await http.post("/tickets", payload);
}

export async function listTicketsAdmin(params: { tab: AdminTabKey; q?: string }) {
    const { data } = await http.get<ListResponse>("/tickets", { params });
    return normalizeList(data);
}

export async function getTicketAdmin(id: number) {
    const { data } = await http.get<{ ticket: any }>(`/tickets/${id}`);
    return normalizeDetail(data.ticket);
}

export async function replyTicketAdmin(payload: { id: number; assigneeId: number | ""; reply: string }) {
    await http.post(`/tickets/${payload.id}/reply`, {
        assigneeId: payload.assigneeId === "" ? null : payload.assigneeId,
        reply: payload.reply,
    });
}

export async function closeTicketAdmin(id: number) {
    await http.post(`/tickets/${id}/close`, null);
}