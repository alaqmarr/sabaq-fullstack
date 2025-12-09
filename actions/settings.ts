"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { queueEmail, processEmailQueue } from "./email-queue";
import { waitUntil } from "@vercel/functions";

export async function checkSystemStatus() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    return { success: true, dbLatency: duration, status: "healthy" };
  } catch (error) {
    console.error("System status check failed:", error);
    return { success: false, error: "Database connection failed" };
  }
}

export async function sendTestEmail(
  templateName: string,
  customEmail?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "No user email found" };
    }

    const targetEmail = customEmail || session.user.email;

    // Dummy data for templates
    const dummyData = {
      userName: session.user.name || "Test User",
      userItsNumber: "12345678",
      sabaqName: "Test Sabaq Group",
      scheduledAt: new Date().toLocaleString(),
      approvedAt: new Date().toLocaleDateString(),
      rejectedAt: new Date().toLocaleDateString(),
      markedAt: new Date().toLocaleTimeString(),
      sessionDate: new Date().toLocaleDateString(),
      status: "Present",
      otp: "123456",
      expiryMinutes: 10,
      time: new Date().toLocaleTimeString(),
      ip: "127.0.0.1",
      device: "Chrome on Windows",
      action: "TEST_ACTION",
      resource: "/test/resource",
      userId: session.user.id,
      userEmail: session.user.email,
      updatedFields: ["Phone Number", "Email Address"],
      newRole: "ADMIN",
      features: ["Manage Users", "Manage Sabaqs", "Full System Access"],
      lostAccess: ["System Configuration", "Security Logs"],
      attendedCount: 15,
      totalSessions: 20,
      attendancePercent: 75,
      reportErrorLink: `${process.env.NEXT_PUBLIC_APP_URL}/help`,
      questionText: "What is the meaning of life?",
      answerText: "42",
      answeredAt: new Date().toLocaleString(),
      location: "Main Hall",
      whatsappGroupLink: "https://chat.whatsapp.com/test",
      reason: "Test reason for rejection",
      role: "Admin",
      assignedBy: "Super Admin",
    };

    // Fire and forget
    waitUntil(
      (async () => {
        try {
          await queueEmail(
            targetEmail,
            `Test Email: ${templateName}`,
            templateName,
            dummyData
          );
          await processEmailQueue();
        } catch (err) {
          console.error("Background email error (sendTestEmail):", err);
        }
      })()
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to send test email:", error);
    return { success: false, error: "Failed to send test email" };
  }
}

export async function sendAllTestEmails(customEmail?: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "No user email found" };
    }

    const targetEmail = customEmail || session.user.email;

    const templates = [
      "enrollment-approved",
      "enrollment-rejected",
      "session-reminder",
      "attendance-marked",
      "login-alert",
      "admin-otp",
      "session-summary",
      "session-absent",
      "low-attendance-warning",
      "question-answered",
      "feedback-response",
      "security-flagged-user",
      "security-flagged-admin",
      "profile-updated",
      "role-promoted",
      "role-demoted",
      "admin-assigned",
      "sync-success",
      "sync-failed",
      "session-report",
      "enrollment-request",
      "session-cancelled",
      "password-reset",
    ];

    // Dummy data for templates
    const dummyData = {
      userName: session.user.name || "Test User",
      userItsNumber: "12345678",
      sabaqName: "Test Sabaq Group",
      scheduledAt: new Date().toLocaleString(),
      approvedAt: new Date().toLocaleDateString(),
      rejectedAt: new Date().toLocaleDateString(),
      markedAt: new Date().toLocaleTimeString(),
      sessionDate: new Date().toLocaleDateString(),
      status: "Present",
      otp: "123456",
      expiryMinutes: 10,
      time: new Date().toLocaleTimeString(),
      ip: "127.0.0.1",
      device: "Chrome on Windows",
      action: "TEST_ACTION",
      resource: "/test/resource",
      userId: session.user.id,
      userEmail: session.user.email,
      questionText: "What is the meaning of life?",
      answerText: "42",
      answeredAt: new Date().toLocaleString(),
      location: "Main Hall",
      updatedFields: ["Phone Number", "Email Address"],
      newRole: "ADMIN",
      features: ["Manage Users", "Manage Sabaqs", "Full System Access"],
      lostAccess: ["System Configuration", "Security Logs"],
      attendedCount: 15,
      totalSessions: 20,
      attendancePercent: 75,
      reportErrorLink: `${process.env.NEXT_PUBLIC_APP_URL}/help`,
      whatsappGroupLink: "https://chat.whatsapp.com/test",
      reason: "Test reason for rejection",
      role: "Admin",
      assignedBy: "Super Admin",
      syncedCount: 150,
      duration: "2.5s",
      error: "Test error message",
      totalStudents: 50,
      presentCount: 40,
      absentCount: 8,
      lateCount: 2,
      // New template fields
      originalFeedback: "The session was informative and helpful!",
      adminResponse:
        "Thank you for your positive feedback. We appreciate you taking the time to share your experience.",
      respondedBy: "Janab Saheb",
      respondedAt: new Date().toLocaleString(),
      resetLink: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=test123`,
      requestedAt: new Date().toLocaleString(),
      originalDate: new Date().toLocaleDateString(),
      cancelledBy: "Super Admin",
      rescheduledTo: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toLocaleDateString(),
      adminName: session.user.name || "Admin User",
      adminItsNumber: "12345678",
      studentName: "Muhammad Ali",
      studentItsNumber: "87654321",
      studentEmail: "student@example.com",
      pendingCount: 5,
      missedStreak: 3,
      warningLevel: "MODERATE",
    };

    // Queue all emails
    // Fire and forget
    waitUntil(
      (async () => {
        try {
          for (const template of templates) {
            await queueEmail(
              targetEmail,
              `Test Email: ${template}`,
              template,
              dummyData
            );
          }
          await processEmailQueue();
        } catch (err) {
          console.error("Background email error (sendAllTestEmails):", err);
        }
      })()
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to send all test emails:", error);
    return { success: false, error: "Failed to send all test emails" };
  }
}
