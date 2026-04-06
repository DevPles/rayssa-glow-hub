import { createContext, useContext, useState, type ReactNode } from "react";

export interface Booking {
  id: string;
  serviceId: string;
  serviceTitle: string;
  servicePage: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string;
  time: string;
  notes: string;
  status: "pendente" | "confirmado" | "cancelado" | "concluido";
  createdAt: string;
  price: number;
}

export interface AdminNotification {
  id: string;
  bookingId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface BookingContextType {
  bookings: Booking[];
  notifications: AdminNotification[];
  unreadCount: number;
  addBooking: (data: Omit<Booking, "id" | "status" | "createdAt">) => void;
  updateBookingStatus: (id: string, status: Booking["status"]) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addPurchaseNotification: (message: string) => void;
}

const BookingContext = createContext<BookingContextType | null>(null);

const initialBookings: Booking[] = [
  {
    id: "b1", serviceId: "f1", serviceTitle: "Limpeza de Pele Profunda", servicePage: "estetica-avancada",
    clientName: "Maria Silva", clientEmail: "maria@email.com", clientPhone: "(11) 98888-1111",
    date: "2026-02-25", time: "14:00", notes: "", status: "pendente", createdAt: "2026-02-22T10:30:00", price: 180,
  },
  {
    id: "b2", serviceId: "c1", serviceTitle: "Radiofrequência", servicePage: "estetica-avancada",
    clientName: "Camila Costa", clientEmail: "camila@email.com", clientPhone: "(21) 97777-2222",
    date: "2026-02-26", time: "10:00", notes: "Primeira sessão", status: "confirmado", createdAt: "2026-02-21T15:00:00", price: 280,
  },
];

const initialNotifications: AdminNotification[] = [
  { id: "n1", bookingId: "b1", message: "Maria Silva agendou Limpeza de Pele Profunda para 25/02 às 14:00", read: false, createdAt: "2026-02-22T10:30:00" },
  { id: "n2", bookingId: "b2", message: "Camila Costa agendou Radiofrequência para 26/02 às 10:00", read: true, createdAt: "2026-02-21T15:00:00" },
];

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [notifications, setNotifications] = useState<AdminNotification[]>(initialNotifications);

  const addBooking = (data: Omit<Booking, "id" | "status" | "createdAt">) => {
    const now = new Date().toISOString();
    const id = `b${Date.now()}`;
    const booking: Booking = { ...data, id, status: "pendente", createdAt: now };
    setBookings((prev) => [booking, ...prev]);

    const dateFormatted = new Date(data.date).toLocaleDateString("pt-BR");
    const notification: AdminNotification = {
      id: `n${Date.now()}`,
      bookingId: id,
      message: `${data.clientName} agendou ${data.serviceTitle} para ${dateFormatted} às ${data.time}`,
      read: false,
      createdAt: now,
    };
    setNotifications((prev) => [notification, ...prev]);
  };

  const updateBookingStatus = (id: string, status: Booking["status"]) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addPurchaseNotification = (message: string) => {
    const notification: AdminNotification = {
      id: `n${Date.now()}`,
      bookingId: "",
      message,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notification, ...prev]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <BookingContext.Provider value={{ bookings, notifications, unreadCount, addBooking, updateBookingStatus, markNotificationRead, markAllRead, addPurchaseNotification }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used within BookingProvider");
  return ctx;
};
