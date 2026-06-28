CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teacher_sessions (
  token TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_sessions_expires
ON teacher_sessions(expires_at);

CREATE TABLE IF NOT EXISTS student_sessions (
  token TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_sessions_student
ON student_sessions(student_id, expires_at);
