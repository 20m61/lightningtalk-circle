#!/bin/bash
# LocalStack initialization script - Create DynamoDB tables
# This script runs automatically when LocalStack starts

echo "Creating DynamoDB tables in LocalStack..."

# Wait for LocalStack to be ready
sleep 5

# Create Events table
awslocal dynamodb create-table \
    --table-name lightningtalk-local-events \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=date,AttributeType=S \
        AttributeName=status,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=date-index,Keys=["{AttributeName=date,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}" \
        IndexName=status-index,Keys=["{AttributeName=status,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ap-northeast-1 || true

# Create Participants table
awslocal dynamodb create-table \
    --table-name lightningtalk-local-participants \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=eventId,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=eventId-index,Keys=["{AttributeName=eventId,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}" \
        IndexName=email-index,Keys=["{AttributeName=email,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ap-northeast-1 || true

# Create Users table
awslocal dynamodb create-table \
    --table-name lightningtalk-local-users \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=email,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=email-index,Keys=["{AttributeName=email,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ap-northeast-1 || true

# Create Talks table
awslocal dynamodb create-table \
    --table-name lightningtalk-local-talks \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=eventId,AttributeType=S \
        AttributeName=speakerId,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=eventId-index,Keys=["{AttributeName=eventId,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}" \
        IndexName=speakerId-index,Keys=["{AttributeName=speakerId,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ap-northeast-1 || true

# Create Sessions table
awslocal dynamodb create-table \
    --table-name lightningtalk-local-sessions \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
        AttributeName=userId,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=userId-index,Keys=["{AttributeName=userId,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=5,WriteCapacityUnits=5}" \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ap-northeast-1 || true

echo "DynamoDB tables created successfully!"

# List all tables
echo "Available tables:"
awslocal dynamodb list-tables --region ap-northeast-1