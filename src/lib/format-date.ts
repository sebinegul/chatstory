/** Format as dd/mm/yyyy */
export function formatDateDMY(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Format as dd/mm/yyyy, h:mm am/pm */
export function formatDateTimeDMY(input: Date | string | number): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "—";
  const date = formatDateDMY(d);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const meridiem = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return `${date}, ${hours}:${minutes} ${meridiem}`;
}

/** Accept YYYY-MM-DD day key and show dd/mm/yyyy */
export function formatDayKeyDMY(dayKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) return dayKey || "—";
  const [y, m, d] = dayKey.split("-");
  return `${d}/${m}/${y}`;
}
