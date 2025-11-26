'use server';

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import {
    enrollmentApprovedTemplate,
    enrollmentRejectedTemplate,
    sessionReminderTemplate,
    attendanceMarkedTemplate,
} from '@/lib/email-templates';

// Queue an email
export async function queueEmail(
    to: string,
    subject: string,
    template: string,
    templateData?: any
) {
    try {
        await prisma.emailLog.create({
            data: {
                to,
                subject,
                template: JSON.stringify({ templateName: template, data: templateData }),
                status: 'PENDING',
            },
        });
        return { success: true };
    } catch (error) {
        console.error('Failed to queue email:', error);
        return { success: false, error: 'Failed to queue email' };
    }
}

// Process pending emails from the queue
export async function processEmailQueue() {
    try {
        // Fetch pending emails
        const pendingEmails = await prisma.emailLog.findMany({
            where: {
                status: 'PENDING',
            },
            take: 50, // Process max 50 emails at a time
            orderBy: {
                createdAt: 'asc',
            },
        });

        let successCount = 0;
        let failureCount = 0;

        for (const email of pendingEmails) {
            try {
                // Parse template data
                const templateInfo = JSON.parse(email.template);
                let html = '';

                // Render template based on template name
                switch (templateInfo.templateName) {
                    case 'enrollment-approved':
                        html = enrollmentApprovedTemplate(templateInfo.data);
                        break;
                    case 'enrollment-rejected':
                        html = enrollmentRejectedTemplate(templateInfo.data);
                        break;
                    case 'session-reminder':
                        html = sessionReminderTemplate(templateInfo.data);
                        break;
                    case 'attendance-marked':
                        html = attendanceMarkedTemplate(templateInfo.data);
                        break;
                    default:
                        throw new Error(`Unknown template: ${templateInfo.templateName}`);
                }

                // Send email
                const result = await sendEmail(email.to, email.subject, html);

                if (result.success) {
                    // Update status to SENT
                    await prisma.emailLog.update({
                        where: { id: email.id },
                        data: {
                            status: 'SENT',
                            sentAt: new Date(),
                        },
                    });
                    successCount++;
                } else {
                    // Update status to FAILED with error message
                    await prisma.emailLog.update({
                        where: { id: email.id },
                        data: {
                            status: 'FAILED',
                            error: result.error || 'Unknown error',
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
                        status: 'FAILED',
                        error: error.message || 'Unknown error',
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
        console.error('Failed to process email queue:', error);
        return { success: false, error: error.message || 'Failed to process email queue' };
    }
}

// Get email queue statistics
export async function getEmailStats() {
    try {
        const [pending, sent, failed, total] = await Promise.all([
            prisma.emailLog.count({ where: { status: 'PENDING' } }),
            prisma.emailLog.count({ where: { status: 'SENT' } }),
            prisma.emailLog.count({ where: { status: 'FAILED' } }),
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
        return { success: false, error: 'Failed to fetch email stats' };
    }
}

// Retry failed emails
export async function retryFailedEmails() {
    try {
        const result = await prisma.emailLog.updateMany({
            where: {
                status: 'FAILED',
            },
            data: {
                status: 'PENDING',
                error: null,
            },
        });

        return { success: true, retriedCount: result.count };
    } catch (error) {
        return { success: false, error: 'Failed to retry emails' };
    }
}
