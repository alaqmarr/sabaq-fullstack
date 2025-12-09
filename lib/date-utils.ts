import { format } from "date-fns-tz";
import { toZonedTime } from "date-fns-tz";
import {
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";

const TIMEZONE = "Asia/Kolkata";

// Helper to convert to IST and format
function formatInIST(date: Date | string | number, pattern: string): string {
  if (!date) return "";
  const d = new Date(date);
  return format(toZonedTime(d, TIMEZONE), pattern, { timeZone: TIMEZONE });
}

// Full date: "Monday, January 1, 2024"
export function formatDate(date: Date | string | number): string {
  return formatInIST(date, "EEEE, MMMM d, yyyy");
}

// Time only: "10:00 AM"
export function formatTime(date: Date | string | number): string {
  return formatInIST(date, "h:mm a");
}

// Full date + time: "Monday, January 1, 2024 at 10:00 AM"
export function formatDateTime(date: Date | string | number): string {
  return formatInIST(date, "EEEE, MMMM d, yyyy 'at' h:mm a");
}

// Short date: "Dec 9, 2024"
export function formatShortDate(date: Date | string | number): string {
  return formatInIST(date, "MMM d, yyyy");
}

// Short date + time: "Dec 9, 2024 10:30 AM"
export function formatShortDateTime(date: Date | string | number): string {
  return formatInIST(date, "MMM d, yyyy h:mm a");
}

// Date code format: "09/12/24"
export function formatDateCode(date: Date | string | number): string {
  return formatInIST(date, "dd/MM/yy");
}

// Date code with time: "09/12/24 10:30"
export function formatDateTimeCode(date: Date | string | number): string {
  return formatInIST(date, "dd/MM/yy HH:mm");
}

// Time in 24h format: "10:30"
export function formatTime24(date: Date | string | number): string {
  return formatInIST(date, "HH:mm");
}

// Day with date: "Mon, 09 Dec 2024"
export function formatDayDate(date: Date | string | number): string {
  return formatInIST(date, "EEE, dd MMM yyyy");
}

// Compact: "PPP" style - "December 9th, 2024"
export function formatPPP(date: Date | string | number): string {
  return formatInIST(date, "MMMM do, yyyy");
}

// Compact date+time: "Dec 9, 2024 at 10:30 AM"
export function formatPPPp(date: Date | string | number): string {
  return formatInIST(date, "PPP 'at' p");
}

// ISO format for form inputs (local time representation)
export function formatISODate(date: Date | string | number): string {
  return formatInIST(date, "yyyy-MM-dd");
}

// ISO time for form inputs
export function formatISOTime(date: Date | string | number): string {
  return formatInIST(date, "HH:mm");
}

// Relative time: "2 hours ago", "in 3 days"
export function formatRelative(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

// Smart date: "Today", "Yesterday", "Tomorrow", or short date
export function formatSmartDate(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  const zonedDate = toZonedTime(d, TIMEZONE);

  if (isToday(zonedDate)) return "Today";
  if (isTomorrow(zonedDate)) return "Tomorrow";
  if (isYesterday(zonedDate)) return "Yesterday";

  return formatInIST(date, "EEE, MMM d");
}

// Generic format function for custom patterns (IST-aware)
export function formatCustom(
  date: Date | string | number,
  pattern: string
): string {
  return formatInIST(date, pattern);
}
