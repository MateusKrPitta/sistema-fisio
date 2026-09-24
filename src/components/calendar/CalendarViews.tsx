import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Users, CheckCircle2, FileText, LayoutGrid, List, AlertCircle, XCircle, HelpCircle, X, Eye } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function formatShortPhysioName(name?: string): string {
  if (!name) return '';
  const clean = name.trim();
  const parts = clean.split(/\s+/);
  if (parts.length <= 2) return clean;
  return `${parts[0]} ${parts[1]}`;
}

// Basic Types
export interface CalendarEvent {
  id: number | string;
  patientId?: number | string;
  templateId?: number | string;
  userId?: number | string;
  physioName?: string;
  patientName?: string;
  patientPhone?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type?: string;
  status?: string;
  hasEvolution?: boolean;
  template?: { id: number; title: string };
}

export interface AppointmentStatusStyle {
  label: string;
  bg: string;
  text: string;
  border: string;
  cardClass: string;
  badgeClass: string;
  dotClass: string;
  barClass: string;
  iconBg: string;
}

export function getAppointmentStatusStyle(status?: string, hasEvolution?: boolean): AppointmentStatusStyle {
  const s = (status || '').toLowerCase().trim();

  // 1. Atendido / Finalizado / Em atendimento / Concluído
  if (
    s === 'atendido' ||
    s === 'finalizado' ||
    s === 'em_atendimento' ||
    s === 'concluido' ||
    s === 'concluído'
  ) {
    if (hasEvolution) {
      return {
        label: 'Atendido (Evoluído)',
        bg: 'bg-emerald-50',
        text: 'text-emerald-950',
        border: 'border-emerald-300',
        cardClass: 'bg-emerald-50/95 text-emerald-950 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100/90 shadow-xs',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotClass: 'bg-emerald-500',
        barClass: 'border-l-4 border-l-emerald-500',
        iconBg: 'bg-emerald-100 text-emerald-700',
      };
    }

    // Atendido mas com Evolução Pendente (Âmbar / Laranja)
    return {
      label: 'Evolução Pendente',
      bg: 'bg-amber-50',
      text: 'text-amber-950',
      border: 'border-amber-400',
      cardClass: 'bg-amber-50/95 text-amber-950 border-amber-300 hover:border-amber-400 hover:bg-amber-100/90 shadow-xs',
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 font-bold',
      dotClass: 'bg-amber-500',
      barClass: 'border-l-4 border-l-amber-500',
      iconBg: 'bg-amber-100 text-amber-700',
    };
  }

  // 2. Presença confirmada / Confirmado -> Azul Royal / Índigo
  if (
    s === 'confirmado' ||
    s === 'presença confirmada' ||
    s === 'presenca confirmada'
  ) {
    return {
      label: 'Presença Confirmada',
      bg: 'bg-blue-50',
      text: 'text-blue-950',
      border: 'border-blue-300',
      cardClass: 'bg-blue-50/95 text-blue-950 border-blue-300 hover:border-blue-400 hover:bg-blue-100/90 shadow-xs',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
      dotClass: 'bg-blue-600',
      barClass: 'border-l-4 border-l-blue-600',
      iconBg: 'bg-blue-100 text-blue-700',
    };
  }

  // 3. Faltou / Faltou sem aviso prévio / Ausente -> Vermelho / Rosa
  if (
    s === 'ausente' ||
    s === 'faltou' ||
    s === 'faltou (sem aviso prévio)' ||
    s === 'faltou sem aviso prévio' ||
    s === 'faltou sem aviso'
  ) {
    return {
      label: 'Faltou (Ausente)',
      bg: 'bg-rose-50',
      text: 'text-rose-950',
      border: 'border-rose-300',
      cardClass: 'bg-rose-50/95 text-rose-950 border-rose-300 hover:border-rose-400 hover:bg-rose-100/90 shadow-xs',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
      dotClass: 'bg-rose-500',
      barClass: 'border-l-4 border-l-rose-500',
      iconBg: 'bg-rose-100 text-rose-700',
    };
  }

  // 4. Faltou com aviso prévio / Desmarcado / Remarcar -> Laranja / Âmbar claro
  if (
    s === 'desmarcado' ||
    s === 'faltou (com aviso prévio)' ||
    s === 'faltou com aviso prévio' ||
    s === 'faltou com aviso' ||
    s === 'remarcar'
  ) {
    return {
      label: 'Faltou c/ aviso / Remarcar',
      bg: 'bg-orange-50',
      text: 'text-orange-950',
      border: 'border-orange-300',
      cardClass: 'bg-orange-50/95 text-orange-950 border-orange-300 hover:border-orange-400 hover:bg-orange-100/90 shadow-xs',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
      dotClass: 'bg-orange-500',
      barClass: 'border-l-4 border-l-orange-500',
      iconBg: 'bg-orange-100 text-orange-700',
    };
  }

  // 5. Não atendido sem cobrança / Cancelado -> Cinza / Slate
  if (
    s === 'cancelado' ||
    s === 'não atendido (sem cobrança)' ||
    s === 'nao atendido (sem cobranca)' ||
    s === 'não atendido' ||
    s === 'nao atendido'
  ) {
    return {
      label: 'Cancelado / Não Atendido',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      cardClass: 'bg-slate-100 text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-200/80 shadow-xs line-through opacity-85',
      badgeClass: 'bg-slate-200 text-slate-700 border-slate-300',
      dotClass: 'bg-slate-500',
      barClass: 'border-l-4 border-l-slate-400',
      iconBg: 'bg-slate-200 text-slate-600',
    };
  }

  // 6. Default: Agendado / Pendente -> Ciano / Sky
  return {
    label: 'Agendado',
    bg: 'bg-sky-50',
    text: 'text-sky-950',
    border: 'border-sky-300',
    cardClass: 'bg-sky-50/95 text-sky-950 border-sky-300 hover:border-sky-400 hover:bg-sky-100/90 shadow-xs',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300',
    dotClass: 'bg-sky-500',
    barClass: 'border-l-4 border-l-sky-400',
    iconBg: 'bg-sky-100 text-sky-700',
  };
}

const toYMD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface CalendarViewsProps {
  events: CalendarEvent[];
  viewMode: 'month' | 'week' | 'day';
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onEventReschedule?: (eventId: number | string, newDate: string, newTime: string) => Promise<void> | void;
}

export function CalendarViews({
  events,
  viewMode,
  currentDate,
  onDateChange,
  onEventClick,
  onEventReschedule,
}: CalendarViewsProps) {
  const [mounted, setMounted] = useState(false);
  const [clientNow, setClientNow] = useState<Date>(() => new Date());
  const [draggedEventId, setDraggedEventId] = useState<number | string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ dateStr: string; timeSlot?: string } | null>(null);
  const [slotGroupModal, setSlotGroupModal] = useState<{ title: string; events: CalendarEvent[] } | null>(null);
  const isDraggingRef = React.useRef(false);
  
  React.useEffect(() => {
    setMounted(true);
    setClientNow(new Date());
    const interval = setInterval(() => {
      setClientNow(new Date());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 min-h-[400px] flex items-center justify-center text-slate-400">Carregando calendário...</div>;
  }
  // Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    onDateChange(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    onDateChange(d);
  };

  // -------------------------
  // MONTH VIEW
  // -------------------------
  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const todayStr = toYMD(new Date());

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto flex flex-col">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
            {weekdays.map((wd) => (
              <div key={wd} className="py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-100 dark:border-slate-800/80 last:border-0 bg-slate-50 dark:bg-slate-800/60">
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 auto-rows-[minmax(85px,1fr)] bg-slate-200 dark:bg-slate-800 gap-px border-b border-slate-300 dark:border-slate-800">
            {blanks.map((b) => (
              <div key={`blank-${b}`} className="bg-slate-50/50 dark:bg-slate-950/50 p-1 opacity-50" />
            ))}
            {days.map((d) => {
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
              const isToday = dateStr === todayStr;
              const isDropTarget = dragOverTarget?.dateStr === dateStr && !dragOverTarget?.timeSlot;

              const displayEvents = dayEvents.slice(0, 3);
              const hiddenCount = dayEvents.length - 3;

              return (
                <div
                  key={d}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverTarget?.dateStr !== dateStr || dragOverTarget?.timeSlot) {
                      setDragOverTarget({ dateStr });
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverTarget?.dateStr === dateStr && !dragOverTarget?.timeSlot) {
                      setDragOverTarget(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverTarget(null);
                    setDraggedEventId(null);
                    const raw = e.dataTransfer.getData('application/json');
                    if (!raw) return;
                    try {
                      const { eventId, originalTime } = JSON.parse(raw);
                      if (eventId && onEventReschedule) {
                        onEventReschedule(eventId, dateStr, originalTime || '14:00');
                      }
                    } catch {}
                  }}
                  className={`p-1 flex flex-col transition-colors ${
                    isDropTarget
                      ? 'bg-blue-100/80 dark:bg-blue-900/40 ring-2 ring-inset ring-blue-500'
                      : isToday
                      ? 'bg-blue-50/40 dark:bg-blue-950/30 ring-1 ring-inset ring-blue-500'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className={`text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'}`}>
                      {d}
                    </div>
                    {isDropTarget && (
                      <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">
                        Soltar aqui
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto hide-scrollbar">
                    {displayEvents.map((ev) => {
                      const statusStyle = getAppointmentStatusStyle(ev.status, ev.hasEvolution);
                      const isBeingDragged = draggedEventId === ev.id;
                      return (
                        <div
                          key={ev.id}
                          draggable={true}
                          onDragStart={(e) => {
                            isDraggingRef.current = true;
                            setDraggedEventId(ev.id);
                            e.dataTransfer.setData('application/json', JSON.stringify({ eventId: ev.id, originalTime: ev.time }));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setTimeout(() => { isDraggingRef.current = false; }, 120);
                            setDraggedEventId(null);
                            setDragOverTarget(null);
                          }}
                          onClick={() => {
                            if (isDraggingRef.current) return;
                            onEventClick(ev);
                          }}
                          title={`${ev.patientName} (${ev.time}) - Clique para ver ou arraste para outro dia`}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border cursor-grab active:cursor-grabbing truncate transition-all flex items-center gap-1 ${statusStyle.cardClass} ${
                            isBeingDragged ? 'opacity-30 ring-2 ring-blue-500 scale-95' : ''
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.dotClass}`} />
                          <span className="truncate">{ev.time} - {ev.patientName?.split(' ')[0]}</span>
                        </div>
                      );
                    })}
                    {hiddenCount > 0 && (
                      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 pl-1 mt-0.5 cursor-pointer hover:text-blue-600">
                        + {hiddenCount} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // -------------------------
  // WEEK VIEW
  // -------------------------
  const renderWeekView = () => {
    // Get start of week (Sunday)
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.setDate(diff));

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const wDate = new Date(startOfWeek);
      wDate.setDate(wDate.getDate() + i);
      return wDate;
    });

    // 07:00 to 21:00 (15 hours)
    const hours = Array.from({ length: 15 }, (_, i) => i + 7);

    const now = clientNow;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const todayStr = toYMD(clientNow);

    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto flex flex-col">
        <div className="min-w-[760px]">
          {/* Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 sticky top-0 z-20">
            <div className="w-14 sm:w-16 border-r border-slate-200 dark:border-slate-800 shrink-0"></div>
            <div className="flex-1 grid grid-cols-7">
              {weekDays.map((wd, i) => {
                const dateStr = toYMD(wd);
                const isToday = dateStr === todayStr;
                const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                return (
                  <div key={i} className={`py-2 text-center border-r border-slate-200 dark:border-slate-800 last:border-0 flex flex-col items-center justify-center ${isToday ? 'bg-blue-50/80 dark:bg-blue-950/40' : ''}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">{weekdays[wd.getDay()]}</span>
                    <span className={`text-sm font-black w-6 h-6 flex items-center justify-center rounded-full mt-0.5 ${isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-800 dark:text-slate-200'}`}>
                      {wd.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid - Row-based layout (1 horizontal row per hour) */}
          <div className="flex-1 overflow-y-auto max-h-[700px] bg-slate-50 dark:bg-slate-950/40 flex flex-col">
            {hours.map((h) => {
              const timeSlot = `${String(h).padStart(2, '0')}:00`;
              const isCurrentHourRow = currentHour === h;
              const currentMinutePercent = Math.min(Math.max((currentMinute / 60) * 100, 0), 100);

              return (
                <div key={h} className="flex border-b border-slate-100 dark:border-slate-800/80 h-20 shrink-0 min-h-[80px]">
                  {/* Time Column Label */}
                  <div className="w-14 sm:w-16 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 flex items-start justify-center pt-2 select-none">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400">
                      {timeSlot}
                    </span>
                  </div>

                  {/* 7 Day Columns for this hour */}
                  <div className="flex-1 grid grid-cols-7">
                    {weekDays.map((wd, colIndex) => {
                      const dateStr = toYMD(wd);
                      const isToday = dateStr === todayStr;
                      const isCurrentHourCell = isToday && isCurrentHourRow;
                      const isDragTarget =
                        dragOverTarget?.dateStr === dateStr && dragOverTarget?.timeSlot === timeSlot;

                      const hourEvents = events.filter((ev) => {
                        if (ev.date !== dateStr) return false;
                        const timeParts = (ev.time || '00:00').split(':');
                        return parseInt(timeParts[0]) === h;
                      });

                      return (
                        <div
                          key={colIndex}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverTarget?.dateStr !== dateStr || dragOverTarget?.timeSlot !== timeSlot) {
                              setDragOverTarget({ dateStr, timeSlot });
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverTarget?.dateStr === dateStr && dragOverTarget?.timeSlot === timeSlot) {
                              setDragOverTarget(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverTarget(null);
                            setDraggedEventId(null);
                            const raw = e.dataTransfer.getData('application/json');
                            if (!raw) return;
                            try {
                              const { eventId } = JSON.parse(raw);
                              if (eventId && onEventReschedule) {
                                onEventReschedule(eventId, dateStr, timeSlot);
                              }
                            } catch {}
                          }}
                          className={`relative border-r border-slate-200 dark:border-slate-800 last:border-0 h-full transition-colors ${
                            isToday ? 'bg-amber-50/20 dark:bg-amber-950/10' : 'bg-white dark:bg-slate-900'
                          } ${
                            isDragTarget
                              ? 'bg-blue-100/80 dark:bg-blue-900/50 ring-2 ring-inset ring-blue-500 z-10'
                              : 'hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                          }`}
                        >
                          {/* Drag indicator overlay */}
                          {isDragTarget && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                              <span className="text-[9px] font-extrabold text-blue-700 dark:text-blue-300 bg-white/95 dark:bg-slate-900/95 px-2 py-0.5 rounded-md shadow-xs border border-blue-300 dark:border-blue-700 animate-pulse">
                                Mover para {timeSlot}
                              </span>
                            </div>
                          )}

                          {/* Real-time Local Time Indicator Line */}
                          {isCurrentHourCell && (
                            <div
                              className="absolute left-0 right-0 h-[2px] bg-red-500 z-30 pointer-events-none flex items-center"
                              style={{ top: `${currentMinutePercent}%` }}
                            >
                              <div className="w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-900 shadow-sm -ml-1" />
                              <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-md ml-1 shadow-xs leading-none">
                                {String(currentHour).padStart(2, '0')}:{String(currentMinute).padStart(2, '0')}
                              </span>
                            </div>
                          )}

                          {/* 1 Event in Slot: Full spacious card */}
                          {hourEvents.length === 1 && (() => {
                            const ev = hourEvents[0];
                            const statusStyle = getAppointmentStatusStyle(ev.status, ev.hasEvolution);
                            const endTime = `${String(h + 1).padStart(2, '0')}:00`;
                            const isBeingDragged = draggedEventId === ev.id;

                            return (
                              <div
                                draggable={true}
                                onDragStart={(e) => {
                                  isDraggingRef.current = true;
                                  setDraggedEventId(ev.id);
                                  e.dataTransfer.setData('application/json', JSON.stringify({ eventId: ev.id, originalTime: ev.time }));
                                  e.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => {
                                  setTimeout(() => { isDraggingRef.current = false; }, 120);
                                  setDraggedEventId(null);
                                  setDragOverTarget(null);
                                }}
                                onClick={() => {
                                  if (isDraggingRef.current) return;
                                  onEventClick(ev);
                                }}
                                title={`${ev.patientName} (${ev.time} - ${endTime})${ev.physioName ? ` • Fisioterapeuta: ${ev.physioName}` : ''} - Clique para ver detalhes`}
                                className={`absolute inset-1 rounded-xl border cursor-grab active:cursor-grabbing p-2 overflow-hidden transition-all hover:scale-[1.01] hover:z-20 flex flex-col justify-between select-none shadow-xs ${
                                  statusStyle.cardClass
                                } ${statusStyle.barClass} ${
                                  isBeingDragged ? 'opacity-30 ring-2 ring-blue-500 scale-95' : ''
                                }`}
                              >
                                <div className="pointer-events-none select-none min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-black opacity-90 leading-none">
                                      {ev.time} - {endTime}
                                    </span>
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusStyle.dotClass}`} />
                                  </div>
                                  <p className="text-[11px] font-bold leading-tight truncate mt-1 text-slate-900 dark:text-slate-100">
                                    {ev.patientName}
                                  </p>
                                  {ev.physioName && (
                                    <p className="text-[9.5px] font-semibold text-blue-700 dark:text-blue-300 opacity-90 truncate leading-tight mt-0.5">
                                      👤 {formatShortPhysioName(ev.physioName)}
                                    </p>
                                  )}
                                </div>
                                <div className="pointer-events-none select-none flex items-center justify-between pt-0.5">
                                  <span className="text-[9px] font-semibold opacity-75 truncate">
                                    {statusStyle.label}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* 2 Events in Slot: 2 horizontal stacked rows */}
                          {hourEvents.length === 2 && (
                            <>
                              {hourEvents.map((ev, idx) => {
                                const statusStyle = getAppointmentStatusStyle(ev.status, ev.hasEvolution);
                                const isBeingDragged = draggedEventId === ev.id;

                                return (
                                  <div
                                    key={ev.id}
                                    draggable={true}
                                    onDragStart={(e) => {
                                      isDraggingRef.current = true;
                                      setDraggedEventId(ev.id);
                                      e.dataTransfer.setData('application/json', JSON.stringify({ eventId: ev.id, originalTime: ev.time }));
                                      e.dataTransfer.effectAllowed = 'move';
                                    }}
                                    onDragEnd={() => {
                                      setTimeout(() => { isDraggingRef.current = false; }, 120);
                                      setDraggedEventId(null);
                                      setDragOverTarget(null);
                                    }}
                                    onClick={() => {
                                      if (isDraggingRef.current) return;
                                      onEventClick(ev);
                                    }}
                                    title={`${ev.patientName} (${ev.time})${ev.physioName ? ` • ${formatShortPhysioName(ev.physioName)}` : ''} - Clique para ver detalhes`}
                                    className={`absolute left-1 right-1 h-[34px] rounded-lg border cursor-grab active:cursor-grabbing px-2 py-1 overflow-hidden transition-all hover:scale-[1.01] hover:z-20 flex items-center justify-between gap-1 select-none shadow-xs ${
                                      statusStyle.cardClass
                                    } ${statusStyle.barClass} ${
                                      isBeingDragged ? 'opacity-30 ring-2 ring-blue-500 scale-95' : ''
                                    }`}
                                    style={{
                                      top: idx === 0 ? '3px' : '40px',
                                    }}
                                  >
                                    <div className="min-w-0 flex-1 pointer-events-none select-none">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.dotClass}`} />
                                        <span className="text-[10px] font-bold truncate leading-tight text-slate-900 dark:text-slate-100">
                                          {ev.patientName}
                                        </span>
                                      </div>
                                      {ev.physioName && (
                                        <p className="text-[8.5px] font-semibold text-blue-700 dark:text-blue-300 opacity-90 truncate leading-none mt-0.5 pl-3">
                                          👤 {formatShortPhysioName(ev.physioName)}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-[9px] font-black opacity-80 shrink-0 pointer-events-none select-none">
                                      {ev.time}
                                    </span>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* 3 or More Events in Slot: Grouped summary card */}
                          {hourEvents.length >= 3 && (() => {
                            const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                            const dayTitle = `${String(h).padStart(2, '0')}:00 - ${weekdayNames[wd.getDay()]} (${wd.getDate()}/${wd.getMonth() + 1})`;

                            return (
                              <div
                                onClick={() => {
                                  setSlotGroupModal({
                                    title: dayTitle,
                                    events: hourEvents,
                                  });
                                }}
                                title={`Clique para ver os ${hourEvents.length} atendimentos deste horário`}
                                className="absolute inset-1 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/95 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 p-2 overflow-hidden transition-all hover:scale-[1.02] hover:z-20 cursor-pointer flex flex-col justify-between select-none shadow-xs border-l-4 border-l-blue-600 group"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[10px] font-black text-blue-950 dark:text-blue-200">
                                      {String(h).padStart(2, '0')}:00
                                    </span>
                                    <span className="bg-blue-600 text-white font-extrabold text-[8.5px] px-1.5 py-0.2 rounded-full shadow-xs">
                                      {hourEvents.length} pacientes
                                    </span>
                                  </div>
                                  <div className="space-y-0.5">
                                    {hourEvents.slice(0, 2).map((ev) => (
                                      <div key={ev.id} className="text-[9px] font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1 leading-tight">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                        <span className="truncate">{ev.patientName?.split(' ')[0]}</span>
                                        {ev.physioName && (
                                          <span className="text-slate-500 dark:text-slate-400 text-[8px] font-normal truncate">
                                            ({formatShortPhysioName(ev.physioName).split(' ')[0]})
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div className="mt-auto pt-1">
                                  <div className="w-full bg-blue-600 group-hover:bg-blue-700 text-white rounded-lg py-1 px-1.5 flex items-center justify-center gap-1.5 shadow-xs transition-colors">
                                    <Eye className="w-3 h-3 shrink-0" />
                                    <span className="text-[9px] font-bold">Ver todos ({hourEvents.length})</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // -------------------------
  // DAY VIEW
  // -------------------------
  const renderDayView = () => {
    const dateStr = toYMD(currentDate);
    const dayEvents = events.filter((e) => e.date === dateStr).sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 min-h-[400px]">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Clock className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-bold">Nenhum agendamento para este dia.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((ev) => {
              const statusStyle = getAppointmentStatusStyle(ev.status, ev.hasEvolution);
              return (
                <div
                  key={ev.id}
                  onClick={() => onEventClick(ev)}
                  className={`flex items-center space-x-4 p-4 rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${statusStyle.cardClass} ${statusStyle.barClass}`}
                >
                  <div className="text-xl font-black shrink-0 w-16 text-center">{ev.time}</div>
                  <div className="w-1 h-12 bg-current opacity-20 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-lg text-slate-900 truncate">{ev.patientName}</h4>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${statusStyle.badgeClass}`}>
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="text-xs font-semibold opacity-80 mt-0.5">{ev.type || 'Atendimento Fisioterapêutico'}</p>
                    {ev.physioName && (
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mt-1 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{formatShortPhysioName(ev.physioName)}</span>
                      </p>
                    )}
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full shadow-xs ${statusStyle.dotClass}`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const formatHeaderMonth = (d: Date) => {
    const m = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return m.charAt(0).toUpperCase() + m.slice(1);
  };

  const formatHeaderWeek = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.setDate(diff));
    const endOfWeek = new Date(d.setDate(diff + 6));
    const startM = startOfWeek.toLocaleDateString('pt-BR', { month: 'short' });
    const endM = endOfWeek.toLocaleDateString('pt-BR', { month: 'short' });
    return `${startOfWeek.getDate()} ${startM} - ${endOfWeek.getDate()} ${endM} ${d.getFullYear()}`;
  };

  const formatHeaderDay = (d: Date) => {
    const label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') return formatHeaderMonth(new Date(currentDate));
    if (viewMode === 'week') return formatHeaderWeek(new Date(currentDate));
    return formatHeaderDay(new Date(currentDate));
  };

  return (
    <div className="space-y-4">
      {/* Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg hover:bg-white hover:shadow-xs text-slate-600 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDateChange(new Date())}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-white hover:shadow-xs rounded-lg transition-all cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg hover:bg-white hover:shadow-xs text-slate-600 transition-all cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-lg font-black text-slate-800 hidden md:block">
            {getHeaderTitle()}
          </h2>
        </div>

        <h2 className="text-base font-black text-slate-800 md:hidden text-center">
          {getHeaderTitle()}
        </h2>
      </div>

      {/* Render selected view */}
      {viewMode === 'month' && renderMonthView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'day' && renderDayView()}

      {/* Visual Status Legend */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 font-medium">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Legenda:</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 font-bold">
          <span className="w-2 h-2 rounded-full bg-sky-500" /> Agendado
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold">
          <span className="w-2 h-2 rounded-full bg-blue-600" /> Presença Confirmada
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Atendido (Evoluído)
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 font-bold">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> 📝 Evolução Pendente
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-900 font-bold">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Faltou c/ aviso / Remarcar
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 font-bold">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Faltou (Ausente)
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold">
          <span className="w-2 h-2 rounded-full bg-slate-500" /> Cancelado
        </span>
      </div>

      {/* Grouped Slot Appointments Modal */}
      <AnimatePresence>
        {slotGroupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setSlotGroupModal(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 w-full max-w-lg space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                      Atendimentos das {slotGroupModal.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {slotGroupModal.events.length} pacientes agendados neste mesmo horário
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSlotGroupModal(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                {slotGroupModal.events.map((ev) => {
                  const style = getAppointmentStatusStyle(ev.status, ev.hasEvolution);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSlotGroupModal(null);
                        onEventClick(ev);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md flex items-center justify-between gap-3 ${style.cardClass} ${style.barClass}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black shrink-0">{ev.time}</span>
                          <span className="w-1 h-3.5 bg-current opacity-25 rounded-full" />
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate">
                            {ev.patientName}
                          </h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="text-xs opacity-80">{ev.type || 'Atendimento Fisioterapêutico'}</p>
                          {ev.physioName && (
                            <>
                              <span className="opacity-40">•</span>
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{formatShortPhysioName(ev.physioName)}</span>
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 border ${style.badgeClass}`}>
                        {style.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSlotGroupModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
