"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { queueEmail } from "./email-queue";

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

export async function sendTestEmail(templateName: string) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "No user email found" };
    }

    // Dummy data for templates
    const dummyData = {
      userName: session.user.name || "Test User",
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
      action: "TEST_ACTION",
      resource: "/test/resource",
      userId: session.user.id,
      userEmail: session.user.email,
      updatedFields: ["Phone Number", "Email Address"],
      newRole: "ADMIN",
      features: ["Manage Users", "Manage Sabaqs", "Full System Access"],
      lostAccess: ["System Configuration", "Security Logs"],
    };

    await queueEmail(
      session.user.email,
      `Test Email: ${templateName}`,
      templateName,
      dummyData
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to send test email:", error);
    return { success: false, error: "Failed to send test email" };
  }
}

export async function sendAllTestEmails() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return { success: false, error: "No user email found" };
    }

    const templates = [
      "enrollment-approved",
      "enrollment-rejected",
      "session-reminder",
      "attendance-marked",
      "admin-otp",
      "session-summary",
      "session-absent",
      "question-answered",
      "security-flagged-user",
      "security-flagged-admin",
      "profile-updated",
      "role-promoted",
      "role-demoted",
      "admin-assigned",
      "sync-success",
      "sync-failed",
      "session-report",
    ];

    // Dummy data for templates
    const dummyData = {
      userName: session.user.name || "Test User",
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
    };

    // Queue all emails
    for (const template of templates) {
      await queueEmail(
        session.user.email,
        `Test Email: ${template}`,
        template,
        dummyData
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to send all test emails:", error);
    return { success: false, error: "Failed to send all test emails" };
  }
}
