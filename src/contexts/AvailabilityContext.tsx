import { createContext, useContext, useState, type ReactNode } from "react";
import { format } from "date-fns";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DayAvailability {
  date: string; // yyyy-MM-dd
  slots: TimeSlot[];
}

interface AvailabilityContextType {
  availability: DayAvailability[];
  setDaySlots: (date: string, slots: TimeSlot[]) => void;
  removeDayAvailability: (date: string) => void;
  getAvailableDates: () => string[];
  getAvailableTimesForDate: (date: string) => string[];
  isDateAvailable: (date: Date) => boolean;
}

const AvailabilityContext = createContext<AvailabilityContextType | null>(null);

const defaultSlots: TimeSlot[] = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
].map((t) => ({ time: t, available: false }));

export const ALL_TIME_OPTIONS = defaultSlots.map((s) => s.time);

export const getDefaultSlots = (): TimeSlot[] =>
  defaultSlots.map((s) => ({ ...s }));

export const AvailabilityProvider = ({ children }: { children: ReactNode }) => {
  const [availability, setAvailability] = useState<DayAvailability[]>([
    // Some sample data
    { date: "2026-02-25", slots: [
      { time: "08:00", available: true }, { time: "09:00", available: true },
      { time: "10:00", available: true }, { time: "14:00", available: true },
      { time: "15:00", available: true },
    ]},
    { date: "2026-02-26", slots: [
      { time: "10:00", available: true }, { time: "10:30", available: true },
      { time: "13:00", available: true }, { time: "14:00", available: true },
    ]},
    { date: "2026-02-27", slots: [
      { time: "08:00", available: true }, { time: "09:00", available: true },
      { time: "11:00", available: true }, { time: "15:00", available: true },
      { time: "16:00", available: true }, { time: "17:00", available: true },
    ]},
  ]);

  const setDaySlots = (date: string, slots: TimeSlot[]) => {
    const activeSlots = slots.filter((s) => s.available);
    if (activeSlots.length === 0) {
      setAvailability((prev) => prev.filter((d) => d.date !== date));
      return;
    }
    setAvailability((prev) => {
      const existing = prev.findIndex((d) => d.date === date);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { date, slots: activeSlots };
        return updated;
      }
      return [...prev, { date, slots: activeSlots }].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const removeDayAvailability = (date: string) => {
    setAvailability((prev) => prev.filter((d) => d.date !== date));
  };

  const getAvailableDates = () => availability.map((d) => d.date);

  const getAvailableTimesForDate = (date: string) => {
    const day = availability.find((d) => d.date === date);
    if (!day) return [];
    return day.slots.filter((s) => s.available).map((s) => s.time);
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availability.some((d) => d.date === dateStr);
  };

  return (
    <AvailabilityContext.Provider value={{ availability, setDaySlots, removeDayAvailability, getAvailableDates, getAvailableTimesForDate, isDateAvailable }}>
      {children}
    </AvailabilityContext.Provider>
  );
};

export const useAvailability = () => {
  const ctx = useContext(AvailabilityContext);
  if (!ctx) throw new Error("useAvailability must be used within AvailabilityProvider");
  return ctx;
};
