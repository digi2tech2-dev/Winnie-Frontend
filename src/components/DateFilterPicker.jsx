import { useMemo } from "react";
import DateRangePicker from "./admin/dashboard/DateRangePicker";
import { createCustomRange, getPresetRange, toDateInputValue } from "../data/adminDashboard";

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default function DateFilterPicker({
  allowAll = true,
  className = "",
  from,
  onChange,
  preset = "custom",
  to,
}) {
  const value = useMemo(() => {
    const start = parseDate(from);
    const end = parseDate(to);

    if (!start || !end) {
      if (allowAll) {
        return { start: null, end: null, key: "all", label: "كل الفترات", preset: "all" };
      }
      return getPresetRange("thisMonth");
    }

    return { ...createCustomRange(start, end), preset };
  }, [allowAll, from, preset, to]);

  const handleChange = (range) => {
    onChange({
      dateFrom: range.start ? toDateInputValue(range.start) : "",
      datePreset: range.preset,
      dateTo: range.end ? toDateInputValue(range.end) : "",
    });
  };

  return (
    <div className={`unified-date-filter min-w-0 ${className}`}>
      <DateRangePicker allowAll={allowAll} value={value} onChange={handleChange} />
    </div>
  );
}
