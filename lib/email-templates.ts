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
  sabaqName: string;
  approvedAt: string;
  whatsappGroupLink?: string;
}) => {
  const content = `
    <div class="greeting">Mubarak, ${data.userName}!</div>
    <div class="message">
      We are pleased to inform you that your enrollment request has been approved. You are now officially a member of the class.
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
  sabaqName: string;
  reason?: string;
  rejectedAt: string;
}) => {
  const content = `
    <div class="greeting">Dear ${data.userName},</div>
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
  sabaqName: string;
  scheduledAt: string;
  location?: string;
}) => {
  const content = `
    <div class="greeting">Upcoming Session Reminder</div>
    <div class="message">
      Assalamu Alaikum ${
        data.userName
      }, this is a friendly reminder about your upcoming session.
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

// 4. Attendance Marked
export const attendanceMarkedTemplate = (data: {
  userName: string;
  sabaqName: string;
  status: string;
  markedAt: string;
  sessionDate: string;
}) => {
  const isLate = data.status.toLowerCase() === "late";
  const badgeClass = isLate ? "badge-warning" : "badge-success";

  const content = `
    <div class="greeting">Attendance Recorded</div>
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
      isLate
        ? `
      <div class="alert-box" style="background-color: #fffaf0; border-color: #d69e2e; color: #744210;">
        <strong>Note:</strong> Please try to arrive on time for future sessions to ensure you don't miss important lessons.
      </div>
    `
        : ""
    }
  `;
  return baseEmailTemplate({
    title: "Attendance Update",
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
    <div class="greeting">New Login Detected</div>
    <div class="message">
      We detected a new login to your account <strong>${data.userName}</strong>.
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
  sabaqName: string;
  scheduledAt: string;
  status: string;
  minutesLate?: number;
}) => {
  const isLate = data.status.toLowerCase() === "late";
  const badgeClass = isLate ? "badge-warning" : "badge-success";

  const content = `
    <div class="greeting">Session Summary</div>
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
  sabaqName: string;
  scheduledAt: string;
}) => {
  const content = `
    <div class="greeting">Absence Notification</div>
    <div class="message">
      You were marked absent for the recent session. Regular attendance is essential for your learning progress.
    </div>
    
    <table class="info-table">
      ${createRow("Sabaq", data.sabaqName)}
      ${createRow("Date", data.scheduledAt)}
      ${createRow("Status", `<span class="badge badge-error">Absent</span>`)}
    </table>

    <div class="message" style="margin-top: 20px;">
      If you missed this session due to an unavoidable reason, please inform your instructor.
    </div>
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
  sabaqName: string;
  questionText: string;
  answerText: string;
  answeredAt: string;
}) => {
  const content = `
    <div class="greeting">New Answer Received</div>
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
  action: string;
  time: string;
  ip?: string;
}) => {
  const content = `
    <div class="greeting" style="color: #c53030;">Action Flagged</div>
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
  updatedFields: string[];
  time: string;
}) => {
  const content = `
    <div class="greeting">Profile Updated</div>
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
  newRole: string;
  features: string[];
}) => {
  const content = `
    <div class="greeting">Role Promotion</div>
    <div class="message">
      Congratulations! You have been promoted to <strong>${
        data.newRole
      }</strong>.
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
  newRole: string;
  lostAccess: string[];
}) => {
  const content = `
    <div class="greeting">Role Update</div>
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
