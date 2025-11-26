/**
 * Centralized cache configuration for the application
 * TTL values in seconds
 */
export const CACHE_TTL = {
  // User data - moderate frequency updates
  users: 300, // 5 minutes
  userProfile: 180, // 3 minutes
  
  // Session data - frequent updates during active sessions
  sessions: 60, // 1 minute
  activeSessions: 30, // 30 seconds
  sessionDetails: 45, // 45 seconds
  
  // Attendance - real-time during sessions
  attendance: 30, // 30 seconds
  attendanceStats: 60, // 1 minute
  
  // Sabaqs - infrequent updates
  sabaqs: 300, // 5 minutes
  sabaqDetails: 180, // 3 minutes
  
  // Locations - rarely change
  locations: 600, // 10 minutes
  
  // Enrollments - moderate frequency
  enrollments: 120, // 2 minutes
  
  // Questions - moderate frequency during sessions
  questions: 60, // 1 minute
  
  // Analytics - expensive queries, cache longer
  analytics: 600, // 10 minutes
  dashboardStats: 300, // 5 minutes
} as const;

/**
 * Cache tags for invalidation
 */
export const CACHE_TAGS = {
  users: ['users'],
  sessions: ['sessions'],
  attendance: ['attendance'],
  sabaqs: ['sabaqs'],
  locations: ['locations'],
  enrollments: ['enrollments'],
  questions: ['questions'],
  analytics: ['analytics'],
} as const;

/**
 * Cache key generators for consistency
 */
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  users: () => 'users:all',
  usersByRole: (role: string) => `users:role:${role}`,
  
  session: (id: string) => `session:${id}`,
  sessions: () => 'sessions:all',
  activeSessions: () => 'sessions:active',
  sessionsBySabaq: (sabaqId: string) => `sessions:sabaq:${sabaqId}`,
  
  attendance: (sessionId: string) => `attendance:session:${sessionId}`,
  attendanceStats: (sessionId: string) => `attendance:stats:${sessionId}`,
  userAttendance: (userId: string) => `attendance:user:${userId}`,
  
  sabaq: (id: string) => `sabaq:${id}`,
  sabaqs: () => 'sabaqs:all',
  
  location: (id: string) => `location:${id}`,
  locations: () => 'locations:all',
  
  enrollment: (sabaqId: string) => `enrollment:sabaq:${sabaqId}`,
  userEnrollments: (userId: string) => `enrollment:user:${userId}`,
  
  questions: (sessionId: string) => `questions:session:${sessionId}`,
  userQuestions: (userId: string) => `questions:user:${userId}`,
  
  dashboardStats: () => 'analytics:dashboard',
  attendanceTrends: () => 'analytics:attendance-trends',
} as const;
