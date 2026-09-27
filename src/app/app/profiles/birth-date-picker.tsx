"use client";

import { useMemo, useState } from "react";
import {
  ageFromDob,
  daysInMonth,
  maxDobIso,
  minDobIso,
  toIsoDate,
} from "@/lib/profile/completeness";
import { MONTH_LABELS } from "@/lib/profile/options";
import { Select3d } from "@/components/select3d";
import { inputClass } from "@/lib/ui/classes";

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return null;
  return { year, monthIndex: month - 1, day };
}

export function BirthDatePicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const maxIso = maxDobIso();
  const minIso = minDobIso();
  const max = parseIso(maxIso)!;
  const min = parseIso(minIso)!;
  const initial = defaultValue ? parseIso(defaultValue) : null;

  const [year, setYear] = useState(initial ? String(initial.year) : "");
  const [month, setMonth] = useState(initial ? String(initial.monthIndex) : "");
  const [day, setDay] = useState(initial ? String(initial.day) : "");

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = max.year; y >= min.year; y -= 1) list.push(y);
    return list;
  }, [max.year, min.year]);

  const viewYear = year === "" ? max.year : Number(year);
  const viewMonth = month === "" ? 0 : Number(month);
  const dayCount = daysInMonth(viewYear, viewMonth);

  const iso =
    year !== "" && month !== "" && day !== ""
      ? toIsoDate(new Date(Number(year), Number(month), Number(day)))
      : "";
  const age = iso ? ageFromDob(iso) : null;

  function pick(nextYear: string, nextMonth: string, nextDay: string) {
    setYear(nextYear);
    setMonth(nextMonth);
    if (nextYear === "" || nextMonth === "") {
      setDay("");
      return;
    }
    const maxDate = new Date(max.year, max.monthIndex, max.day);
    const minDate = new Date(min.year, min.monthIndex, min.day);
    const last = daysInMonth(Number(nextYear), Number(nextMonth));
    if (nextDay === "") {
      setDay("");
      return;
    }
    const clamped = Math.min(Number(nextDay), last);
    let next = new Date(Number(nextYear), Number(nextMonth), clamped);
    if (next > maxDate) next = maxDate;
    if (next < minDate) next = minDate;
    setYear(String(next.getFullYear()));
    setMonth(String(next.getMonth()));
    setDay(String(next.getDate()));
  }

  return (
    <div className="birth-cal">
      <div className="birth-cal-toolbar">
        <Select3d
          aria-label="Birth day"
          className={inputClass}
          required
          value={day}
          onChange={(e) => pick(year, month, e.target.value)}
        >
          <option value="">Day</option>
          {Array.from({ length: dayCount }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              {i + 1}
            </option>
          ))}
        </Select3d>
        <Select3d
          aria-label="Birth month"
          className={inputClass}
          required
          value={month}
          onChange={(e) => pick(year, e.target.value, day)}
        >
          <option value="">Month</option>
          {MONTH_LABELS.map((label, i) => (
            <option key={label} value={String(i)}>
              {label}
            </option>
          ))}
        </Select3d>
        <Select3d
          aria-label="Birth year"
          className={inputClass}
          required
          value={year}
          onChange={(e) => pick(e.target.value, month, day)}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </Select3d>
      </div>
      <input type="hidden" name={name} value={iso} />
      {age ? (
        <p className="birth-cal-age" aria-live="polite">
          Age today: <strong>{age.years}</strong> years, {age.months} months, {age.days} days
        </p>
      ) : (
        <p className="birth-cal-caption">Must be 21 or older.</p>
      )}
    </div>
  );
}

function parseTime(value?: string | null) {
  const match = /^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/.exec((value ?? "").trim());
  if (!match) return { hour: "", minute: "", meridiem: "AM" };
  let hour24 = Number(match[1]);
  if (!Number.isFinite(hour24) || hour24 < 0 || hour24 > 23) {
    return { hour: "", minute: "", meridiem: "AM" };
  }
  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return { hour: String(hour12), minute: match[2], meridiem };
}

export function BirthTimePicker({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const initial = parseTime(defaultValue);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const [meridiem, setMeridiem] = useState(initial.meridiem);

  const iso =
    hour !== "" && minute !== ""
      ? (() => {
          let h = Number(hour) % 12;
          if (meridiem === "PM") h += 12;
          return `${String(h).padStart(2, "0")}:${minute}`;
        })()
      : "";

  return (
    <div className="birth-cal">
      <div className="birth-cal-toolbar">
        <Select3d
          aria-label="Birth hour"
          className={inputClass}
          value={hour}
          onChange={(e) => setHour(e.target.value)}
        >
          <option value="">Hour</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              {i + 1}
            </option>
          ))}
        </Select3d>
        <Select3d
          aria-label="Birth minute"
          className={inputClass}
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
        >
          <option value="">Min</option>
          {Array.from({ length: 60 }, (_, i) => {
            const v = String(i).padStart(2, "0");
            return (
              <option key={v} value={v}>
                {v}
              </option>
            );
          })}
        </Select3d>
        <Select3d
          aria-label="AM or PM"
          className={inputClass}
          value={meridiem}
          onChange={(e) => setMeridiem(e.target.value)}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </Select3d>
      </div>
      <input type="hidden" name={name} value={iso} />
    </div>
  );
}
