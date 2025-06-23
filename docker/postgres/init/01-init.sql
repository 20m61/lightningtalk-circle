-- Lightning Talk Circle Database Initialization
-- PostgreSQL setup script for development environment

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create application database (if not exists from env)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lightningtalk') THEN
        CREATE DATABASE lightningtalk;
    END IF;
END
$$;

-- Switch to lightningtalk database
\c lightningtalk;

-- Create application schema
CREATE SCHEMA IF NOT EXISTS lightning_talk;

-- Set default search path
ALTER DATABASE lightningtalk SET search_path TO lightning_talk, public;

-- Create roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'lt_app') THEN
        CREATE ROLE lt_app LOGIN PASSWORD 'lt_secure_pass';
    END IF;
END
$$;

-- Grant permissions
GRANT CONNECT ON DATABASE lightningtalk TO lt_app;
GRANT USAGE ON SCHEMA lightning_talk TO lt_app;
GRANT CREATE ON SCHEMA lightning_talk TO lt_app;

-- Sample development data will be inserted by application migration
INSERT INTO lightning_talk.settings (key, value, description) VALUES 
    ('app_name', '"Lightning Talk Circle"', 'Application name'),
    ('max_participants_per_event', '50', 'Maximum participants per event'),
    ('default_talk_duration', '5', 'Default talk duration in minutes'),
    ('email_notifications_enabled', 'true', 'Enable email notifications'),
    ('registration_open', 'true', 'Allow new registrations')
ON CONFLICT (key) DO NOTHING;

-- Create sample event for development
INSERT INTO lightning_talk.events (
    title, 
    description, 
    date, 
    end_date,
    venue_name,
    venue_address,
    capacity,
    online,
    online_url,
    status,
    registration_open,
    talk_submission_open,
    max_talks,
    talk_duration
) VALUES (
    '第1回 なんでもライトニングトーク',
    '5分間で世界を変える！あなたの「なんでも」を聞かせて！技術、趣味、学び、体験談、何でも大歓迎です。',
    '2025-06-25 19:00:00+09',
    '2025-06-25 22:00:00+09',
    '新宿某所',
    '詳細は6月20日に確定予定',
    50,
    true,
    'https://meet.google.com/ycp-sdec-xsr',
    'upcoming',
    true,
    true,
    20,
    5
) ON CONFLICT DO NOTHING;

-- Vacuum and analyze for better performance
VACUUM ANALYZE;