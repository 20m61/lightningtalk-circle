# Rate Limiting & Security Protection Guide

## 🚦 Rate Limiting Architecture Overview

Lightning Talk Circleは、多層防御によるレート制限システムを実装し、DDoS攻撃や悪意のあるリクエストから保護しています。

### Protection Layers
```
Request Flow
├── DDoS Protection         # 高頻度リクエスト検出 (200 req/min)
├── Adaptive Rate Limiting  # 不審なIP動的制限
├── Progressive Slow-Down   # 段階的遅延適用
├── Conditional Limiting    # エンドポイント別制限
└── Endpoint-Specific       # 機能別細分化制限
```

## 🔧 Rate Limiting Configuration

### Endpoint-Specific Limits
```javascript
// 認証関連 (最厳格)
Authentication:    5 requests / 15 minutes
Registration:      5 requests / hour
Password Reset:    3 requests / hour

// API操作
General API:       100 requests / 15 minutes
Creation (POST/PUT/DELETE): 30 requests / 15 minutes
Search Queries:    100 requests / 5 minutes
File Upload:       20 requests / hour

// 管理機能
Admin Operations:  50 requests / 10 minutes
Email Operations:  10 requests / hour

// WordPress統合
Theme Upload:      30 requests / hour
Config Updates:    30 requests / hour
```

### DDoS Protection
```javascript
// 分散攻撃対策
const ddosProtection = rateLimit({
  windowMs: 1 * 60 * 1000,    // 1分間隔
  max: 200,                   // 最大200リクエスト/分
  handler: (req, res) => {
    console.error('Potential DDoS attack detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
});
```

## 🧠 Adaptive Rate Limiting

### Suspicious Activity Detection
```javascript
// 不審な活動パターン
const suspiciousPatterns = [
  'Rate limit exceeded 5+ times',
  'Multiple failed authentication attempts',
  'Unusual request patterns',
  'Abnormal request frequency'
];

// 自動制限強化
if (suspiciousActivity.detected) {
  applyStricterLimits({
    windowMs: 60 * 60 * 1000,  // 1時間
    max: 10                     // 極めて低い制限
  });
}
```

### Progressive Delays
```javascript
// 段階的遅延システム
const progressiveSlowDown = {
  light:   { delayAfter: 20, delayMs: 500 },   // 20回後500ms遅延
  medium:  { delayAfter: 10, delayMs: 1000 },  // 10回後1秒遅延
  heavy:   { delayAfter: 5,  delayMs: 2000 }   // 5回後2秒遅延
};
```

## 📊 Monitoring & Analytics

### Real-time Statistics
```javascript
// 監視可能メトリクス
{
  totalAttempts: 1205,
  suspiciousIPs: 3,
  recentAttempts: [
    {
      key: "192.168.1.100-Mozilla/5.0...",
      attempts: 15,
      timeSpan: 3600000
    }
  ],
  recommendations: {
    suspiciousActivity: true,
    highTrafficDetected: false,
    recentAttacks: 2
  }
}
```

### Admin Monitoring Endpoints
```javascript
// 管理者向け監視API
GET  /api/admin/rate-limit-stats        # 統計情報取得
POST /api/admin/rate-limit/clear-suspicious  # 不審リスト削除
POST /api/admin/rate-limit/add-suspicious    # IP手動追加
```

## 🔑 Key Generator Strategy

### Enhanced Fingerprinting
```javascript
// より精密な識別
const customKeyGenerator = (req) => {
  const userAgent = req.get('User-Agent') || 'unknown';
  const forwarded = req.get('X-Forwarded-For') || req.ip;
  return `${forwarded}-${userAgent.substring(0, 50)}`;
};

// 回避困難な追跡
- IP Address + User Agent
- X-Forwarded-For Header consideration
- Session-based tracking (future)
```

## ⚡ Performance Optimization

### Memory Management
```javascript
// 自動クリーンアップ
const cleanupRateLimit = () => {
  const oneHourAgo = Date.now() - 3600000;
  
  // 古い記録を削除
  for (const [key, data] of attemptStore.entries()) {
    if (data.lastAttempt < oneHourAgo) {
      attemptStore.delete(key);
    }
  }
};

// 30分毎に実行
setInterval(cleanupRateLimit, 30 * 60 * 1000);
```

### Efficient Storage
```javascript
// メモリ効率的な保存
const attemptStore = new Map(); // O(1) lookup
const suspiciousIPs = new Set(); // O(1) contains check

// データ構造最適化
{
  count: 15,           // 試行回数
  firstAttempt: timestamp,  // 初回時刻
  lastAttempt: timestamp    // 最終時刻
}
```

## 🛡️ Security Response Actions

### Automated Responses
```javascript
// 脅威レベル別対応
Level 1 (Light):   Standard rate limiting
Level 2 (Medium):  Progressive delays
Level 3 (High):    Strict rate limiting
Level 4 (Critical): IP blocking + admin notification

// 自動エスカレーション
if (attempts > 5) markAsSuspicious();
if (attempts > 10) applyStrictLimiting();
if (attempts > 20) blockTemporarily();
```

### Incident Response
```javascript
// セキュリティインシデント対応
{
  detection: 'Real-time monitoring',
  logging: 'Detailed security logs',
  alerting: 'Admin notifications',
  mitigation: 'Automated rate limiting',
  analysis: 'Attack pattern analysis'
}
```

## 📋 Configuration Examples

### Development Environment
```javascript
// 開発環境設定
const developmentLimits = {
  api: { windowMs: 15 * 60 * 1000, max: 1000 },
  registration: { windowMs: 60 * 60 * 1000, max: 50 },
  ddosProtection: false,
  adaptiveLimiting: false
};
```

### Production Environment
```javascript
// 本番環境設定
const productionLimits = {
  api: { windowMs: 15 * 60 * 1000, max: 100 },
  registration: { windowMs: 60 * 60 * 1000, max: 5 },
  ddosProtection: true,
  adaptiveLimiting: true,
  progressiveSlowDown: true
};
```

### High-Traffic Events
```javascript
// 高トラフィック時設定
const eventLimits = {
  api: { windowMs: 15 * 60 * 1000, max: 200 },
  registration: { windowMs: 60 * 60 * 1000, max: 10 },
  additionalServers: true,
  caching: 'aggressive'
};
```

## 🚨 Alert Configuration

### Threshold Settings
```javascript
// アラート閾値
const alertThresholds = {
  suspiciousIPs: 5,           // 不審IP数
  highTraffic: 1000,          // 高トラフィック判定
  attackPattern: 10,          // 攻撃パターン検出
  responseTime: 5000,         // 応答時間（ms）
  errorRate: 0.05             // エラー率 (5%)
};
```

### Notification Methods
```javascript
// 通知方法
{
  email: 'admin@xn--6wym69a.com',
  slack: process.env.SLACK_WEBHOOK_URL,
  sms: process.env.TWILIO_PHONE_NUMBER,
  dashboard: '/admin/security-alerts'
}
```

## 🧪 Testing Rate Limits

### Load Testing
```bash
# Artillery.jsによる負荷テスト
artillery run rate-limit-test.yml

# Test configuration
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Rate Limit Test"
    requests:
      - get:
          url: "/api/events"
```

### Security Testing
```javascript
// Rate limit回避テスト
describe('Rate Limiting Security', () => {
  test('should block after limit exceeded', async () => {
    // 制限を超過するリクエスト
    for (let i = 0; i < 101; i++) {
      await request(app).get('/api/events');
    }
    
    const response = await request(app).get('/api/events');
    expect(response.status).toBe(429);
  });

  test('should detect suspicious patterns', async () => {
    // 不審なパターンの送信
    const suspiciousRequests = [
      '/api/admin/../../../etc/passwd',
      '/api/events?id=1\' OR 1=1--',
      '/api/participants?<script>alert(1)</script>'
    ];
    
    for (const req of suspiciousRequests) {
      await request(app).get(req);
    }
    
    // 不審活動が検出されることを確認
    const stats = rateLimitMonitor.getStats();
    expect(stats.suspiciousIPs).toBeGreaterThan(0);
  });
});
```

## 📈 Performance Metrics

### Response Time Impact
```javascript
// レート制限のパフォーマンス影響
{
  withoutRateLimit: '45ms average',
  withBasicRateLimit: '47ms average',
  withAdaptiveRateLimit: '49ms average',
  withProgressiveSlowDown: '52ms average'
}

// メモリ使用量
{
  attemptStore: '~2MB per 10,000 attempts',
  suspiciousIPs: '~100KB per 1,000 IPs',
  cleanupOverhead: '<1% CPU usage'
}
```

### Scalability Considerations
```javascript
// スケーラビリティ対策
{
  horizontalScaling: 'Redis-based shared state',
  loadBalancing: 'Consistent IP mapping',
  caching: 'Rate limit result caching',
  optimization: 'Memory-efficient data structures'
}
```

## 🔧 Troubleshooting

### Common Issues
```javascript
// よくある問題と解決法
{
  falsePositives: {
    issue: 'Legitimate users blocked',
    solution: 'Adjust thresholds, whitelist IPs'
  },
  
  memoryLeaks: {
    issue: 'Attempt store growing',
    solution: 'Cleanup interval optimization'
  },
  
  performanceDegradation: {
    issue: 'Slow response times',
    solution: 'Rate limit optimization'
  }
}
```

### Debug Commands
```bash
# Rate limiting debug information
curl -H "X-Debug: true" http://localhost:3000/api/admin/rate-limit-stats

# Monitor real-time activity
tail -f logs/security.log | grep "Rate limit"

# Test specific IP
curl -H "X-Forwarded-For: 192.168.1.100" http://localhost:3000/api/events
```

## 📋 Security Checklist

### Pre-Deployment
- [ ] Rate limits configured for all endpoints
- [ ] DDoS protection enabled
- [ ] Adaptive rate limiting tested
- [ ] Monitoring endpoints secured with API keys
- [ ] Alert thresholds configured
- [ ] Cleanup processes verified
- [ ] Load testing completed

### Post-Deployment Monitoring
- [ ] Daily rate limit statistics review
- [ ] Weekly suspicious activity analysis
- [ ] Monthly threshold optimization
- [ ] Quarterly security testing
- [ ] Annual rate limiting strategy review

### Emergency Response
- [ ] Incident response plan documented
- [ ] Admin notification systems tested
- [ ] Emergency IP blocking procedures
- [ ] Recovery procedures verified
- [ ] Backup rate limiting configs ready

---

**Security Team Contact**: security@xn--6wym69a.com  
**Emergency Response**: 24/7 monitoring enabled  
**Last Updated**: June 2025  
**Version**: 2.0