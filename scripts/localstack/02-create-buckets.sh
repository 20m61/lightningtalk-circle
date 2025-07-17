#!/bin/bash
# LocalStack initialization script - Create S3 buckets
# This script runs automatically when LocalStack starts

echo "Creating S3 buckets in LocalStack..."

# Create main storage bucket
awslocal s3 mb s3://lightningtalk-local --region ap-northeast-1 || true

# Create uploads bucket
awslocal s3 mb s3://lightningtalk-uploads --region ap-northeast-1 || true

# Create backups bucket
awslocal s3 mb s3://lightningtalk-backups --region ap-northeast-1 || true

# Create AI images bucket
awslocal s3 mb s3://lightningtalk-ai-images --region ap-northeast-1 || true

# Set bucket policies for public access (uploads bucket)
awslocal s3api put-bucket-policy \
    --bucket lightningtalk-uploads \
    --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::lightningtalk-uploads/*"
            }
        ]
    }' || true

# Enable CORS for uploads bucket
awslocal s3api put-bucket-cors \
    --bucket lightningtalk-uploads \
    --cors-configuration '{
        "CORSRules": [
            {
                "AllowedHeaders": ["*"],
                "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
                "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
                "ExposeHeaders": ["ETag"],
                "MaxAgeSeconds": 3000
            }
        ]
    }' || true

echo "S3 buckets created successfully!"

# List all buckets
echo "Available buckets:"
awslocal s3 ls