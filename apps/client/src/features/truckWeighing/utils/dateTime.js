function padTwo(value) {
  return String(value).padStart(2, "0");
}

export function toISODate(d = new Date()) {
  return `${d.getFullYear()}-${padTwo(d.getMonth() + 1)}-${padTwo(d.getDate())}`;
}

export function toCurrentTime(d = new Date()) {
  return `${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`;
}

export function toLocalDateTime(dateValue, timeValue) {
  return `${dateValue}T${timeValue}:00`;
}

export function extractDate(value) {
  if (!value || typeof value !== "string") return "";
  const idx = value.indexOf("T");
  return idx > 0 ? value.slice(0, idx) : value.slice(0, 10);
}

export function extractTime(value) {
  if (!value || typeof value !== "string") return "";
  const idx = value.indexOf("T");
  const part = idx >= 0 ? value.slice(idx + 1) : value;
  return part.slice(0, 5);
}

export function formatDisplayDate(dateTimeText, dateTimeRaw) {
  if (dateTimeText) return dateTimeText;
  const datePart = extractDate(dateTimeRaw);
  if (!datePart) return "-";

  const dt = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return datePart;

  return dt.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDisplayTime(dateTimeRaw) {
  const timePart = extractTime(dateTimeRaw);
  return timePart || "-";
}
