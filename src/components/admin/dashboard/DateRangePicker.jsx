import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import {
  addMonths,
  createCustomRange,
  datePresets,
  getPresetRange,
  isSameDay,
  monthFormatter,
  startOfDay,
  today,
} from "../../../data/adminDashboard";

const weekDays = ["س", "ح", "ن", "ث", "ر", "خ", "ج"];
const triggerDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function getCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 1) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + index);
    return startOfDay(day);
  });
}

function isBetween(date, start, end) {
  if (!start || !end) return false;
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

export default function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(value.start.getFullYear(), value.start.getMonth(), 1));
  const [draftStart, setDraftStart] = useState(value.start);
  const [draftEnd, setDraftEnd] = useState(value.end);
  const [startTooltipVisible, setStartTooltipVisible] = useState(false);
  const pickerRef = useRef(null);
  const tooltipTimerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    setDraftStart(value.start);
    setDraftEnd(value.end);
  }, [value.start, value.end]);

  useEffect(
    () => () => {
      if (tooltipTimerRef.current) {
        window.clearTimeout(tooltipTimerRef.current);
      }
    },
    [],
  );

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);

  const triggerLabel = value.start && value.end
    ? `${triggerDateFormatter.format(value.start)} — ${triggerDateFormatter.format(value.end)}`
    : "Select Date Range";

  const showStartTooltip = () => {
    setStartTooltipVisible(true);
    if (tooltipTimerRef.current) {
      window.clearTimeout(tooltipTimerRef.current);
    }
    tooltipTimerRef.current = window.setTimeout(() => setStartTooltipVisible(false), 1800);
  };

  const applyPreset = (presetId) => {
    if (presetId === "custom") {
      setOpen(true);
      return;
    }

    const range = getPresetRange(presetId);
    setDraftStart(range.start);
    setDraftEnd(range.end);
    setVisibleMonth(new Date(range.start.getFullYear(), range.start.getMonth(), 1));
    onChange(range);
    setOpen(false);
  };

  const applyCustomRange = (start, end) => {
    if (!start || !end) return;
    const range = createCustomRange(start, end);
    setDraftStart(range.start);
    setDraftEnd(range.end);
    onChange(range);
    setOpen(false);
  };

  const handleDaySelect = (day) => {
    if (!draftStart || draftEnd) {
      setDraftStart(day);
      setDraftEnd(null);
      showStartTooltip();
      return;
    }

    if (day < draftStart) {
      setDraftStart(day);
      setDraftEnd(null);
      showStartTooltip();
      return;
    }

    setStartTooltipVisible(false);
    applyCustomRange(draftStart, day);
  };

  return (
    <div ref={pickerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="admin-date-trigger"
        aria-expanded={open}
        title="اختيار التاريخ"
      >
        <span className="admin-date-trigger-icon">
          <CalendarDays className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1 text-right">
          <span className="block truncate text-[11px] font-black uppercase tracking-[0.14em] text-[#D97706] dark:text-[#FBBF24]">
            Date range
          </span>
          <span dir="ltr" className="mt-0.5 block truncate text-sm font-black text-[#111827] dark:text-[#FFF7ED]">
            {triggerLabel}
          </span>
        </span>
      </button>

      {open && (
        <div className="admin-date-popover">
          <span className="admin-date-ambient admin-date-ambient-one" />
          <span className="admin-date-ambient admin-date-ambient-two" />

          <div className="relative z-10 grid gap-4">
            <div className="admin-date-presets">
              {datePresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`admin-date-preset ${
                    value.preset === preset.id
                      ? "admin-date-preset-active"
                      : ""
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="min-w-0">
              <div className="admin-date-toolbar">
                <button
                  type="button"
                  onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
                  className="admin-date-nav"
                  aria-label="الشهر السابق"
                  title="الشهر السابق"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
                  className="admin-date-nav"
                  aria-label="الشهر التالي"
                  title="الشهر التالي"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>

              <div className="relative">
                {startTooltipVisible && (
                  <div className="admin-date-start-tooltip">
                    <Sparkles className="h-3.5 w-3.5" />
                    Start Date Selected
                  </div>
                )}
                <MonthCalendar
                  month={visibleMonth}
                  days={calendarDays}
                  start={draftStart}
                  end={draftEnd}
                  onSelect={handleDaySelect}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthCalendar({ month, days, start, end, onSelect }) {
  return (
    <div className="admin-calendar-card">
      <div className="admin-calendar-heading">
        <p>{monthFormatter.format(month)}</p>
        <span>
          {isSameDay(month, new Date(today.getFullYear(), today.getMonth(), 1)) ? "الحالي" : ""}
        </span>
      </div>

      <div className="admin-calendar-grid">
        {weekDays.map((day, index) => (
          <span key={day} className={`admin-weekday ${index === 0 || index === 6 ? "admin-weekend" : ""}`}>
            {day}
          </span>
        ))}
        {days.map((day) => {
          const selectedStart = start && isSameDay(day, start);
          const selectedEnd = end && isSameDay(day, end);
          const inRange = isBetween(day, start, end);
          const muted = day.getMonth() !== month.getMonth();
          const currentDay = isSameDay(day, today);
          const disabled = day > today;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => !disabled && onSelect(day)}
              disabled={disabled}
              className={`admin-calendar-day ${
                selectedStart || selectedEnd ? "admin-calendar-day-selected" : ""
              } ${inRange && !selectedStart && !selectedEnd ? "admin-calendar-day-range" : ""} ${
                muted ? "admin-calendar-day-muted" : ""
              } ${currentDay && !selectedStart && !selectedEnd ? "admin-calendar-day-today" : ""}`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
