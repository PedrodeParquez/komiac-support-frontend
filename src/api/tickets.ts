import { http } from "./http";

export type TicketStatus = "open" | "in_progress" | "closed";
export type TicketPriority = "low" | "medium" | "high";

export type TicketListItem = {
    id: number;
    ticketNumber: string;
    title: string;
    createdAt: string;
    priority: TicketPriority;
    status: TicketStatus;
    assigneeName: string | null;
};

export type TicketDetail = {
    id: number;
    ticketNumber: string;
    title: string;
    createdAt: string;
    priority: TicketPriority;
    status: TicketStatus;
    topic: string;
    fromName: string;
    dept: string | null;
    phone: string | null;
    message: string | null;
    assigneeId: number | null;
    assigneeName: string | null;
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

export async function listTickets(params: { tab: string; q?: string }) {
    const { data } = await http.get<ListResponse>("/tickets", { params });
    return normalizeList(data);
}

export async function listMyTickets() {
    const { data } = await http.get<ListResponse>("/tickets/my");
    return normalizeList(data);
}

export async function getTicket(id: number) {
    const { data } = await http.get<TicketDetail>(`/tickets/${id}`);
    return data;
}

export async function assignTicket(id: number, assigneeId: number) {
    const { data } = await http.post<TicketDetail>(`/tickets/${id}/assign`, { assigneeId });
    return data;
}

export async function addTicketMessage(id: number, message: string) {
    await http.post(`/tickets/${id}/messages`, { message });
}