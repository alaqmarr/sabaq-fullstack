"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail, EmailAttachment } from "@/lib/email";
import {
  enrollmentApprovedTemplate,
  enrollmentRejectedTemplate,
  sessionReminderTemplate,
  attendanceMarkedTemplate,
  adminOtpTemplate,
  sessionSummaryTemplate,
  sessionAbsentTemplate,
  questionAnsweredTemplate,
  securityFlaggedUserTemplate,
  securityFlaggedAdminTemplate,
  profileUpdatedTemplate,
  rolePromotedTemplate,
  roleDemotedTemplate,
  adminAssignedTemplate,
  syncSuccessTemplate,
  syncFailedTemplate,
  sessionReportTemplate,
  loginAlertTemplate,
  feedbackResponseTemplate,
  passwordResetTemplate,
  sessionCancelledTemplate,
  enrollmentRequestTemplate,
  lowAttendanceWarningTemplate,
} from "@/lib/email-templates";

// Queue an email with optional attachments
export async function queueEmail(
  to: string,
  subject: string,
  template: string,
  templateData?: any,
  attachments?: EmailAttachment[]
) {
  try {
    await prisma.emailLog.create({
      data: {
        to,
        subject,
        template: JSON.stringify({
          templateName: template,
          data: templateData,
          attachments: attachments || [],
        }),
        status: "PENDING",
      },
    });

    // Trigger processing immediately for urgent emails (OTPs, alerts, etc.)
    // We skip this for 'session-reminder' as those are handled by a scheduled job.
    if (template !== "session-reminder") {
      await processEmailQueue();
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to queue email:", error);
    return { success: false, error: "Failed to queue email" };
  }
}

// Process pending emails from the queue
export async function processEmailQueue() {
  try {
    // Fetch pending emails
    const pendingEmails = await prisma.emailLog.findMany({
      where: {
        status: "PENDING",
      },
      take: 50, // Process max 50 emails at a time
      orderBy: {
        createdAt: "asc",
      },
    });

    let successCount = 0;
    let failureCount = 0;

    for (const email of pendingEmails) {
      try {
        // Parse template data
        const templateInfo = JSON.parse(email.template);
        let html = "";

        // Render template based on template name
        switch (templateInfo.templateName) {
          case "enrollment-approved":
            html = enrollmentApprovedTemplate(templateInfo.data);
            break;
          case "enrollment-rejected":
            html = enrollmentRejectedTemplate(templateInfo.data);
            break;
          case "session-reminder":
            html = sessionReminderTemplate(templateInfo.data);
            break;
          case "attendance-marked":
            html = attendanceMarkedTemplate(templateInfo.data);
            break;
          case "admin-otp":
            html = adminOtpTemplate(templateInfo.data);
            break;
          case "session-summary":
            html = sessionSummaryTemplate(templateInfo.data);
            break;
          case "session-absent":
            html = sessionAbsentTemplate(templateInfo.data);
            break;
          case "question-answered":
            html = questionAnsweredTemplate(templateInfo.data);
            break;
          case "security-flagged-user":
            html = securityFlaggedUserTemplate(templateInfo.data);
            break;
          case "security-flagged-admin":
            html = securityFlaggedAdminTemplate(templateInfo.data);
            break;
          case "profile-updated":
            html = profileUpdatedTemplate(templateInfo.data);
            break;
          case "role-promoted":
            html = rolePromotedTemplate(templateInfo.data);
            break;
          case "role-demoted":
            html = roleDemotedTemplate(templateInfo.data);
            break;
          case "admin-assigned":
            html = adminAssignedTemplate(templateInfo.data);
            break;
          case "sync-success":
            html = syncSuccessTemplate(templateInfo.data);
            break;
          case "sync-failed":
            html = syncFailedTemplate(templateInfo.data);
            break;
          case "session-report":
            html = sessionReportTemplate(templateInfo.data);
            break;
          case "login-alert":
            html = loginAlertTemplate(templateInfo.data);
            break;
          case "feedback-response":
            html = feedbackResponseTemplate(templateInfo.data);
            break;
          case "password-reset":
            html = passwordResetTemplate(templateInfo.data);
            break;
          case "session-cancelled":
            html = sessionCancelledTemplate(templateInfo.data);
            break;
          case "enrollment-request":
            html = enrollmentRequestTemplate(templateInfo.data);
            break;
          case "low-attendance-warning":
            html = lowAttendanceWarningTemplate(templateInfo.data);
            break;
          default:
            throw new Error(`Unknown template: ${templateInfo.templateName}`);
        }

        // Send email with attachments if provided
        const attachments = templateInfo.attachments || [];
        const result = await sendEmail(
          email.to,
          email.subject,
          html,
          attachments
        );

        if (result.success) {
          // Update status to SENT
          await prisma.emailLog.update({
            where: { id: email.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
            },
          });
          successCount++;
        } else {
          // Update status to FAILED with error message
          await prisma.emailLog.update({
            where: { id: email.id },
            data: {
              status: "FAILED",
              error: result.error || "Unknown error",
            },
          });
          failureCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        // Mark as failed
        await prisma.emailLog.update({
          where: { id: email.id },
          data: {
            status: "FAILED",
            error: error.message || "Unknown error",
          },
        });
        failureCount++;
      }
    }

    return {
      success: true,
      processed: pendingEmails.length,
      successCount,
      failureCount,
    };
  } catch (error: any) {
    console.error("Failed to process email queue:", error);
    return {
      success: false,
      error: error.message || "Failed to process email queue",
    };
  }
}

// Get email queue statistics
export async function getEmailStats() {
  try {
    const [pending, sent, failed, total] = await Promise.all([
      prisma.emailLog.count({ where: { status: "PENDING" } }),
      prisma.emailLog.count({ where: { status: "SENT" } }),
      prisma.emailLog.count({ where: { status: "FAILED" } }),
      prisma.emailLog.count(),
    ]);

    return {
      success: true,
      stats: {
        pending,
        sent,
        failed,
        total,
        successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
      },
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch email stats" };
  }
}

// Retry failed emails
export async function retryFailedEmails() {
  try {
    const result = await prisma.emailLog.updateMany({
      where: {
        status: "FAILED",
      },
      data: {
        status: "PENDING",
        error: null,
      },
    });

    return { success: true, retriedCount: result.count };
  } catch (error) {
    return { success: false, error: "Failed to retry emails" };
  }
}
