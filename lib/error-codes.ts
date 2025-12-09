export const ERROR_CODES = {
  // Generic
  UNAUTHORIZED: {
    code: "AUTH_001",
    message: "You must be logged in to perform this action.",
  },
  FORBIDDEN: {
    code: "AUTH_002",
    message: "You do not have permission to access this resource.",
  },

  // Users
  USERS_CREATE: {
    code: "PERM_USERS_001",
    message: "You are not authorized to create new users.",
  },
  USERS_READ: {
    code: "PERM_USERS_002",
    message: "You do not have permission to view user profiles.",
  },
  USERS_UPDATE: {
    code: "PERM_USERS_003",
    message: "You are not authorized to update user details.",
  },
  USERS_DELETE: {
    code: "PERM_USERS_004",
    message: "You are not authorized to delete users.",
  },
  USERS_MANAGE_ROLES: {
    code: "PERM_USERS_005",
    message: "You do not have permission to manage user roles.",
  },
  USERS_PROMOTE: {
    code: "PERM_USERS_006",
    message: "You are not authorized to promote users.",
  },
  USERS_DEMOTE: {
    code: "PERM_USERS_007",
    message: "You are not authorized to demote users.",
  },

  // Locations
  LOCATIONS_CREATE: {
    code: "PERM_LOC_001",
    message: "You are not authorized to create locations.",
  },
  LOCATIONS_READ: {
    code: "PERM_LOC_002",
    message: "You do not have permission to view locations.",
  },
  LOCATIONS_UPDATE: {
    code: "PERM_LOC_003",
    message: "You are not authorized to update locations.",
  },
  LOCATIONS_DELETE: {
    code: "PERM_LOC_004",
    message: "You are not authorized to delete locations.",
  },

  // Sabaqs
  SABAQS_CREATE: {
    code: "PERM_SABAQ_001",
    message: "You are not authorized to create sabaqs.",
  },
  SABAQS_READ: {
    code: "PERM_SABAQ_002",
    message: "You do not have permission to view sabaqs.",
  },
  SABAQS_UPDATE: {
    code: "PERM_SABAQ_003",
    message: "You are not authorized to update sabaq details.",
  },
  SABAQS_DELETE: {
    code: "PERM_SABAQ_004",
    message: "You are not authorized to delete sabaqs.",
  },
  SABAQS_ASSIGN_ADMIN: {
    code: "PERM_SABAQ_005",
    message: "You are not authorized to assign admins to sabaqs.",
  },
  SABAQS_ACCESS_DENIED: {
    code: "PERM_SABAQ_006",
    message: "You do not have permission to access this specific Sabaq.",
  },

  // Sessions
  SESSIONS_CREATE: {
    code: "PERM_SESS_001",
    message: "You are not authorized to create sessions.",
  },
  SESSIONS_READ: {
    code: "PERM_SESS_002",
    message: "You do not have permission to view sessions.",
  },
  SESSIONS_UPDATE: {
    code: "PERM_SESS_003",
    message: "You are not authorized to update sessions.",
  },
  SESSIONS_DELETE: {
    code: "PERM_SESS_004",
    message: "You are not authorized to delete sessions.",
  },
  SESSIONS_START: {
    code: "PERM_SESS_005",
    message: "You are not authorized to start sessions.",
  },
  SESSIONS_END: {
    code: "PERM_SESS_006",
    message: "You are not authorized to end sessions.",
  },

  // Attendance
  ATTENDANCE_CREATE: {
    code: "PERM_ATT_001",
    message: "You are not authorized to create attendance records.",
  },
  ATTENDANCE_READ: {
    code: "PERM_ATT_002",
    message: "You do not have permission to view attendance.",
  },
  ATTENDANCE_UPDATE: {
    code: "PERM_ATT_003",
    message: "You are not authorized to update attendance records.",
  },
  ATTENDANCE_DELETE: {
    code: "PERM_ATT_004",
    message: "You are not authorized to delete attendance records.",
  },
  ATTENDANCE_VERIFY: {
    code: "PERM_ATT_005",
    message: "You are not authorized to verify attendance.",
  },
  ATTENDANCE_READ_SELF: {
    code: "PERM_ATT_006",
    message: "You do not have permission to view your own attendance.",
  },
  ATTENDANCE_MARK_SELF: {
    code: "PERM_ATT_007",
    message: "You are not authorized to mark your own attendance.",
  },

  // Enrollments
  ENROLLMENTS_READ: {
    code: "PERM_ENR_001",
    message: "You do not have permission to view enrollments.",
  },
  ENROLLMENTS_APPROVE: {
    code: "PERM_ENR_002",
    message: "You are not authorized to approve enrollments.",
  },
  ENROLLMENTS_REJECT: {
    code: "PERM_ENR_003",
    message: "You are not authorized to reject enrollments.",
  },
  ENROLLMENTS_BULK_ENROLL: {
    code: "PERM_ENR_004",
    message: "You are not authorized to perform bulk enrollments.",
  },
  ENROLLMENTS_CREATE: {
    code: "PERM_ENR_005",
    message: "You are not authorized to create enrollment requests.",
  },
  ENROLLMENTS_READ_SELF: {
    code: "PERM_ENR_006",
    message: "You do not have permission to view your own enrollments.",
  },

  // Questions
  QUESTIONS_READ: {
    code: "PERM_QUES_001",
    message: "You do not have permission to view questions.",
  },
  QUESTIONS_DELETE: {
    code: "PERM_QUES_002",
    message: "You are not authorized to delete questions.",
  },
  QUESTIONS_ANSWER: {
    code: "PERM_QUES_003",
    message: "You are not authorized to answer questions.",
  },
  QUESTIONS_CREATE: {
    code: "PERM_QUES_004",
    message: "You are not authorized to ask questions.",
  },
  QUESTIONS_UPVOTE: {
    code: "PERM_QUES_005",
    message: "You are not authorized to upvote questions.",
  },
  QUESTIONS_READ_SELF: {
    code: "PERM_QUES_006",
    message: "You do not have permission to view your own questions.",
  },

  // Analytics
  ANALYTICS_READ: {
    code: "PERM_ANL_001",
    message: "You do not have permission to view analytics.",
  },
  ANALYTICS_EXPORT: {
    code: "PERM_ANL_002",
    message: "You are not authorized to export analytics data.",
  },

  // Emails
  EMAILS_READ: {
    code: "PERM_MAIL_001",
    message: "You do not have permission to view email logs.",
  },
  EMAILS_SEND: {
    code: "PERM_MAIL_002",
    message: "You are not authorized to send emails.",
  },

  // Scan
  SCAN_READ: {
    code: "PERM_SCAN_001",
    message: "You do not have permission to access the scanner.",
  },

  // Logs
  LOGS_READ: {
    code: "PERM_LOGS_001",
    message: "You do not have permission to view system logs.",
  },
  LOGS_DELETE: {
    code: "PERM_LOGS_002",
    message: "You are not authorized to delete system logs.",
  },

  // Settings
  SETTINGS_MANAGE: {
    code: "PERM_SET_001",
    message: "You are not authorized to manage system settings.",
  },
};

export const getErrorCode = (resource: string, action: string) => {
  const key = `${resource.toUpperCase()}_${action.toUpperCase()}`;
  return ERROR_CODES[key as keyof typeof ERROR_CODES] || ERROR_CODES.FORBIDDEN;
};

export const getErrorByCode = (code: string) => {
  return (
    Object.values(ERROR_CODES).find((e) => e.code === code) ||
    ERROR_CODES.FORBIDDEN
  );
};
