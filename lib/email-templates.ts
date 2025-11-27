/**
 * Professional Email Templates for Asbaaq Management System
 *
 * These templates follow email best practices:
 * - Responsive design (works on all devices)
 * - Professional styling with brand colors
 * - Clear call-to-action buttons
 * - Proper spacing and typography
 */

const emailStyles = `
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; color: #1a1a1a; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .header { background-color: #ffffff; padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid #f1f5f9; }
    .logo { width: 80px; height: auto; margin-bottom: 20px; border-radius: 12px; }
    .content { padding: 40px; }
    .frosted-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 24px 0; }
    .button { display: inline-block; padding: 14px 32px; background-color: #000000; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; text-transform: lowercase; letter-spacing: 0.5px; margin: 20px 0; }
    .button-whatsapp { background-color: #25D366; color: #ffffff !important; }
    .footer { background-color: #f8fafc; padding: 30px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
    h1 { font-size: 24px; font-weight: 700; margin: 0; color: #0f172a; letter-spacing: -0.5px; text-transform: lowercase; }
    h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; color: #334155; }
    p { line-height: 1.6; margin: 0 0 16px; color: #475569; }
    .label { font-size: 11px; text-transform: lowercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600; margin-bottom: 4px; display: block; }
    .value { font-size: 16px; font-weight: 500; color: #0f172a; margin-bottom: 16px; display: block; }
    .divider { height: 1px; background-color: #e2e8f0; margin: 30px 0; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: lowercase; letter-spacing: 0.5px; }
    .badge-success { background-color: #dcfce7; color: #166534; }
    .badge-warning { background-color: #fef9c3; color: #854d0e; }
    .badge-danger { background-color: #fee2e2; color: #991b1b; }
    .badge-info { background-color: #e0f2fe; color: #0369a1; }
  </style>
`;

// Helper to get logo URL - assuming it's hosted at the app's base URL
// In production, this should be an absolute URL to a CDN or public asset
const logoUrl = "https://sabaq-app.vercel.app/logo.jpg"; // Placeholder, user should update base URL

const footerContent = `
    <div class="footer">
      <p><strong>Umoor Taalimiyah Secunderabad</strong></p>
      <p>Asbaaq Management System</p>
    </div>
`;

export const enrollmentApprovedTemplate = (data: {
  userName: string;
  sabaqName: string;
  kitaab?: string;
  nisaab?: string;
  janabName?: string;
  dashboardUrl: string;
  whatsappGroupLink?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Approved</title>
  ${emailStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Logo" class="logo">
      <h1>enrollment approved</h1>
    </div>
    
    <div class="content">
      <h2>Salaam ${data.userName},</h2>
      
      <p>Your enrollment request has been approved. You are now officially enrolled in the following sabaq:</p>
      
      <div class="frosted-card">
        <span class="label">sabaq</span>
        <span class="value">${data.sabaqName}</span>
        
        ${
          data.kitaab
            ? `
          <span class="label">kitaab</span>
          <span class="value">${data.kitaab}</span>
        `
            : ""
        }
        
        ${
          data.janabName
            ? `
          <span class="label">conducted by</span>
          <span class="value">${data.janabName}</span>
        `
            : ""
        }
      </div>
      
      <p>You can now access session information, mark attendance, and view your progress.</p>
      
      <div style="text-align: center;">
        <a href="${data.dashboardUrl}" class="button">view dashboard</a>
        ${
          data.whatsappGroupLink
            ? `
          <br>
          <a href="${data.whatsappGroupLink}" class="button button-whatsapp">join whatsapp group</a>
        `
            : ""
        }
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; text-align: center; color: #94a3b8;">
        May Allah grant you barakah in your studies.
      </p>
    </div>
    
    ${footerContent}
  </div>
</body>
</html>
`;

export const enrollmentRejectedTemplate = (data: {
  userName: string;
  sabaqName: string;
  reason?: string;
  contactEmail: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enrollment Update</title>
  ${emailStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Logo" class="logo">
      <h1>enrollment update</h1>
    </div>
    
    <div class="content">
      <h2>Salaam ${data.userName},</h2>
      
      <p>Thank you for your interest in <strong>${data.sabaqName}</strong>.</p>
      
      <p>Unfortunately, we are unable to approve your enrollment request at this time.</p>
      
      ${
        data.reason
          ? `
        <div class="frosted-card">
          <span class="label">reason</span>
          <span class="value" style="margin-bottom: 0;">${data.reason}</span>
        </div>
      `
          : ""
      }
      
      <p>If you have any questions, please contact us at <a href="mailto:${
        data.contactEmail
      }" style="color: #0f172a; font-weight: 600;">${data.contactEmail}</a>.</p>
    </div>
    
    ${footerContent}
  </div>
</body>
</html>
`;

export const sessionReminderTemplate = (data: {
  userName: string;
  sabaqName: string;
  sessionDate: string;
  sessionTime: string;
  location?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Reminder</title>
  ${emailStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Logo" class="logo">
      <h1>session reminder</h1>
    </div>
    
    <div class="content">
      <h2>Salaam ${data.userName},</h2>
      
      <p>This is a reminder for your upcoming sabaq session:</p>
      
      <div class="frosted-card">
        <span class="label">sabaq</span>
        <span class="value">${data.sabaqName}</span>
        
        <div style="display: flex; gap: 20px;">
          <div>
            <span class="label">date</span>
            <span class="value">${data.sessionDate}</span>
          </div>
          <div>
            <span class="label">time</span>
            <span class="value">${data.sessionTime}</span>
          </div>
        </div>
        
        ${
          data.location
            ? `
          <span class="label">location</span>
          <span class="value" style="margin-bottom: 0;">${data.location}</span>
        `
            : ""
        }
      </div>
      
      <p>Please arrive on time and bring any required materials.</p>
    </div>
    
    ${footerContent}
  </div>
</body>
</html>
`;

export const attendanceMarkedTemplate = (data: {
  userName: string;
  sabaqName: string;
  sessionDate: string;
  status: "ON_TIME" | "LATE";
  markedAt: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Confirmed</title>
  ${emailStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Logo" class="logo">
      <h1>attendance confirmed</h1>
    </div>
    
    <div class="content">
      <h2>Salaam ${data.userName},</h2>
      
      <p>Your attendance has been successfully recorded.</p>
      
      <div class="frosted-card">
        <span class="label">session</span>
        <span class="value">${data.sabaqName}</span>
        
        <span class="label">date</span>
        <span class="value">${data.sessionDate}</span>
        
        <span class="label">status</span>
        <div style="margin-top: 4px;">
          <span class="badge ${
            data.status === "ON_TIME" ? "badge-success" : "badge-warning"
          }">
            ${data.status === "ON_TIME" ? "on time" : "late"}
          </span>
        </div>
      </div>
      
      <p>Keep up the good work!</p>
    </div>
    
    ${footerContent}
  </div>
</body>
</html>
`;

export const loginAlertTemplate = (data: {
  userName: string;
  time: string;
  device: string;
  location?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Login Alert</title>
  ${emailStyles}
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Logo" class="logo">
      <h1>new login alert</h1>
    </div>
    
    <div class="content">
      <h2>Salaam ${data.userName},</h2>
      
      <p>We detected a new login to your Asbaaq account.</p>
      
      <div class="frosted-card">
        <span class="label">time</span>
        <span class="value">${data.time}</span>
        
        <span class="label">device</span>
        <span class="value">${data.device}</span>
        
        ${
          data.location
            ? `
          <span class="label">location</span>
          <span class="value" style="margin-bottom: 0;">${data.location}</span>
        `
            : ""
        }
      </div>
      
      <p>If this was you, you can ignore this email. If you don't recognize this activity, please contact your administrator immediately.</p>
    </div>
    
    ${footerContent}
  </div>
</body>
</html>
`;
