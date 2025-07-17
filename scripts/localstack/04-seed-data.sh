#!/bin/bash
# LocalStack initialization script - Seed sample data
# This script runs automatically when LocalStack starts

echo "Seeding sample data to LocalStack..."

# Sample event data
awslocal dynamodb put-item \
    --table-name lightningtalk-local-events \
    --item '{
        "id": {"S": "event-2024-01-local"},
        "title": {"S": "ローカル開発テストイベント"},
        "date": {"S": "2024-01-20"},
        "time": {"S": "13:00-17:00"},
        "venue": {"S": "オンライン"},
        "capacity": {"N": "100"},
        "description": {"S": "LocalStack環境でのテストイベント"},
        "status": {"S": "upcoming"},
        "createdAt": {"S": "2024-01-01T00:00:00Z"},
        "tags": {"L": [
            {"S": "テスト"},
            {"S": "ローカル開発"}
        ]}
    }' \
    --region ap-northeast-1 || true

# Sample participant
awslocal dynamodb put-item \
    --table-name lightningtalk-local-participants \
    --item '{
        "id": {"S": "participant-001"},
        "eventId": {"S": "event-2024-01-local"},
        "name": {"S": "テスト参加者"},
        "email": {"S": "test@localhost"},
        "participationType": {"S": "online"},
        "registeredAt": {"S": "2024-01-01T10:00:00Z"}
    }' \
    --region ap-northeast-1 || true

# Sample talk
awslocal dynamodb put-item \
    --table-name lightningtalk-local-talks \
    --item '{
        "id": {"S": "talk-001"},
        "eventId": {"S": "event-2024-01-local"},
        "speakerId": {"S": "participant-001"},
        "title": {"S": "LocalStackでのAWS開発"},
        "description": {"S": "ローカル環境でAWSサービスをシミュレートする方法"},
        "duration": {"N": "5"},
        "order": {"N": "1"},
        "status": {"S": "confirmed"}
    }' \
    --region ap-northeast-1 || true

# Upload sample file to S3
echo "Sample presentation file" > /tmp/sample-presentation.txt
awslocal s3 cp /tmp/sample-presentation.txt s3://lightningtalk-uploads/presentations/sample-presentation.txt || true

echo "Sample data seeded successfully!"

# Verify data
echo "Verifying seeded data..."
echo "Events:"
awslocal dynamodb scan --table-name lightningtalk-local-events --region ap-northeast-1 --query 'Items[*].title.S' || true

echo "S3 files:"
awslocal s3 ls s3://lightningtalk-uploads/ --recursive || true