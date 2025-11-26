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
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 30px; }
    .badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 10px 0; }
    .badge-success { background-color: #d4edda; color: #155724; }
    .badge-warning { background-color: #fff3cd; color: #856404; }
    .badge-danger { background-color: #f8d7da; color: #721c24; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; color: #6c757d; font-size: 14px; }
    .divider { height: 1px; background-color: #e9ecef; margin: 30px 0; }
    h2 { color: #2d3748; font-size: 24px; margin-bottom: 16px; }
    p { color: #4a5568; line-height: 1.6; margin: 12px 0; }
    .highlight { color: #667eea; font-weight: 600; }
  </style>
`;

export const enrollmentApprovedTemplate = (data: {
  userName: string;
  sabaqName: string;
  kitaab: string;
  nisaab: string;
  janabName?: string;
  dashboardUrl: string;
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
      <h1>🎉 Enrollment Approved!</h1>
    </div>
    
    <div class="content">
      <h2>Assalamu Alaikum ${data.userName},</h2>
      
      <p>Mubarak! Your enrollment request has been <strong>approved</strong>.</p>
      
      <div class="info-box">
        <p style="margin: 0; font-size: 16px;"><strong>Sabaq Details:</strong></p>
        <p style="margin: 8px 0 0 0;"><span class="highlight">📚 ${data.sabaqName}</span></p>
        <p style="margin: 4px 0;">Kitaab: ${data.kitaab}</p>
        <p style="margin: 4px 0;">Nisaab: ${data.nisaab}</p>
        ${data.janabName ? `<p style="margin: 4px 0;">Conducted by: <strong>${data.janabName}</strong></p>` : ''}
      </div>
      
      <p>You can now:</p>
      <ul style="color: #4a5568; line-height: 1.8;">
        <li>Access session information</li>
        <li>Mark attendance when sessions are active</li>
        <li>Ask questions during sessions</li>
        <li>View your progress and analytics</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${data.dashboardUrl}" class="button">View Dashboard</a>
      </div>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6c757d;">
        May Allah grant you barakah in your studies.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Asbaaq Management System</strong></p>
      <p>Comprehensive sabaq session management with real-time tracking</p>
    </div>
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
      <h1>Enrollment Update</h1>
    </div>
    
    <div class="content">
      <h2>Assalamu Alaikum ${data.userName},</h2>
      
      <p>Thank you for your interest in <strong>${data.sabaqName}</strong>.</p>
      
      <p>Unfortunately, we are unable to approve your enrollment request at this time.</p>
      
      ${data.reason ? `
        <div class="info-box">
          <p style="margin: 0;"><strong>Reason:</strong></p>
          <p style="margin: 8px 0 0 0;">${data.reason}</p>
        </div>
      ` : ''}
      
      <p>If you have any questions or would like to discuss this further, please contact us at <a href="mailto:${data.contactEmail}" style="color: #667eea;">${data.contactEmail}</a>.</p>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6c757d;">
        We appreciate your understanding and encourage you to explore other available sabaqs.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Asbaaq Management System</strong></p>
      <p>Comprehensive sabaq session management with real-time tracking</p>
    </div>
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
      <h1>⏰ Session Reminder</h1>
    </div>
    
    <div class="content">
      <h2>Assalamu Alaikum ${data.userName},</h2>
      
      <p>This is a reminder for your upcoming sabaq session:</p>
      
      <div class="info-box">
        <p style="margin: 0; font-size: 18px;"><strong>${data.sabaqName}</strong></p>
        <p style="margin: 12px 0 4px 0;">📅 <strong>${data.sessionDate}</strong></p>
        <p style="margin: 4px 0;">🕒 <strong>${data.sessionTime}</strong></p>
        ${data.location ? `<p style="margin: 4px 0;">📍 ${data.location}</p>` : ''}
      </div>
      
      <p><strong>Important:</strong></p>
      <ul style="color: #4a5568; line-height: 1.8;">
        <li>Please arrive on time to mark your attendance</li>
        <li>Bring any required materials</li>
        <li>Be prepared to participate actively</li>
      </ul>
      
      <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
        May Allah accept your efforts in seeking knowledge.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Asbaaq Management System</strong></p>
      <p>Comprehensive sabaq session management with real-time tracking</p>
    </div>
  </div>
</body>
</html>
`;

export const attendanceMarkedTemplate = (data: {
  userName: string;
  sabaqName: string;
  sessionDate: string;
  status: 'ON_TIME' | 'LATE';
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
      <h1>✅ Attendance Confirmed</h1>
    </div>
    
    <div class="content">
      <h2>Assalamu Alaikum ${data.userName},</h2>
      
      <p>Your attendance has been successfully recorded.</p>
      
      <div class="info-box">
        <p style="margin: 0;"><strong>Session:</strong> ${data.sabaqName}</p>
        <p style="margin: 8px 0 4px 0;">Date: ${data.sessionDate}</p>
        <p style="margin: 4px 0;">Marked at: ${data.markedAt}</p>
        <p style="margin: 12px 0 0 0;">
          <span class="badge ${data.status === 'ON_TIME' ? 'badge-success' : 'badge-warning'}">
            ${data.status === 'ON_TIME' ? '✓ On Time' : '⏰ Late'}
          </span>
        </p>
      </div>
      
      <p>Keep up the good work and maintain consistent attendance!</p>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6c757d;">
        May Allah grant you barakah in your learning journey.
      </p>
    </div>
    
    <div class="footer">
      <p><strong>Asbaaq Management System</strong></p>
      <p>Comprehensive sabaq session management with real-time tracking</p>
    </div>
  </div>
</body>
</html>
`;
