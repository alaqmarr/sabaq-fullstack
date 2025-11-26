-- Performance Optimization Indexes
-- Add indexes for frequently queried columns

-- Session indexes
CREATE INDEX IF NOT EXISTS "Session_sabaqId_isActive_idx" ON "Session"("sabaqId", "isActive");
CREATE INDEX IF NOT EXISTS "Session_scheduledAt_idx" ON "Session"("scheduledAt");
CREATE INDEX IF NOT EXISTS "Session_isActive_startedAt_idx" ON "Session"("isActive", "startedAt");

-- Attendance indexes  
CREATE INDEX IF NOT EXISTS "Attendance_sessionId_markedAt_idx" ON "Attendance"("sessionId", "markedAt");
CREATE INDEX IF NOT EXISTS "Attendance_userId_idx" ON "Attendance"("userId");

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS "Enrollment_userId_status_idx" ON "Enrollment"("userId", "status");
CREATE INDEX IF NOT EXISTS "Enrollment_sabaqId_status_idx" ON "Enrollment"("sabaqId", "status");

-- Sabaq indexes
CREATE INDEX IF NOT EXISTS "Sabaq_isActive_enrollmentEndsAt_idx" ON "Sabaq"("isActive", "enrollmentEndsAt");
CREATE INDEX IF NOT EXISTS "Sabaq_janabId_idx" ON "Sabaq"("janabId");

-- User indexes
CREATE INDEX IF NOT EXISTS "User_role_isActive_idx" ON "User"("role", "isActive");

-- Question indexes
CREATE INDEX IF NOT EXISTS "Question_sessionId_createdAt_idx" ON "Question"("sessionId", "createdAt");
CREATE INDEX IF NOT EXISTS "Question_userId_idx" ON "Question"("userId");
