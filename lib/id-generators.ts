import { prisma } from "./prisma";

/**
 * Generate a unique session ID based on sabaq and date
 * Pattern: {sabaqId}_{YYYY-MM-DD}
 * Example: mukhtasariyat-beginner_2025-12-01
 */
export function generateSessionId(
  sabaqId: string,
  scheduledDate: Date
): string {
  const dateStr = scheduledDate.toISOString().split("T")[0]; // YYYY-MM-DD
  return `${sabaqId}_${dateStr}`;
}

/**
 * Generate a unique enrollment ID based on user ITS and sabaq
 * Pattern: {its}_{sabaqId}
 * Example: 30800976_mukhtasariyat-beginner
 */
export function generateEnrollmentId(
  itsNumber: string,
  sabaqId: string
): string {
  return `${itsNumber}_${sabaqId}`;
}

/**
 * Generate a unique attendance ID based on user ITS and session
 * Pattern: {its}_{sessionId}
 * Example: 30800976_mukhtasariyat-beginner_2025-12-01
 */
export function generateAttendanceId(
  itsNumber: string,
  sessionId: string
): string {
  return `${itsNumber}_${sessionId}`;
}

/**
 * Generate a unique question ID with sequential numbering
 * Pattern: {sessionId}-{000001}
 * Example: mukhtasariyat-beginner_2025-12-01-000001
 */
export async function generateQuestionId(sessionId: string): Promise<string> {
  // Get the count of existing questions for this session
  const existingCount = await prisma.question.count({
    where: {
      sessionId: sessionId,
    },
  });

  // Increment and pad to 6 digits
  const nextNumber = (existingCount + 1).toString().padStart(6, "0");
  return `${sessionId}-${nextNumber}`;
}

/**
 * Slugify a string for use as an ID
 * Converts to lowercase, replaces spaces with hyphens, removes special chars
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
