-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- News requests table
CREATE TABLE IF NOT EXISTS news_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_url BOOLEAN NOT NULL,  -- TRUE if URL, FALSE if manual text
    analysis_result TEXT NOT NULL,  -- 'reliable'/'unreliable'
    confidence_score FLOAT NOT NULL,  -- percentage of confidence (0-100)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    news_request_id INTEGER NOT NULL,
    agrees_with_analysis BOOLEAN NOT NULL,  -- TRUE if user agrees with the analysis
    comment TEXT,  -- Optional comment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (news_request_id) REFERENCES news_requests(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_news_requests_user_id ON news_requests(user_id);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_news_request_id ON feedback(news_request_id);

-- Triggers to update the updated_at timestamp
CREATE TRIGGER update_users_timestamp 
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_news_requests_timestamp
AFTER UPDATE ON news_requests
BEGIN
    UPDATE news_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END; 

CREATE TABLE IF NOT EXISTS failed_logins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    attempted_username TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS blocked_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    reason TEXT,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO blocked_users (user_id, reason)
VALUES (3, '5 consecutive failed login attempts');
