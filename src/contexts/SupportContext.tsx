import { createContext, useContext, useState, ReactNode } from "react";

export interface SupportAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  timestamp: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  sender: "cliente" | "admin";
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: SupportAttachment[];
}

export type TicketPriority = "baixa" | "media" | "alta" | "urgente";

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  status: "aberto" | "respondido" | "em_andamento" | "fechado";
  priority: TicketPriority;
  createdAt: string;
  closedAt?: string;
  closedBy?: string;
  resolutionNotes?: string;
  messages: SupportMessage[];
}

interface SupportContextType {
  tickets: SupportTicket[];
  createTicket: (userId: string, userName: string, subject: string, message: string, priority?: TicketPriority) => SupportTicket;
  addMessage: (ticketId: string, sender: "cliente" | "admin", senderName: string, content: string, attachments?: SupportAttachment[]) => void;
  getTicketsForUser: (userId: string) => SupportTicket[];
  closeTicket: (ticketId: string, resolutionNotes: string, closedBy: string) => void;
  reopenTicket: (ticketId: string) => void;
  updatePriority: (ticketId: string, priority: TicketPriority) => void;
  setTicketStatus: (ticketId: string, status: SupportTicket["status"]) => void;
}

const SupportContext = createContext<SupportContextType | null>(null);

const now = () => new Date().toLocaleString("pt-BR");

export const SupportProvider = ({ children }: { children: ReactNode }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: "t1",
      userId: "2",
      userName: "Maria Silva",
      subject: "Dúvida sobre agendamento",
      status: "aberto",
      priority: "media",
      createdAt: "20/02/2026 10:30",
      messages: [
        { id: "m1", ticketId: "t1", sender: "cliente", senderName: "Maria Silva", content: "Olá, gostaria de remarcar meu horário de harmonização facial.", timestamp: "20/02/2026 10:30" },
        { id: "m2", ticketId: "t1", sender: "admin", senderName: "Admin", content: "Olá Maria! Claro, qual data e horário você prefere?", timestamp: "20/02/2026 11:15" },
      ],
    },
    {
      id: "t2",
      userId: "3",
      userName: "Ana Oliveira",
      subject: "Problema com pagamento",
      status: "aberto",
      priority: "alta",
      createdAt: "21/02/2026 14:20",
      messages: [
        { id: "m3", ticketId: "t2", sender: "cliente", senderName: "Ana Oliveira", content: "Meu pagamento foi cobrado duas vezes no cartão. Podem verificar?", timestamp: "21/02/2026 14:20" },
      ],
    },
    {
      id: "t3",
      userId: "4",
      userName: "Juliana Costa",
      subject: "Feedback sobre procedimento",
      status: "fechado",
      priority: "baixa",
      createdAt: "18/02/2026 09:00",
      closedAt: "19/02/2026 16:00",
      closedBy: "Admin",
      resolutionNotes: "Paciente satisfeita com o resultado. Retorno agendado para 30 dias.",
      messages: [
        { id: "m4", ticketId: "t3", sender: "cliente", senderName: "Juliana Costa", content: "Queria agradecer pelo atendimento excelente!", timestamp: "18/02/2026 09:00" },
        { id: "m5", ticketId: "t3", sender: "admin", senderName: "Admin", content: "Ficamos felizes! Obrigada pelo feedback, Juliana.", timestamp: "18/02/2026 10:00" },
      ],
    },
  ]);

  const createTicket = (userId: string, userName: string, subject: string, message: string, priority: TicketPriority = "media") => {
    const ticket: SupportTicket = {
      id: `t${Date.now()}`,
      userId,
      userName,
      subject,
      status: "aberto",
      priority,
      createdAt: now(),
      messages: [
        { id: `m${Date.now()}`, ticketId: `t${Date.now()}`, sender: "cliente", senderName: userName, content: message, timestamp: now() },
      ],
    };
    setTickets((prev) => [...prev, ticket]);
    return ticket;
  };

  const addMessage = (ticketId: string, sender: "cliente" | "admin", senderName: string, content: string, attachments?: SupportAttachment[]) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: sender === "admin" ? "respondido" : "aberto",
              messages: [
                ...t.messages,
                { id: `m${Date.now()}`, ticketId, sender, senderName, content, timestamp: now(), attachments },
              ],
            }
          : t
      )
    );
  };

  const getTicketsForUser = (userId: string) => tickets.filter((t) => t.userId === userId);

  const closeTicket = (ticketId: string, resolutionNotes: string, closedBy: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: "fechado" as const, closedAt: now(), closedBy, resolutionNotes } : t
      )
    );
  };

  const reopenTicket = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId ? { ...t, status: "aberto" as const, closedAt: undefined, closedBy: undefined, resolutionNotes: undefined } : t
      )
    );
  };

  const updatePriority = (ticketId: string, priority: TicketPriority) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, priority } : t)));
  };

  const setTicketStatus = (ticketId: string, status: SupportTicket["status"]) => {
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
  };

  return (
    <SupportContext.Provider value={{ tickets, createTicket, addMessage, getTicketsForUser, closeTicket, reopenTicket, updatePriority, setTicketStatus }}>
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => {
  const ctx = useContext(SupportContext);
  if (!ctx) throw new Error("useSupport must be used within SupportProvider");
  return ctx;
};
