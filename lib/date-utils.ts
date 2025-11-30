import { format } from "date-fns";

export function formatDate(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  // Example: "Monday, January 1, 2024"
  return format(d, "EEEE, MMMM d, yyyy");
}

export function formatTime(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  // Example: "10:00 AM"
  return format(d, "h:mm a");
}

export function formatDateTime(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  // Example: "Monday, January 1, 2024 at 10:00 AM"
  return format(d, "EEEE, MMMM d, yyyy 'at' h:mm a");
}
