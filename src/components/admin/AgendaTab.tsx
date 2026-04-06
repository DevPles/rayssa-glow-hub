import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAvailability, ALL_TIME_OPTIONS, getDefaultSlots } from "@/contexts/AvailabilityContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { CalendarIcon, Clock, Trash2, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const AgendaTab = () => {
  const { availability, setDaySlots, removeDayAvailability, getAvailableTimesForDate } = useAvailability();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [month, setMonth] = useState<Date>(new Date());
  const [editingSlots, setEditingSlots] = useState<Record<string, boolean>>({});

  const availableDatesInMonth = availability
    .filter((d) => {
      const date = new Date(d.date + "T00:00:00");
      return isSameMonth(date, month);
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, "yyyy-MM-dd");
      const existing = getAvailableTimesForDate(dateStr);
      const slots: Record<string, boolean> = {};
      ALL_TIME_OPTIONS.forEach((t) => {
        slots[t] = existing.includes(t);
      });
      setEditingSlots(slots);
    }
  };

  const toggleSlot = (time: string) => {
    setEditingSlots((prev) => ({ ...prev, [time]: !prev[time] }));
  };

  const selectAll = () => {
    const allSelected: Record<string, boolean> = {};
    ALL_TIME_OPTIONS.forEach((t) => { allSelected[t] = true; });
    setEditingSlots(allSelected);
  };

  const clearAll = () => {
    const allCleared: Record<string, boolean> = {};
    ALL_TIME_OPTIONS.forEach((t) => { allCleared[t] = false; });
    setEditingSlots(allCleared);
  };

  const handleSave = () => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const slots = ALL_TIME_OPTIONS.map((t) => ({ time: t, available: !!editingSlots[t] }));
    setDaySlots(dateStr, slots);
    const count = slots.filter((s) => s.available).length;
    toast({
      title: count > 0 ? "Disponibilidade salva!" : "Dia removido da agenda",
      description: count > 0 ? `${count} horário(s) em ${format(selectedDate, "dd/MM/yyyy")}` : undefined,
    });
  };

  const handleRemoveDay = (dateStr: string) => {
    removeDayAvailability(dateStr);
    if (selectedDate && format(selectedDate, "yyyy-MM-dd") === dateStr) {
      clearAll();
    }
    toast({ title: "Disponibilidade removida" });
  };

  const isDateHighlighted = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return availability.some((d) => d.date === dateStr);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-1 bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              Selecione um dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              month={month}
              onMonthChange={setMonth}
              locale={ptBR}
              className="p-3 pointer-events-auto"
              modifiers={{ available: (date) => isDateHighlighted(date) }}
              modifiersClassNames={{ available: "bg-secondary/20 text-secondary font-bold" }}
            />
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Dias com <span className="text-secondary font-semibold">destaque</span> já possuem horários
            </p>
          </CardContent>
        </Card>

        {/* Time slot editor */}
        <Card className="lg:col-span-2 bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              {selectedDate
                ? `Horários — ${format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                : "Selecione uma data no calendário"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={selectAll} className="rounded-full text-xs font-heading">
                    <Check className="h-3 w-3 mr-1" /> Selecionar todos
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearAll} className="rounded-full text-xs font-heading">
                    Limpar todos
                  </Button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {ALL_TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleSlot(t)}
                      className={cn(
                        "py-2.5 rounded-lg text-sm font-heading transition-all border",
                        editingSlots[t]
                          ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
                          : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleSave}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-full font-heading px-6 shadow-md shadow-secondary/20"
                  >
                    Salvar Disponibilidade
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-heading">Clique em uma data no calendário para definir os horários disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary of month */}
      <Card className="bg-white/40 backdrop-blur-xl border-white/50 shadow-lg shadow-black/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">
            Disponibilidade em {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
            <Badge className="ml-2 bg-secondary/10 text-secondary border-secondary/20 text-[10px]">
              {availableDatesInMonth.length} dia(s)
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableDatesInMonth.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum horário configurado para este mês. Selecione uma data no calendário acima.
            </p>
          ) : (
            <div className="space-y-2">
              {availableDatesInMonth.map((day) => {
                const dateObj = new Date(day.date + "T00:00:00");
                return (
                  <div
                    key={day.date}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/30 backdrop-blur-lg hover:bg-white/50 transition-colors cursor-pointer"
                    onClick={() => handleSelectDate(dateObj)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-center bg-secondary/10 rounded-lg px-3 py-1.5 shrink-0">
                        <span className="text-lg font-heading font-bold text-secondary block leading-none">
                          {format(dateObj, "dd")}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-heading uppercase">
                          {format(dateObj, "EEE", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {day.slots.filter((s) => s.available).map((s) => (
                          <Badge key={s.time} variant="outline" className="text-[10px] px-1.5 py-0.5 border-border/50 text-muted-foreground">
                            {s.time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); handleRemoveDay(day.date); }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
