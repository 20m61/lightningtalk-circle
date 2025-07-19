#!/usr/bin/env python3

import json
import subprocess
import sys

# CloudFront Distribution ID
DISTRIBUTION_ID = "E3FRLQVZ0MDE64"

# 現在の設定を読み込む
with open('cloudfront-current-config.json', 'r') as f:
    config_data = json.load(f)

etag = config_data['ETag']
config = config_data['DistributionConfig']

# API Gatewayオリジンを追加
api_origin = {
    "Id": "API-Gateway",
    "DomainName": "ass56wcvr1.execute-api.ap-northeast-1.amazonaws.com",
    "OriginPath": "/prod",
    "CustomHeaders": {
        "Quantity": 0
    },
    "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only",
        "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
        },
        "OriginReadTimeout": 30,
        "OriginKeepaliveTimeout": 5
    },
    "ConnectionAttempts": 3,
    "ConnectionTimeout": 10,
    "OriginShield": {
        "Enabled": False
    },
    "OriginAccessControlId": ""
}

# オリジンに追加
config['Origins']['Quantity'] = 2
config['Origins']['Items'].append(api_origin)

# Cache Behaviorsにapi/*を追加
api_behavior = {
    "PathPattern": "/api/*",
    "TargetOriginId": "API-Gateway",
    "TrustedSigners": {
        "Enabled": False,
        "Quantity": 0
    },
    "TrustedKeyGroups": {
        "Enabled": False,
        "Quantity": 0
    },
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
        "Quantity": 7,
        "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
        "CachedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"]
        }
    },
    "SmoothStreaming": False,
    "Compress": True,
    "LambdaFunctionAssociations": {
        "Quantity": 0
    },
    "FunctionAssociations": {
        "Quantity": 0
    },
    "FieldLevelEncryptionId": "",
    "ForwardedValues": {
        "QueryString": True,
        "Cookies": {
            "Forward": "all"
        },
        "Headers": {
            "Quantity": 4,
            "Items": ["Authorization", "Content-Type", "Accept", "Origin"]
        },
        "QueryStringCacheKeys": {
            "Quantity": 0
        }
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 0
}

# Cache Behaviorsセクションを追加または更新
if 'CacheBehaviors' not in config or config['CacheBehaviors']['Quantity'] == 0:
    config['CacheBehaviors'] = {
        "Quantity": 1,
        "Items": [api_behavior]
    }
else:
    config['CacheBehaviors']['Quantity'] += 1
    config['CacheBehaviors']['Items'].append(api_behavior)

# 更新された設定を保存
with open('cloudfront-updated-config.json', 'w') as f:
    json.dump(config, f, indent=2)

print(f"CloudFront設定を更新中...")
print(f"Distribution ID: {DISTRIBUTION_ID}")
print(f"ETag: {etag}")

# CloudFrontディストリビューションを更新
try:
    result = subprocess.run([
        'aws', 'cloudfront', 'update-distribution',
        '--id', DISTRIBUTION_ID,
        '--distribution-config', 'file://cloudfront-updated-config.json',
        '--if-match', etag
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ CloudFront設定が正常に更新されました")
        print("ディストリビューションのデプロイが完了するまで15-20分かかります")
    else:
        print("❌ エラーが発生しました:")
        print(result.stderr)
        sys.exit(1)
        
except Exception as e:
    print(f"❌ 予期しないエラー: {e}")
    sys.exit(1)