"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEK_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toIso(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function DatePicker({
  value,
  onChange,
  min,
  max,
  todayLabel = "Today",
  ariaLabel = "Choose date",
}: {
  value: string;
  onChange: (isoDate: string) => void;
  min?: string;
  max?: string;
  todayLabel?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date(`${value}T00:00:00`));
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const rangeStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const rangeEnd = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  }, [viewDate]);

  const selected = new Date(`${value}T00:00:00`);
  const display = format(selected, "dd-MM-yyyy");

  const todayIso = toIso(new Date());

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-forest-900/15 bg-white px-3 text-left shadow-[0_1px_2px_rgba(14,42,29,0.04)] transition-colors hover:border-brand-600/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20"
      >
        <span className="truncate text-sm font-medium text-forest-900">{display}</span>
        <CalendarDays className="h-4 w-4 text-ink/40" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Choose date"
          className="absolute z-50 mt-2 w-72 rounded-2xl border border-forest-900/10 bg-cream-50 p-3 shadow-[0_2px_6px_rgba(14,42,29,0.05),0_18px_48px_rgba(14,42,29,0.16)]"
        >
          <div className="mb-2 flex items-center justify-between px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewDate((value) => subMonths(value, 1))}
              aria-label="Previous month"
              className="h-7 w-7 rounded-md text-forest-900 hover:bg-forest-900/5"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-semibold text-forest-900">
              {format(viewDate, "MMMM yyyy")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setViewDate((value) => addMonths(value, 1))}
              aria-label="Next month"
              className="h-7 w-7 rounded-md text-forest-900 hover:bg-forest-900/5"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEK_LABELS.map((day) => (
              <div
                key={day}
                className="text-center text-[10px] font-semibold uppercase tracking-wide text-ink/40"
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const iso = toIso(day);
              const disabled = Boolean((min && iso < min) || (max && iso > max));
              const selectedDay = iso === value;
              const outsideMonth = !isSameMonth(day, viewDate);
              const today = isToday(day);

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      onChange(iso);
                      setOpen(false);
                    }
                  }}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-[11px] font-medium transition-colors",
                    selectedDay
                      ? "font-semibold text-cream-50 bg-forest-900"
                      : "text-forest-900 hover:bg-brand-50",
                    outsideMonth && "text-ink/20",
                    disabled && "cursor-not-allowed opacity-30",
                    today && !selectedDay && "font-semibold text-brand-700",
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(todayIso);
                setViewDate(new Date(`${todayIso}T00:00:00`));
                setOpen(false);
              }}
              className="h-8 px-2 text-xs font-semibold text-brand-700"
            >
              {todayLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 px-2 text-xs font-medium text-ink/50"
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
