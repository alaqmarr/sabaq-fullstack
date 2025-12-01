import { format } from "date-fns-tz";
import { toZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Kolkata";

export function formatDate(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  // Example: "Monday, January 1, 2024"
  return format(toZonedTime(d, TIMEZONE), "EEEE, MMMM d, yyyy", {
    timeZone: TIMEZONE,
  });
}

export function formatTime(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  // Example: "10:00 AM"
  return format(toZonedTime(d, TIMEZONE), "h:mm a", { timeZone: TIMEZONE });
}

export function formatDateTime(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  // Example: "Monday, January 1, 2024 at 10:00 AM"
  return format(toZonedTime(d, TIMEZONE), "EEEE, MMMM d, yyyy 'at' h:mm a", {
    timeZone: TIMEZONE,
  });
}
