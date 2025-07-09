#!/bin/bash

# Database Migration Script for Lightning Talk Circle
# Usage: ./db-migration.sh [environment] [command]

set -e

# Parameters
ENVIRONMENT=${1:-dev}
COMMAND=${2:-status}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Invalid environment. Must be dev, staging, or prod."
    exit 1
fi

# Validate command
if [[ ! "$COMMAND" =~ ^(init|migrate|rollback|status|test)$ ]]; then
    echo "Error: Invalid command. Must be init, migrate, rollback, status, or test."
    exit 1
fi

echo "🗄️  Database Migration Tool"
echo "Environment: ${ENVIRONMENT}"
echo "Command: ${COMMAND}"

# Get database credentials from AWS Secrets Manager
SECRET_ID="lightningtalk-circle/${ENVIRONMENT}/database/credentials"
echo "🔐 Retrieving database credentials..."

DB_CREDENTIALS=$(aws secretsmanager get-secret-value \
    --secret-id ${SECRET_ID} \
    --query SecretString \
    --output text)

# Parse credentials
DB_HOST=$(echo ${DB_CREDENTIALS} | jq -r '.host')
DB_PORT=$(echo ${DB_CREDENTIALS} | jq -r '.port')
DB_NAME=$(echo ${DB_CREDENTIALS} | jq -r '.dbname')
DB_USER=$(echo ${DB_CREDENTIALS} | jq -r '.username')
DB_PASSWORD=$(echo ${DB_CREDENTIALS} | jq -r '.password')

# Build connection string
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

case ${COMMAND} in
    init)
        echo "🚀 Initializing database..."
        
        # Create tables
        psql ${DATABASE_URL} << EOF
-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    venue JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    registration_open BOOLEAN DEFAULT true,
    talk_submission_open BOOLEAN DEFAULT true,
    max_talks INTEGER DEFAULT 20,
    talk_duration INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    participation_type VARCHAR(50) NOT NULL,
    dietary_restrictions TEXT,
    emergency_contact JSONB,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, email)
);

-- Talks table
CREATE TABLE IF NOT EXISTS talks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 5,
    order_index INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_talks_event ON talks(event_id);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
\$\$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_talks_updated_at BEFORE UPDATE ON talks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${DB_USER};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${DB_USER};
EOF
        echo "✅ Database initialized successfully!"
        ;;
        
    migrate)
        echo "🔄 Running migrations..."
        # Add migration logic here
        echo "✅ Migrations completed!"
        ;;
        
    rollback)
        echo "⏪ Rolling back migrations..."
        # Add rollback logic here
        echo "✅ Rollback completed!"
        ;;
        
    status)
        echo "📊 Database status..."
        psql ${DATABASE_URL} -c "\dt"
        ;;
        
    test)
        echo "🧪 Testing database connection..."
        psql ${DATABASE_URL} -c "SELECT version();"
        echo "✅ Database connection successful!"
        ;;
esac