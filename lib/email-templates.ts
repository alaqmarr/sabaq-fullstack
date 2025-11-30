/**
 * Professional Email Templates for Asbaaq Management System
 *
 * These templates follow email best practices:
 * - Responsive design (works on all devices)
 * - Premium aesthetics (gradients, soft shadows, refined typography)
 * - Clear call-to-action buttons
 * - Brand alignment (Logo + Ilm Quote)
 */

const emailStyles = `
  <style>
    @font-face {
      font-family: 'KanzAlMarjaan';
      src: url('https://db.onlinewebfonts.com/t/056353a27c68233bc7a6200e574e746f.woff2') format('woff2');
    }
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #4a5568;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      background-color: #f7fafc;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      border: 1px solid #edf2f7;
    }
    .header {
      background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #d4af37, #f6e05e, #d4af37);
    }
    .logo {
      max-width: 120px;
      height: auto;
      margin-bottom: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }
    .ilm-quote {
      font-family: 'KanzAlMarjaan', 'Traditional Arabic', serif;
      font-size: 26px;
      color: #f6e05e;
      margin-top: 15px;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      line-height: 1.4;
    }
    .quote-translation {
      font-size: 12px;
      color: #a0aec0;
      margin-top: 5px;
      font-style: italic;
    }
    .content {
      padding: 50px 40px;
      background-color: #ffffff;
    }
    .greeting {
      font-size: 22px;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 20px;
      letter-spacing: -0.5px;
    }
    .message {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 30px;
      line-height: 1.7;
    }
    .info-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 25px;
      margin: 30px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #edf2f7;
    }
    .info-row:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .info-label {
      font-weight: 600;
      color: #718096;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .info-value {
      color: #2d3748;
      font-weight: 600;
      text-align: right;
      font-size: 15px;
    }
    .button-container {
      text-align: center;
      margin: 40px 0 20px;
    }
    .button {
      display: inline-block;
      padding: 16px 36px;
      background: linear-gradient(135deg, #d4af37 0%, #b7950b 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
    }
    .footer {
      background-color: #f7fafc;
      padding: 30px;
      text-align: center;
      font-size: 13px;
      color: #a0aec0;
      border-top: 1px solid #edf2f7;
    }
    .footer-links a {
      color: #718096;
      text-decoration: none;
      margin: 0 8px;
      transition: color 0.2s;
    }
    .footer-links a:hover {
      color: #4a5568;
      text-decoration: underline;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-success { background-color: #c6f6d5; color: #22543d; }
    .status-warning { background-color: #fefcbf; color: #744210; }
    .status-error { background-color: #fed7d7; color: #822727; }
    .status-info { background-color: #bee3f8; color: #2a4365; }
    
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; margin: 0; border-radius: 0; border: none; }
      .content { padding: 30px 20px; }
      .info-row { flex-direction: column; align-items: flex-start; }
      .info-value { text-align: left; margin-top: 6px; }
      .button { width: 80%; text-align: center; }
    }
  </style>
`;

const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/logo.jpg`;
const ilmQuote = "طَلَبُ العِلْمُ فَرِيضَةٌ عَلَىٰ كُلِّ مُسْلِمٍ وَمُسْلِمَةٍ";
const quoteTranslation =
  "Seeking knowledge is an obligation upon every Muslim and Muslimah";

interface BaseTemplateProps {
  title: string;
  content: string;
  previewText?: string;
}

const baseEmailTemplate = ({
  title,
  content,
  previewText,
}: BaseTemplateProps) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${emailStyles}
</head>
<body>
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${previewText || title}
  </div>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Sabaq Logo" class="logo">
      <div class="ilm-quote">${ilmQuote}</div>
      <div class="quote-translation">${quoteTranslation}</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Sabaq Management System. All rights reserved.</p>
      <div class="footer-links">
        <a href="#">Privacy Policy</a> • <a href="#">Terms of Service</a> • <a href="#">Support</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

// 1. Enrollment Approved
export const enrollmentApprovedTemplate = (data: {
  userName: string;
  sabaqName: string;
  approvedAt: string;
  whatsappGroupLink?: string;
}) => {
  const content = `
    <div class="greeting">Mubarak, ${data.userName}!</div>
    <div class="message">
      We are delighted to inform you that your enrollment request has been approved. You are now officially a member of <strong>${
        data.sabaqName
      }</strong>.
    </div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Sabaq Name</span>
        <span class="info-value">${data.sabaqName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge status-success">Approved</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Date Approved</span>
        <span class="info-value">${data.approvedAt}</span>
      </div>
    </div>
    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">Access Dashboard</a>
      ${
        data.whatsappGroupLink
          ? `<br/><br/><a href="${data.whatsappGroupLink}" style="color: #25D366; text-decoration: none; font-weight: 600; font-size: 14px;">Join WhatsApp Group &rarr;</a>`
          : ""
      }
    </div>
  `;
  return baseEmailTemplate({
    title: "Enrollment Approved",
    previewText: `Your enrollment in ${data.sabaqName} has been approved.`,
    content,
  });
};

// 2. Enrollment Rejected
export const enrollmentRejectedTemplate = (data: {
  userName: string;
  sabaqName: string;
  reason?: string;
  rejectedAt: string;
}) => {
  const content = `
    <div class="greeting">Dear ${data.userName},</div>
    <div class="message">
      Thank you for your interest. We regret to inform you that your enrollment request for <strong>${
        data.sabaqName
      }</strong> could not be approved at this time.
    </div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Sabaq Name</span>
        <span class="info-value">${data.sabaqName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge status-error">Declined</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${data.rejectedAt}</span>
      </div>
      ${
        data.reason
          ? `
      <div class="info-row">
        <span class="info-label">Reason</span>
        <span class="info-value">${data.reason}</span>
      </div>`
          : ""
      }
    </div>
    <div class="message">
      If you have any questions or believe this decision was made in error, please contact the administration.
    </div>
  `;
  return baseEmailTemplate({
    title: "Enrollment Update",
    previewText: `Update regarding your enrollment in ${data.sabaqName}.`,
    content,
  });
};

// 3. Session Reminder
export const sessionReminderTemplate = (data: {
  userName: string;
  sabaqName: string;
  scheduledAt: string;
  location?: string;
}) => {
  const content = `
    <div class="greeting">Upcoming Session Reminder</div>
    <div class="message">
      Dear ${
        data.userName
      }, this is a gentle reminder for your upcoming sabaq session. We look forward to seeing you.
    </div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Sabaq</span>
        <span class="info-value">${data.sabaqName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${data.scheduledAt}</span>
      </div>
      ${
        data.location
          ? `
      <div class="info-row">
        <span class="info-label">Location</span>
        <span class="info-value">${data.location}</span>
      </div>`
          : ""
      }
    </div>
    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">View Session Details</a>
    </div>
  `;
  return baseEmailTemplate({
    title: "Session Reminder",
    previewText: `Upcoming session for ${data.sabaqName} at ${data.scheduledAt}.`,
    content,
  });
};

// 4. Attendance Marked
export const attendanceMarkedTemplate = (data: {
  userName: string;
  sabaqName: string;
  status: string;
  markedAt: string;
  sessionDate: string;
}) => {
  const isLate = data.status.toLowerCase() === "late";
  const statusClass = isLate ? "status-warning" : "status-success";

  const content = `
    <div class="greeting">Attendance Recorded</div>
    <div class="message">
      Your attendance has been successfully recorded for the session on <strong>${data.sessionDate}</strong>.
    </div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Sabaq</span>
        <span class="info-value">${data.sabaqName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge ${statusClass}">${data.status}</span></span>
      </div>
      <div class="info-row">
        <span class="info-label">Marked At</span>
        <span class="info-value">${data.markedAt}</span>
      </div>
    </div>
  `;
  return baseEmailTemplate({
    title: "Attendance Marked",
    previewText: `Attendance marked as ${data.status} for ${data.sabaqName}.`,
    content,
  });
};

// 5. Login Alert
export const loginAlertTemplate = (data: {
  userName: string;
  time: string;
  ip?: string;
  device?: string;
}) => {
  const content = `
    <div class="greeting">Security Alert</div>
    <div class="message">
      We detected a new login to your account <strong>${data.userName}</strong>.
    </div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Time</span>
        <span class="info-value">${data.time}</span>
      </div>
      ${
        data.ip
          ? `
      <div class="info-row">
        <span class="info-label">IP Address</span>
        <span class="info-value">${data.ip}</span>
      </div>`
          : ""
      }
      ${
        data.device
          ? `
      <div class="info-row">
        <span class="info-label">Device</span>
        <span class="info-value">${data.device}</span>
      </div>`
          : ""
      }
    </div>
    <div class="message">
      If this was you, no action is needed. If you did not authorize this login, please secure your account immediately.
    </div>
  `;
  return baseEmailTemplate({
    title: "New Login Detected",
    previewText: `New login detected for your account at ${data.time}.`,
    content,
  });
};

// 6. Admin OTP
export const adminOtpTemplate = (data: {
  otp: string;
  expiryMinutes: number;
}) => {
  const content = `
    <div class="greeting">Verification Required</div>
    <div class="message">
      Please use the One-Time Password (OTP) below to verify your identity. This code is valid for ${data.expiryMinutes} minutes.
    </div>
    <div style="text-align: center; margin: 40px 0;">
      <div style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2d3748; background: #edf2f7; padding: 24px 40px; display: inline-block; border-radius: 12px; border: 2px dashed #cbd5e0;">
        ${data.otp}
      </div>
    </div>
    <div class="message" style="text-align: center; font-size: 14px; color: #718096;">
      Do not share this code with anyone.
    </div>
  `;
  return baseEmailTemplate({
    title: "Your Verification Code",
    previewText: `Your admin verification code is ${data.otp}.`,
    content,
  });
};

// 7. Session Summary (Present/Late)
export const sessionSummaryTemplate = (data: {
  userName: string;
  sabaqName: string;
  scheduledAt: string;
  status: string;
  minutesLate?: number;
}) => {
  const isLate = data.status.toLowerCase() === "late";
  const statusClass = isLate ? "status-warning" : "status-success";

  const content = `
    <div class="greeting">Session Summary</div>
    <div class="message">
      Thank you for attending. Here is the summary for your recent session.
    </div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Sabaq</span>
        <span class="info-value">${data.sabaqName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date & Time</span>
        <span class="info-value">${data.scheduledAt}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Attendance</span>
        <span class="info-value"><span class="status-badge ${statusClass}">${
    data.status
  }</span></span>
      </div>
      ${
        isLate && data.minutesLate
          ? `
      <div class="info-row">
        <span class="info-label">Minutes Late</span>
        <span class="info-value">${data.minutesLate} mins</span>
      </div>`
          : ""
      }
    </div>
  `;
  return baseEmailTemplate({
    title: `Session Summary: ${data.sabaqName}`,
    previewText: `You were marked ${data.status} for ${data.sabaqName}.`,
    content,
  });
};

// 8. Session Absent
export const sessionAbsentTemplate = (data: {
  userName: string;
  sabaqName: string;
  scheduledAt: string;
}) => {
  const content = `
    <div class="greeting">Missed Session</div>
    <div class="message">
      We noticed you missed the recent sabaq session. Consistent attendance is key to progress.
    </div>
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Sabaq</span>
        <span class="info-value">${data.sabaqName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date & Time</span>
        <span class="info-value">${data.scheduledAt}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Status</span>
        <span class="info-value"><span class="status-badge status-error">Absent</span></span>
      </div>
    </div>
    <div class="message">
      Please try to attend the next session on time.
    </div>
  `;
  return baseEmailTemplate({
    title: `Missed Session: ${data.sabaqName}`,
    previewText: `You were marked absent for ${data.sabaqName}.`,
    content,
  });
};

// 9. Question Answered
export const questionAnsweredTemplate = (data: {
  userName: string;
  sabaqName: string;
  questionText: string;
  answerText: string;
  answeredAt: string;
}) => {
  const content = `
    <div class="greeting">Question Answered</div>
    <div class="message">
      Great news! Your question in <strong>${data.sabaqName}</strong> has received an answer.
    </div>
    <div class="info-box">
      <div class="info-row" style="flex-direction: column; align-items: flex-start; border-bottom: none;">
        <span class="info-label" style="margin-bottom: 8px;">Your Question</span>
        <span class="info-value" style="text-align: left; font-style: italic; color: #718096; font-weight: 400;">"${data.questionText}"</span>
      </div>
    </div>
    <div class="info-box" style="background-color: #f0fff4; border-color: #c6f6d5; margin-top: -10px;">
      <div class="info-row" style="flex-direction: column; align-items: flex-start; border-bottom: 1px solid #c6f6d5;">
        <span class="info-label" style="margin-bottom: 8px; color: #2f855a;">Answer</span>
        <span class="info-value" style="text-align: left; color: #22543d;">${data.answerText}</span>
      </div>
      <div class="info-row" style="margin-top: 15px; padding-top: 10px; border-bottom: none;">
        <span class="info-label" style="color: #2f855a;">Answered At</span>
        <span class="info-value" style="color: #22543d;">${data.answeredAt}</span>
      </div>
    </div>
    <div class="button-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/questions" class="button">View Discussion</a>
    </div>
  `;
  return baseEmailTemplate({
    title: "Your Question Has Been Answered",
    previewText: `An answer has been posted to your question in ${data.sabaqName}.`,
    content,
  });
};
