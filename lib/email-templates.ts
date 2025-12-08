/**
 * Professional Email Templates for Sabaq Management System
 * Optimized for maximum responsiveness, clarity, and professional aesthetics.
 */

const emailStyles = `
  <style>
    @font-face {
      font-family: 'KanzAlMarjaan';
      src: url('https://db.onlinewebfonts.com/t/056353a27c68233bc7a6200e574e746f.woff2') format('woff2');
    }
    
    /* Reset & Base */
    body {
      font-family: 'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f4f4f7;
      color: #333333;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      line-height: 1.6;
    }

    table {
      border-spacing: 0;
      border-collapse: collapse;
      width: 100%;
    }

    /* Container */
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f4f4f7;
      padding-bottom: 40px;
    }

    .main-container {
      background-color: #ffffff;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      border: 1px solid #eaeaec;
    }

    /* Header */
    .header {
      background: #1a202c; /* Solid professional dark bg */
      padding: 30px 20px;
      text-align: center;
      border-bottom: 3px solid #d4af37;
    }

    .logo {
      width: 80px;
      height: auto;
      border-radius: 6px;
      margin-bottom: 15px;
    }

    .ilm-quote {
      font-family: 'KanzAlMarjaan', 'Traditional Arabic', serif;
      font-size: 22px;
      color: #f6e6b4;
      margin: 0;
      line-height: 1.4;
    }

    .quote-translation {
      font-size: 11px;
      color: #a0aec0;
      margin-top: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Content */
    .content {
      padding: 40px 30px;
      text-align: left;
    }

    .greeting {
      font-size: 20px;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 15px;
    }

    .message {
      font-size: 15px;
      color: #555555;
      margin-bottom: 25px;
    }

    /* Data/Info Box - Table based for perfect alignment */
    .info-table {
      width: 100%;
      background-color: #f9fafb;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 25px;
    }

    .info-row td {
      padding: 12px 15px;
      border-bottom: 1px solid #edf2f7;
      vertical-align: top;
    }

    .info-row:last-child td {
      border-bottom: none;
    }

    .info-label {
      font-size: 12px;
      font-weight: 600;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      width: 35%;
      white-space: nowrap;
    }

    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
      text-align: right;
    }

    /* Alerts & Highlights */
    .highlight-box {
      background-color: #fffbf0;
      border-left: 4px solid #d4af37;
      padding: 15px;
      font-size: 14px;
      color: #744210;
      margin-bottom: 25px;
      border-radius: 4px;
    }

    .alert-box {
      background-color: #fff5f5;
      border-left: 4px solid #e53e3e;
      padding: 15px;
      font-size: 14px;
      color: #c53030;
      margin-bottom: 25px;
      border-radius: 4px;
    }

    .success-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 15px;
      font-size: 14px;
      color: #065f46;
      margin-bottom: 25px;
      border-radius: 4px;
    }

    /* Buttons */
    .button-container {
      text-align: center;
      margin-top: 30px;
      margin-bottom: 20px;
    }

    .button {
      background-color: #d4af37;
      color: #ffffff !important;
      display: inline-block;
      padding: 14px 30px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: background-color 0.2s;
    }

    .button:hover {
      background-color: #bfa13f;
    }

    /* Badges */
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      display: inline-block;
    }
    .badge-success { background-color: #def7ec; color: #03543f; }
    .badge-warning { background-color: #fdf6b2; color: #723b13; }
    .badge-error { background-color: #fde8e8; color: #9b1c1c; }
    .badge-info { background-color: #e1effe; color: #1e429f; }

    /* Footer */
    .footer {
      background-color: #f9fafb;
      padding: 25px;
      text-align: center;
      font-size: 12px;
      color: #888888;
      border-top: 1px solid #eaeaea;
    }

    .footer a {
      color: #718096;
      text-decoration: none;
      margin: 0 5px;
    }

    /* Mobile Responsive Overrides */
    @media only screen and (max-width: 600px) {
      .content { padding: 25px 20px; }
      .header { padding: 25px 15px; }
      .button { display: block; width: 100%; box-sizing: border-box; }
      
      /* On very small screens, let table cells stack if content is long, 
         but usually maintaining the table structure is cleaner for alignment. 
         We reduce font size slightly instead. */
      .info-label { font-size: 11px; width: 40%; }
      .info-value { font-size: 13px; }
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
<html lang="en">
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
  
  <div class="wrapper">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center">
          <div class="main-container">
            
            <div class="header">
              <img src="${logoUrl}" alt="Sabaq Logo" class="logo">
              <div class="ilm-quote">${ilmQuote}</div>
              <div class="quote-translation">${quoteTranslation}</div>
            </div>

            <div class="content">
              ${content}
            </div>

            <div class="footer">
              <p style="margin: 0 0 10px 0;">&copy; ${new Date().getFullYear()} Sabaq Management System. All rights reserved.</p>
              <div>
                <a href="#">Privacy Policy</a> • <a href="#">Terms</a> • <a href="#">Support</a>
              </div>
            </div>

          </div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

// Helper for Key-Value Rows
const createRow = (label: string, value: string | number) => `
  <tr class="info-row">
    <td class="info-label">${label}</td>
    <td class="info-value">${value}</td>
  </tr>
`;

// 1. Enrollment Approved
export const enrollmentApprovedTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  approvedAt: string;
  whatsappGroupLink?: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Mubarak! We are pleased to inform you that your enrollment request has been approved. You are now officially a member of the class.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq Name", data.sabaqName)}
      ${createRow(
        "Status",
        `<span class="badge badge-success">Approved</span>`
      )}
      ${createRow("Date", data.approvedAt)}
    </table>

    ${
      data.whatsappGroupLink
        ? `
      <div class="success-box">
        <strong>Next Step:</strong> Join the WhatsApp group to stay connected with your fellow students and receive updates.
      </div>
    `
        : ""
    }

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">Access Dashboard</a>
    </div>

    ${
      data.whatsappGroupLink
        ? `
      <div style="text-align: center; margin-top: 15px;">
        <a href="${data.whatsappGroupLink}" style="color: #25D366; text-decoration: none; font-size: 14px; font-weight: 600;">
          Join WhatsApp Group &rarr;
        </a>
      </div>
    `
        : ""
    }
  `;
  return baseEmailTemplate({
    title: "Enrollment Approved",
    previewText: `Congratulations! Your enrollment in ${data.sabaqName} has been approved.`,
    content,
  });
};

// 2. Enrollment Rejected
export const enrollmentRejectedTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  reason?: string;
  rejectedAt: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Thank you for your interest in <strong>${
        data.sabaqName
      }</strong>. After careful consideration, we regret to inform you that we are unable to approve your enrollment request at this time.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq Name", data.sabaqName)}
      ${createRow(
        "Status",
        `<span class="badge badge-error">Not Approved</span>`
      )}
      ${createRow("Date", data.rejectedAt)}
      ${data.reason ? createRow("Reason", data.reason) : ""}
    </table>

    <div class="message" style="font-size: 13px; color: #718096;">
      If you have questions regarding this decision, please contact the administration.
    </div>
  `;
  return baseEmailTemplate({
    title: "Application Status Update",
    previewText: `Update regarding your enrollment application for ${data.sabaqName}.`,
    content,
  });
};

// 3. Session Reminder
export const sessionReminderTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  scheduledAt: string;
  location?: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      This is a friendly reminder about your upcoming session.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Time", data.scheduledAt)}
      ${data.location ? createRow("Location", data.location) : ""}
    </table>

    <div class="highlight-box">
      Please arrive 5 minutes early. Punctuality demonstrates respect for knowledge.
    </div>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">View Details</a>
    </div>
  `;
  return baseEmailTemplate({
    title: "Session Reminder",
    previewText: `Reminder: Your ${data.sabaqName} session is scheduled for ${data.scheduledAt}.`,
    content,
  });
};

// 4. Attendance Marked (with Sabaq Performance)
export const attendanceMarkedTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  status: string;
  markedAt: string;
  sessionDate: string;
  attendedCount?: number;
  totalSessions?: number;
  attendancePercent?: number;
}) => {
  const isLate = data.status.toLowerCase() === "late";
  const badgeClass = isLate ? "badge-warning" : "badge-success";
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";

  // Performance color based on percentage
  const getPerformanceColor = (percent: number) => {
    if (percent >= 80)
      return {
        bg: "#ecfdf5",
        border: "#a7f3d0",
        color: "#047857",
        label: "Excellent",
      };
    if (percent >= 60)
      return {
        bg: "#fffbeb",
        border: "#fcd34d",
        color: "#b45309",
        label: "Good",
      };
    return {
      bg: "#fef2f2",
      border: "#fca5a5",
      color: "#b91c1c",
      label: "Needs Improvement",
    };
  };

  const hasStats =
    data.attendedCount !== undefined &&
    data.totalSessions !== undefined &&
    data.totalSessions > 0;
  const percent = data.attendancePercent || 0;
  const perfStyle = hasStats ? getPerformanceColor(percent) : null;

  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Your attendance has been recorded for the session on <strong>${
        data.sessionDate
      }</strong>.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow(
        "Status",
        `<span class="badge ${badgeClass}">${data.status}</span>`
      )}
      ${createRow("Recorded At", data.markedAt)}
    </table>

    ${
      hasStats && perfStyle
        ? `
      <div style="margin-top: 20px; padding: 15px; background-color: ${perfStyle.bg}; border: 1px solid ${perfStyle.border}; border-radius: 8px;">
        <div style="font-size: 12px; font-weight: 600; color: ${perfStyle.color}; text-transform: uppercase; margin-bottom: 10px;">
          Your Sabaq Performance
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="color: #4a5568; font-size: 14px;">Sessions Attended</span>
          <span style="font-weight: 700; color: ${perfStyle.color}; font-size: 16px;">${data.attendedCount} / ${data.totalSessions}</span>
        </div>
        <div style="background-color: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
          <div style="background-color: ${perfStyle.color}; height: 100%; width: ${percent}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <span style="font-size: 12px; color: #718096;">${perfStyle.label}</span>
          <span style="font-weight: 600; color: ${perfStyle.color};">${percent}%</span>
        </div>
      </div>
    `
        : ""
    }

    ${
      isLate
        ? `
      <div class="alert-box" style="background-color: #fffaf0; border-color: #d69e2e; color: #744210; margin-top: 15px;">
        <strong>Note:</strong> Please try to arrive on time for future sessions to ensure you don't miss important lessons.
      </div>
    `
        : ""
    }
  `;
  return baseEmailTemplate({
    title: "Attendance Update",
    previewText: `Attendance marked as ${data.status} for ${data.sabaqName}. ${
      hasStats ? `Your attendance: ${percent}%` : ""
    }`,
    content,
  });
};

// 5. Login Alert
export const loginAlertTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  time: string;
  ip?: string;
  device?: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      We detected a new login to your account.
    </div>
    
    <table class="info-table">
      ${createRow("Time", data.time)}
      ${data.device ? createRow("Device", data.device) : ""}
      ${data.ip ? createRow("IP Address", data.ip) : ""}
    </table>

    <div class="highlight-box">
      If this was you, no action is needed. If you did not authorize this, please change your password immediately.
    </div>
  `;
  return baseEmailTemplate({
    title: "Security Alert",
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
    <div class="greeting">Identity Verification</div>
    <div class="message">
      Please use the code below to complete your verification. This code is valid for ${data.expiryMinutes} minutes.
    </div>
    
    <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e0; border-radius: 8px; padding: 25px; text-align: center; margin: 30px 0;">
      <span style="font-family: monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a202c;">${data.otp}</span>
    </div>

    <div class="alert-box">
      <strong>Security Notice:</strong> Never share this code with anyone.
    </div>
  `;
  return baseEmailTemplate({
    title: "Verification Code",
    previewText: `Your verification code is ${data.otp}.`,
    content,
  });
};

// 7. Session Summary
export const sessionSummaryTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  scheduledAt: string;
  status: string;
  minutesLate?: number;
  attendedCount?: number;
  totalSessions?: number;
  attendancePercent?: number;
  reportErrorLink?: string;
}) => {
  const isLate = data.status.toLowerCase() === "late";
  const badgeClass = isLate ? "badge-warning" : "badge-success";
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";

  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Thank you for your participation. Here is your session summary.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Date", data.scheduledAt)}
      ${createRow(
        "Attendance",
        `<span class="badge ${badgeClass}">${data.status}</span>`
      )}
      ${
        isLate && data.minutesLate
          ? createRow("Delay", `${data.minutesLate} mins`)
          : ""
      }
    </table>

    ${
      !isLate
        ? `
      <div class="success-box">
        Excellent! Your punctuality is appreciated.
      </div>
    `
        : ""
    }

    ${
      data.attendedCount !== undefined && data.totalSessions !== undefined
        ? `
      <div class="highlight-box">
        <strong>Your Attendance Record:</strong><br/>
        You have attended <strong>${
          data.attendedCount
        }</strong> out of <strong>${data.totalSessions}</strong> sessions (${
            data.attendancePercent || 0
          }%)
      </div>
    `
        : ""
    }

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">View Dashboard</a>
    </div>

    ${
      data.reportErrorLink
        ? `
      <div class="message" style="margin-top: 20px; font-size: 12px; color: #718096;">
        Notice something wrong? <a href="${data.reportErrorLink}" style="color: #3182ce;">Report an error</a>
      </div>
    `
        : ""
    }
  `;
  return baseEmailTemplate({
    title: `Session Summary: ${data.sabaqName}`,
    previewText: `Session summary for ${data.sabaqName} - Status: ${data.status}`,
    content,
  });
};

// 8. Session Absent
export const sessionAbsentTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  scheduledAt: string;
  attendedCount?: number;
  totalSessions?: number;
  attendancePercent?: number;
  reportErrorLink?: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";

  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      You were marked absent for the recent session. Regular attendance is essential for your learning progress.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Date", data.scheduledAt)}
      ${createRow("Status", `<span class="badge badge-error">Absent</span>`)}
    </table>

    ${
      data.attendedCount !== undefined && data.totalSessions !== undefined
        ? `
      <div class="alert-box">
        <strong>Your Attendance Record:</strong><br/>
        You have attended <strong>${
          data.attendedCount
        }</strong> out of <strong>${data.totalSessions}</strong> sessions (${
            data.attendancePercent || 0
          }%)
      </div>
    `
        : ""
    }

    <div class="message" style="margin-top: 20px;">
      If you missed this session due to an unavoidable reason, please inform your instructor.
    </div>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">View Dashboard</a>
    </div>

    ${
      data.reportErrorLink
        ? `
      <div class="message" style="margin-top: 20px; font-size: 12px; color: #718096;">
        This is incorrect? <a href="${data.reportErrorLink}" style="color: #3182ce;">Report an error</a>
      </div>
    `
        : ""
    }
  `;
  return baseEmailTemplate({
    title: `Absence Notice: ${data.sabaqName}`,
    previewText: `Absence recorded for ${data.sabaqName} session.`,
    content,
  });
};

// 9. Question Answered
export const questionAnsweredTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  questionText: string;
  answerText: string;
  answeredAt: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Your question in <strong>${data.sabaqName}</strong> has been answered.
    </div>
    
    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 600; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Your Question</div>
      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; font-style: italic; color: #4a5568;">
        "${data.questionText}"
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 600; color: #047857; text-transform: uppercase; margin-bottom: 5px;">Instructor's Answer</div>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 6px; color: #064e3b; font-weight: 500;">
        ${data.answerText}
      </div>
    </div>

    <div class="button-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/questions" class="button">View Discussion</a>
    </div>
  `;
  return baseEmailTemplate({
    title: "Question Answered",
    previewText: `Your question in ${data.sabaqName} has received an answer.`,
    content,
  });
};

// 10. Security Flagged (User)
export const securityFlaggedUserTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  action: string;
  time: string;
  ip?: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting" style="color: #c53030;">Salaams, ${
      data.userName
    }${itsDisplay}</div>
    <div class="message">
      We have detected unauthorized activity associated with your account. This incident has been reported.
    </div>
    
    <table class="info-table" style="border-color: #fed7d7;">
      ${createRow("Action", data.action)}
      ${createRow("Time", data.time)}
      ${data.ip ? createRow("IP", data.ip) : ""}
    </table>

    <div class="alert-box">
      If you believe this is a mistake, please contact the administrator immediately.
    </div>
  `;
  return baseEmailTemplate({
    title: "Security Alert: Account Flagged",
    previewText: `Security alert regarding ${data.action}.`,
    content,
  });
};

// 11. Security Flagged (Admin)
export const securityFlaggedAdminTemplate = (data: {
  userName: string;
  userEmail: string;
  userId: string;
  action: string;
  resource: string;
  details?: any;
  time: string;
  ip?: string;
  userAgent?: string;
}) => {
  const content = `
    <div class="greeting" style="color: #c53030;">Security Incident</div>
    <div class="message">
      An unauthorized access attempt has been detected.
    </div>
    
    <table class="info-table" style="border-left: 4px solid #c53030;">
      ${createRow(
        "User",
        `${data.userName} <br><span style="font-weight:400; font-size:12px; color:#718096">${data.userEmail}</span>`
      )}
      ${createRow("Action", data.action)}
      ${createRow("Resource", data.resource)}
      ${data.details?.url ? createRow("Target URL", data.details.url) : ""}
      ${
        data.details?.referrer
          ? createRow("Referrer", data.details.referrer)
          : ""
      }
      ${
        data.details?.action
          ? createRow("Attempted Action", data.details.action)
          : ""
      }
      ${createRow("Time", data.time)}
      ${data.ip ? createRow("IP", data.ip) : ""}
    </table>

    <div class="button-container">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/users/${
    data.userId
  }" class="button" style="background-color: #2d3748;">View User Profile</a>
    </div>
  `;
  return baseEmailTemplate({
    title: `Security Alert: ${data.userName}`,
    previewText: `Unauthorized access attempt detected by ${data.userName}.`,
    content,
  });
};

// 12. Profile Updated
export const profileUpdatedTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  updatedFields: string[];
  time: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Your profile details have been successfully updated.
    </div>
    
    <table class="info-table">
      ${createRow("Updated Fields", data.updatedFields.join(", "))}
      ${createRow("Time", data.time)}
    </table>

    <div class="highlight-box">
      If you did not make these changes, please contact support immediately.
    </div>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard/profile" class="button">View Profile</a>
    </div>
  `;
  return baseEmailTemplate({
    title: "Profile Updated",
    previewText: `Your profile has been updated successfully.`,
    content,
  });
};

// 13. Role Promoted
export const rolePromotedTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  newRole: string;
  features: string[];
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Mubarak! You have been promoted to <strong>${data.newRole}</strong>.
    </div>
    
    <div class="highlight-box" style="background-color: #ebf8ff; border-color: #4299e1; color: #2c5282;">
      <strong>New Capabilities:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        ${data.features.map((f) => `<li>${f}</li>`).join("")}
      </ul>
    </div>

    <div class="alert-box">
      <strong>STRICT SECURITY NOTICE:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Your account activity is strictly monitored. Every click and action is logged.</li>
        <li>Any malpractice or unauthorized action will result in immediate suspension and flagging.</li>
        <li><strong>NEVER</strong> share your credentials with anyone. You are responsible for all actions taken under your account.</li>
      </ul>
    </div>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">Access Dashboard</a>
    </div>
  `;
  return baseEmailTemplate({
    title: "Role Promotion Notification",
    previewText: `You have been promoted to ${data.newRole}.`,
    content,
  });
};

// 14. Role Demoted
export const roleDemotedTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  newRole: string;
  lostAccess: string[];
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Your role has been updated to <strong>${data.newRole}</strong>.
    </div>
    
    <div class="highlight-box" style="background-color: #fff5f5; border-color: #fc8181; color: #c53030;">
      <strong>Access Revoked:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        ${data.lostAccess.map((f) => `<li>${f}</li>`).join("")}
      </ul>
    </div>

    <div class="alert-box">
      <strong>SECURITY REMINDER:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Your account activity continues to be monitored.</li>
        <li>Do not attempt to access unauthorized resources.</li>
        <li>Keep your credentials secure.</li>
      </ul>
    </div>
  `;
  return baseEmailTemplate({
    title: "Role Update Notification",
    previewText: `Your role has been updated to ${data.newRole}.`,
    content,
  });
};

// 15. Admin Assigned
export const adminAssignedTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  role: string;
  assignedBy: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";
  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      You have been assigned as <strong>${data.role}</strong> for <strong>${
    data.sabaqName
  }</strong>.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Role", data.role)}
      ${createRow("Assigned By", data.assignedBy)}
    </table>

    <div class="highlight-box">
      Please log in to the dashboard to view your new responsibilities.
    </div>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">Access Dashboard</a>
    </div>
  `;
  return baseEmailTemplate({
    title: `New Assignment: ${data.sabaqName}`,
    previewText: `You have been assigned as ${data.role} for ${data.sabaqName}.`,
    content,
  });
};

// 16. Sync Success
export const syncSuccessTemplate = (data: {
  syncedCount: number;
  duration: string;
  time: string;
}) => {
  const content = `
    <div class="greeting">System Sync Successful</div>
    <div class="message">
      The automated system synchronization has completed successfully.
    </div>
    
    <table class="info-table">
      ${createRow("Status", `<span class="badge badge-success">Success</span>`)}
      ${createRow("Records Synced", data.syncedCount)}
      ${createRow("Duration", data.duration)}
      ${createRow("Time", data.time)}
    </table>
  `;
  return baseEmailTemplate({
    title: "System Sync: Success",
    previewText: `System sync completed successfully. ${data.syncedCount} records synced.`,
    content,
  });
};

// 17. Sync Failed
export const syncFailedTemplate = (data: { error: string; time: string }) => {
  const content = `
    <div class="greeting" style="color: #c53030;">System Sync Failed</div>
    <div class="message">
      The automated system synchronization encountered an error.
    </div>
    
    <table class="info-table" style="border-left: 4px solid #c53030;">
      ${createRow("Status", `<span class="badge badge-error">Failed</span>`)}
      ${createRow("Time", data.time)}
    </table>

    <div class="alert-box">
      <strong>Error Details:</strong><br>
      ${data.error}
    </div>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard/settings" class="button">Check System Health</a>
    </div>
  `;
  return baseEmailTemplate({
    title: "System Sync: Failed",
    previewText: `System sync failed. Error: ${data.error}`,
    content,
  });
};

// 18. Sabaq Role Assigned (Generic)
export const sabaqRoleAssignedTemplate = (data: {
  userName: string;
  sabaqName: string;
  role: string; // Admin, Manager, Attendance Incharge
  assignedBy: string;
}) => {
  return adminAssignedTemplate(data);
};

// 19. Session Report (Comprehensive)
export const sessionReportTemplate = (data: {
  sabaqName: string;
  sessionDate: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: string;
  topStudents: string[]; // List of names
  lowAttendanceStudents: string[]; // List of names
  noShowStudents?: string[]; // List of names who never attended any session
  noShowCount?: number;
}) => {
  const content = `
    <div class="greeting">Session Report</div>
    <div class="message">
      Here is the comprehensive report for the session conducted on <strong>${
        data.sessionDate
      }</strong> for <strong>${data.sabaqName}</strong>.
    </div>
    
    <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
      <div style="text-align: center; flex: 1; min-width: 70px; background: #f0fdf4; padding: 10px; border-radius: 6px; border: 1px solid #bbf7d0;">
        <div style="font-size: 24px; font-weight: 700; color: #166534;">${
          data.presentCount
        }</div>
        <div style="font-size: 11px; text-transform: uppercase; color: #166534;">Present</div>
      </div>
      <div style="text-align: center; flex: 1; min-width: 70px; background: #fff1f2; padding: 10px; border-radius: 6px; border: 1px solid #fecdd3;">
        <div style="font-size: 24px; font-weight: 700; color: #9f1239;">${
          data.absentCount
        }</div>
        <div style="font-size: 11px; text-transform: uppercase; color: #9f1239;">Absent</div>
      </div>
      <div style="text-align: center; flex: 1; min-width: 70px; background: #fffbeb; padding: 10px; border-radius: 6px; border: 1px solid #fde68a;">
        <div style="font-size: 24px; font-weight: 700; color: #92400e;">${
          data.lateCount
        }</div>
        <div style="font-size: 11px; text-transform: uppercase; color: #92400e;">Late</div>
      </div>
      ${
        data.noShowCount !== undefined
          ? `
      <div style="text-align: center; flex: 1; min-width: 70px; background: #fef3c7; padding: 10px; border-radius: 6px; border: 1px solid #fcd34d;">
        <div style="font-size: 24px; font-weight: 700; color: #b45309;">${data.noShowCount}</div>
        <div style="font-size: 11px; text-transform: uppercase; color: #b45309;">No-Show</div>
      </div>
      `
          : ""
      }
    </div>

    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Date", data.sessionDate)}
      ${createRow("Total Students", data.totalStudents)}
      ${createRow("Attendance Rate", data.attendanceRate)}
    </table>

    ${
      data.topStudents.length > 0
        ? `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 600; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Top Attendees (Present)</div>
        <ul style="background-color: #f9fafb; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 10px 10px 30px; margin: 0; font-size: 13px; color: #4a5568;">
          ${data.topStudents.map((name) => `<li>${name}</li>`).join("")}
        </ul>
      </div>
    `
        : ""
    }

    ${
      data.lowAttendanceStudents.length > 0
        ? `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 600; color: #c53030; text-transform: uppercase; margin-bottom: 5px;">Absentees (Action Required)</div>
        <ul style="background-color: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 10px 10px 10px 30px; margin: 0; font-size: 13px; color: #c53030;">
          ${data.lowAttendanceStudents
            .map((name) => `<li>${name}</li>`)
            .join("")}
        </ul>
      </div>
    `
        : ""
    }

    ${
      data.noShowStudents && data.noShowStudents.length > 0
        ? `
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 600; color: #b45309; text-transform: uppercase; margin-bottom: 5px;">No-Shows (Never Attended Any Session)</div>
        <ul style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 10px 10px 10px 30px; margin: 0; font-size: 13px; color: #b45309;">
          ${data.noShowStudents.map((name) => `<li>${name}</li>`).join("")}
        </ul>
      </div>
    `
        : ""
    }

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard/reports" class="button">View Full Analytics</a>
    </div>
  `;
  return baseEmailTemplate({
    title: `Session Report: ${data.sabaqName}`,
    previewText: `Attendance Report for ${data.sabaqName} on ${data.sessionDate}. Rate: ${data.attendanceRate}`,
    content,
  });
};

// 20. Feedback Response
export const feedbackResponseTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  originalFeedback: string;
  adminResponse: string;
  respondedBy: string;
  respondedAt: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";

  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      Your feedback for <strong>${
        data.sabaqName
      }</strong> has received a response.
    </div>
    
    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 600; color: #718096; text-transform: uppercase; margin-bottom: 5px;">Your Feedback</div>
      <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; font-style: italic; color: #4a5568;">
        "${data.originalFeedback}"
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; font-weight: 600; color: #047857; text-transform: uppercase; margin-bottom: 5px;">Response from ${
        data.respondedBy
      }</div>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 15px; border-radius: 6px; color: #064e3b; font-weight: 500;">
        ${data.adminResponse}
      </div>
    </div>

    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Responded At", data.respondedAt)}
    </table>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">View Dashboard</a>
    </div>
  `;
  return baseEmailTemplate({
    title: "Feedback Response Received",
    previewText: `Your feedback for ${data.sabaqName} has been addressed.`,
    content,
  });
};

// 21. Password Reset
export const passwordResetTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  resetLink: string;
  expiryMinutes: number;
  requestedAt: string;
  ip?: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";

  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      We received a request to reset your password. Click the button below to create a new password.
    </div>
    
    <div class="button-container">
      <a href="${data.resetLink}" class="button">Reset Password</a>
    </div>

    <table class="info-table">
      ${createRow("Requested At", data.requestedAt)}
      ${createRow("Expires In", `${data.expiryMinutes} minutes`)}
      ${data.ip ? createRow("IP Address", data.ip) : ""}
    </table>

    <div class="alert-box">
      <strong>Security Notice:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>This link will expire in ${data.expiryMinutes} minutes.</li>
        <li>If you did not request this reset, please ignore this email.</li>
        <li>Never share your password or this link with anyone.</li>
      </ul>
    </div>

    <div class="message" style="margin-top: 20px; font-size: 12px; color: #718096;">
      Can't click the button? Copy and paste this link into your browser:<br/>
      <span style="word-break: break-all; color: #3182ce;">${
        data.resetLink
      }</span>
    </div>
  `;
  return baseEmailTemplate({
    title: "Password Reset Request",
    previewText: `Reset your password. This link expires in ${data.expiryMinutes} minutes.`,
    content,
  });
};

// 22. Session Cancelled
export const sessionCancelledTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  originalDate: string;
  reason?: string;
  cancelledBy: string;
  rescheduledTo?: string;
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";

  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      We regret to inform you that the scheduled session for <strong>${
        data.sabaqName
      }</strong> has been cancelled.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Original Date", data.originalDate)}
      ${createRow("Status", `<span class="badge badge-error">Cancelled</span>`)}
      ${createRow("Cancelled By", data.cancelledBy)}
      ${data.reason ? createRow("Reason", data.reason) : ""}
    </table>

    ${
      data.rescheduledTo
        ? `
      <div class="success-box">
        <strong>Rescheduled:</strong> The session has been rescheduled to <strong>${data.rescheduledTo}</strong>. Please mark your calendar.
      </div>
    `
        : `
      <div class="highlight-box">
        We apologize for any inconvenience. Please check the dashboard for updates on the next session.
      </div>
    `
    }

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">View Dashboard</a>
    </div>
  `;
  return baseEmailTemplate({
    title: `Session Cancelled: ${data.sabaqName}`,
    previewText: `The session for ${data.sabaqName} on ${data.originalDate} has been cancelled.`,
    content,
  });
};

// 23. Enrollment Request (for Admins)
export const enrollmentRequestTemplate = (data: {
  adminName: string;
  adminItsNumber?: string;
  studentName: string;
  studentItsNumber: string;
  studentEmail: string;
  sabaqName: string;
  requestedAt: string;
  pendingCount: number;
}) => {
  const itsDisplay = data.adminItsNumber ? ` (${data.adminItsNumber})` : "";

  const content = `
    <div class="greeting">Salaams, ${data.adminName}${itsDisplay}</div>
    <div class="message">
      A new enrollment request has been submitted for <strong>${
        data.sabaqName
      }</strong> and requires your review.
    </div>
    
    <table class="info-table">
      ${createRow("Student Name", data.studentName)}
      ${createRow("ITS Number", data.studentItsNumber)}
      ${createRow("Email", data.studentEmail)}
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Requested At", data.requestedAt)}
    </table>

    <div class="highlight-box">
      <strong>Pending Requests:</strong> There are currently <strong>${
        data.pendingCount
      }</strong> pending enrollment request(s) for this sabaq.
    </div>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard/sabaqs" class="button">Review Enrollments</a>
    </div>
  `;
  return baseEmailTemplate({
    title: `New Enrollment Request: ${data.sabaqName}`,
    previewText: `${data.studentName} has requested enrollment in ${data.sabaqName}.`,
    content,
  });
};

// 24. Low Attendance Warning
export const lowAttendanceWarningTemplate = (data: {
  userName: string;
  userItsNumber?: string;
  sabaqName: string;
  attendedCount: number;
  totalSessions: number;
  attendancePercent: number;
  missedStreak?: number;
  warningLevel: "MILD" | "MODERATE" | "SEVERE";
}) => {
  const itsDisplay = data.userItsNumber ? ` (${data.userItsNumber})` : "";

  const warningStyles = {
    MILD: {
      color: "#b45309",
      bg: "#fffbeb",
      border: "#fcd34d",
      title: "Attendance Reminder",
      message:
        "Your attendance has dipped slightly. Regular attendance is key to your learning progress.",
    },
    MODERATE: {
      color: "#c2410c",
      bg: "#fff7ed",
      border: "#fb923c",
      title: "Attendance Warning",
      message:
        "Your attendance is below expectations. Please prioritize attending upcoming sessions.",
    },
    SEVERE: {
      color: "#b91c1c",
      bg: "#fef2f2",
      border: "#fca5a5",
      title: "Urgent: Low Attendance Alert",
      message:
        "Your attendance has dropped significantly. Continued absence may affect your enrollment status.",
    },
  };

  const style = warningStyles[data.warningLevel];

  const content = `
    <div class="greeting">Salaams, ${data.userName}${itsDisplay}</div>
    <div class="message">
      ${style.message}
    </div>
    
    <div style="background-color: ${style.bg}; border: 1px solid ${
    style.border
  }; border-left: 4px solid ${
    style.color
  }; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
      <strong style="color: ${style.color};">Your Attendance Status</strong>
      <div style="margin-top: 10px; color: ${style.color};">
        You have attended <strong>${
          data.attendedCount
        }</strong> out of <strong>${
    data.totalSessions
  }</strong> sessions (<strong>${data.attendancePercent}%</strong>)
      </div>
      ${
        data.missedStreak && data.missedStreak > 1
          ? `<div style="margin-top: 5px; color: ${style.color};">Consecutive sessions missed: <strong>${data.missedStreak}</strong></div>`
          : ""
      }
    </div>

    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow(
        "Sessions Attended",
        `${data.attendedCount} / ${data.totalSessions}`
      )}
      ${createRow("Attendance Rate", `${data.attendancePercent}%`)}
      ${createRow(
        "Status",
        `<span class="badge ${
          data.warningLevel === "SEVERE"
            ? "badge-error"
            : data.warningLevel === "MODERATE"
            ? "badge-warning"
            : "badge-info"
        }">${style.title}</span>`
      )}
    </table>

    <div class="highlight-box">
      <strong>Tips to Improve:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Set reminders for upcoming sessions</li>
        <li>Inform your instructor if you have unavoidable conflicts</li>
        <li>Regular attendance helps you stay connected with your learning journey</li>
      </ul>
    </div>

    <div class="button-container">
      <a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/dashboard" class="button">View My Attendance</a>
    </div>

    <div class="message" style="margin-top: 20px; font-size: 12px; color: #718096;">
      If you believe this is an error or have legitimate reasons for absence, please contact your sabaq administrator.
    </div>
  `;
  return baseEmailTemplate({
    title: `${style.title}: ${data.sabaqName}`,
    previewText: `Your attendance for ${data.sabaqName} is at ${data.attendancePercent}%. Action required.`,
    content,
  });
};
