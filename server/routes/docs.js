/**
 * API Documentation Routes
 * OpenAPI/Swagger統合とAPIドキュメント提供
 */

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');
const fs = require('fs');
const { logger } = require('../middleware/logger');

const router = express.Router();

// OpenAPI仕様を読み込み
let swaggerDocument;
try {
  const openApiPath = path.join(__dirname, '../../docs/api/openapi.yaml');
  swaggerDocument = YAML.load(openApiPath);
  logger.info('OpenAPI specification loaded successfully');
} catch (error) {
  logger.error('Failed to load OpenAPI specification:', error);
  swaggerDocument = {
    openapi: '3.0.3',
    info: {
      title: 'Lightning Talk API',
      version: '1.0.0',
      description: 'API documentation is temporarily unavailable'
    },
    paths: {}
  };
}

// Swagger UI設定
const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 3,
    defaultModelExpandDepth: 3,
    tryItOutEnabled: true
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 2.5em; color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 15px; border-radius: 8px; }
    .swagger-ui .opblock-summary-path { font-weight: bold; }
    .swagger-ui .btn.authorize { background-color: #007bff; border-color: #007bff; }
    .swagger-ui .btn.authorize:hover { background-color: #0056b3; border-color: #0056b3; }
  `,
  customSiteTitle: 'Lightning Talk API Documentation',
  customfavIcon: '/favicon.ico'
};

/**
 * Swagger UI ドキュメント
 * GET /api/docs
 */
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument, swaggerOptions));

/**
 * OpenAPI仕様のJSON形式取得
 * GET /api/docs/openapi.json
 */
router.get('/openapi.json', (req, res) => {
  try {
    res.json(swaggerDocument);
  } catch (error) {
    logger.error('Failed to serve OpenAPI JSON:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load API specification',
      error: error.message
    });
  }
});

/**
 * OpenAPI仕様のYAML形式取得
 * GET /api/docs/openapi.yaml
 */
router.get('/openapi.yaml', (req, res) => {
  try {
    const openApiPath = path.join(__dirname, '../../docs/api/openapi.yaml');

    if (fs.existsSync(openApiPath)) {
      res.setHeader('Content-Type', 'application/x-yaml');
      res.sendFile(openApiPath);
    } else {
      res.status(404).json({
        success: false,
        message: 'OpenAPI YAML file not found'
      });
    }
  } catch (error) {
    logger.error('Failed to serve OpenAPI YAML:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load API specification',
      error: error.message
    });
  }
});

/**
 * API概要とクイックスタート
 * GET /api/docs/quickstart
 */
router.get('/quickstart', (req, res) => {
  try {
    const quickstartGuide = {
      title: 'Lightning Talk API クイックスタート',
      version: swaggerDocument.info.version,
      baseUrl: `${req.protocol}://${req.get('host')}/api`,
      authentication: {
        admin: {
          type: 'Bearer Token (JWT)',
          header: 'Authorization: Bearer YOUR_JWT_TOKEN',
          description: '管理者機能にはJWTトークンが必要です'
        },
        apiKey: {
          type: 'API Key',
          header: 'X-API-Key: YOUR_API_KEY',
          description: '一部のエンドポイントではAPIキーを使用できます'
        }
      },
      quickExamples: {
        イベント一覧取得: {
          method: 'GET',
          endpoint: '/events',
          description: '公開されているイベントの一覧を取得',
          example: {
            curl: `curl -X GET "${req.protocol}://${req.get('host')}/api/events"`,
            response: {
              success: true,
              data: [
                {
                  id: 'event-001',
                  title: '第1回 なんでもライトニングトーク',
                  date: '2025-06-25T19:00:00+09:00',
                  status: 'upcoming'
                }
              ]
            }
          }
        },
        参加者登録: {
          method: 'POST',
          endpoint: '/participants/register',
          description: 'イベントへの参加登録',
          example: {
            curl: `curl -X POST "${req.protocol}://${req.get('host')}/api/participants/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "テスト太郎",
    "email": "test@example.com",
    "eventId": "event-001",
    "participationType": "online"
  }'`,
            response: {
              success: true,
              message: '参加登録が完了しました',
              data: {
                id: 'participant-001',
                name: 'テスト太郎',
                eventId: 'event-001'
              }
            }
          }
        },
        発表提出: {
          method: 'POST',
          endpoint: '/talks',
          description: 'ライトニングトークの発表提出',
          example: {
            curl: `curl -X POST "${req.protocol}://${req.get('host')}/api/talks" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "JavaScriptの新機能紹介",
    "description": "ES2025の新機能を簡単に紹介します",
    "speakerName": "発表太郎",
    "speakerEmail": "speaker@example.com",
    "eventId": "event-001",
    "category": "技術"
  }'`,
            response: {
              success: true,
              message: '発表が正常に提出されました',
              data: {
                id: 'talk-001',
                title: 'JavaScriptの新機能紹介',
                status: 'pending'
              }
            }
          }
        }
      },
      realTimeFeatures: {
        'Server-Sent Events': {
          endpoint: '/notifications/stream',
          description: 'リアルタイム通知のSSEストリーム',
          example: {
            javascript: `const eventSource = new EventSource('${req.protocol}://${req.get('host')}/api/notifications/stream');
eventSource.addEventListener('connected', (event) => {
  console.log('接続完了:', JSON.parse(event.data));
});
eventSource.addEventListener('participant_registered', (event) => {
  console.log('新規参加者:', JSON.parse(event.data));
});`
          }
        },
        WebSocket: {
          endpoint: '/ws',
          description: 'WebSocket接続によるリアルタイム通信',
          example: {
            javascript: `const ws = new WebSocket('${req.protocol === 'https' ? 'wss' : 'ws'}://${req.get('host')}/ws');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('受信メッセージ:', message);
};
ws.send(JSON.stringify({
  type: 'subscribe',
  topics: ['all']
}));`
          }
        }
      },
      multiEventFeatures: {
        複数イベント一括作成: {
          endpoint: '/multi-events/create-batch',
          description: '複数のイベントを一括で作成',
          authentication: 'Admin Required'
        },
        並行イベント管理: {
          endpoint: '/multi-events/concurrent',
          description: '同時実行中のイベント管理',
          authentication: 'Admin Required'
        },
        リアルタイムダッシュボード: {
          endpoint: '/multi-events/dashboard',
          description: 'マルチイベント管理ダッシュボード',
          authentication: 'Admin Required'
        }
      },
      errorHandling: {
        '400 Bad Request': '不正なリクエスト（バリデーションエラー）',
        '401 Unauthorized': '認証が必要',
        '403 Forbidden': 'アクセス権限なし',
        '404 Not Found': 'リソースが見つからない',
        '409 Conflict': '重複データ（例：重複登録）',
        '429 Too Many Requests': 'レート制限に達した',
        '500 Internal Server Error': 'サーバー内部エラー'
      },
      nextSteps: [
        '詳細なAPI仕様は /api/docs で確認してください',
        'WebSocketやSSEを使用したリアルタイム機能を試してみてください',
        '管理者機能を使用する場合は、適切な認証トークンを取得してください',
        'GitHub Repositoryでソースコードとより詳しいドキュメントを確認できます'
      ]
    };

    res.json({
      success: true,
      data: quickstartGuide
    });
  } catch (error) {
    logger.error('Failed to generate quickstart guide:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quickstart guide',
      error: error.message
    });
  }
});

/**
 * APIステータスとメトリクス
 * GET /api/docs/status
 */
router.get('/status', (req, res) => {
  try {
    const apiStatus = {
      api: {
        version: swaggerDocument.info.version,
        title: swaggerDocument.info.title,
        description: swaggerDocument.info.description,
        contact: swaggerDocument.info.contact,
        license: swaggerDocument.info.license
      },
      endpoints: {
        total: Object.keys(swaggerDocument.paths || {}).length,
        byMethod: {},
        byTag: {}
      },
      features: {
        authentication: ['JWT Bearer Token', 'API Key'],
        realTime: ['WebSocket', 'Server-Sent Events'],
        multiEvent: ['Batch Creation', 'Concurrent Management', 'Analytics'],
        monitoring: ['Health Checks', 'Rate Limiting', 'Error Tracking']
      },
      lastUpdated: new Date().toISOString(),
      documentation: {
        swagger: '/api/docs',
        openapi_json: '/api/docs/openapi.json',
        openapi_yaml: '/api/docs/openapi.yaml',
        quickstart: '/api/docs/quickstart'
      }
    };

    // エンドポイント統計の計算
    if (swaggerDocument.paths) {
      Object.entries(swaggerDocument.paths).forEach(([path, methods]) => {
        Object.keys(methods).forEach(method => {
          if (method !== 'parameters') {
            apiStatus.endpoints.byMethod[method.toUpperCase()] =
              (apiStatus.endpoints.byMethod[method.toUpperCase()] || 0) + 1;

            const tags = methods[method].tags || ['Untagged'];
            tags.forEach(tag => {
              apiStatus.endpoints.byTag[tag] = (apiStatus.endpoints.byTag[tag] || 0) + 1;
            });
          }
        });
      });
    }

    res.json({
      success: true,
      data: apiStatus
    });
  } catch (error) {
    logger.error('Failed to get API status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get API status',
      error: error.message
    });
  }
});

/**
 * SDKとクライアントライブラリ情報
 * GET /api/docs/sdks
 */
router.get('/sdks', (req, res) => {
  try {
    const sdkInfo = {
      title: 'Lightning Talk API - SDK & Client Libraries',
      description: 'API利用のためのSDKとクライアントライブラリ情報',

      officialSdks: {
        javascript: {
          name: 'lightning-talk-js-sdk',
          version: '1.0.0',
          description: 'JavaScript/TypeScript用公式SDK',
          installation: 'npm install lightning-talk-js-sdk',
          github: 'https://github.com/example/lightning-talk-js-sdk',
          example: `import { LightningTalkAPI } from 'lightning-talk-js-sdk';

const api = new LightningTalkAPI('${req.protocol}://${req.get('host')}/api');

// イベント取得
const events = await api.events.list();

// 参加者登録
const participant = await api.participants.register({
  name: 'テスト太郎',
  email: 'test@example.com',
  eventId: 'event-001',
  participationType: 'online'
});

// リアルタイム通知
api.notifications.onParticipantRegistered((data) => {
  console.log('新規参加者:', data);
});`
        },

        python: {
          name: 'lightning-talk-python-sdk',
          version: '1.0.0',
          description: 'Python用公式SDK',
          installation: 'pip install lightning-talk-python-sdk',
          github: 'https://github.com/example/lightning-talk-python-sdk',
          example: `from lightning_talk import LightningTalkAPI

api = LightningTalkAPI('${req.protocol}://${req.get('host')}/api')

# イベント取得
events = api.events.list()

# 参加者登録
participant = api.participants.register(
    name='テスト太郎',
    email='test@example.com',
    event_id='event-001',
    participation_type='online'
)

# 統計情報取得（管理者権限必要）
api.set_admin_token('your-jwt-token')
stats = api.analytics.get_event_statistics('event-001')`
        }
      },

      codeGenerators: {
        openapi_generator: {
          description: 'OpenAPI Generatorを使用してクライアントコードを生成',
          installation: 'npm install @openapitools/openapi-generator-cli -g',
          usage: [
            `openapi-generator-cli generate -i ${req.protocol}://${req.get('host')}/api/docs/openapi.json -g javascript -o ./lightning-talk-client`,
            `openapi-generator-cli generate -i ${req.protocol}://${req.get('host')}/api/docs/openapi.json -g python -o ./lightning-talk-client-python`,
            `openapi-generator-cli generate -i ${req.protocol}://${req.get('host')}/api/docs/openapi.json -g typescript-axios -o ./lightning-talk-client-ts`
          ],
          supportedLanguages: [
            'javascript',
            'typescript-axios',
            'typescript-node',
            'python',
            'java',
            'csharp',
            'go',
            'php',
            'ruby',
            'swift'
          ]
        },

        swagger_codegen: {
          description: 'Swagger Codegenを使用してクライアントコードを生成',
          usage: [
            `swagger-codegen generate -i ${req.protocol}://${req.get('host')}/api/docs/openapi.json -l javascript -o ./client-js`,
            `swagger-codegen generate -i ${req.protocol}://${req.get('host')}/api/docs/openapi.json -l python -o ./client-python`
          ]
        }
      },

      postmanCollection: {
        description: 'Postman用のAPIコレクション',
        import: {
          method: 'OpenAPI仕様をPostmanにインポート',
          url: `${req.protocol}://${req.get('host')}/api/docs/openapi.json`,
          steps: [
            'Postmanを開く',
            'Import > Link タブを選択',
            `上記URLを入力: ${req.protocol}://${req.get('host')}/api/docs/openapi.json`,
            'Importボタンをクリック'
          ]
        }
      },

      examples: {
        curl: {
          description: 'cURLを使用したAPIアクセス例',
          basicUsage: [
            `# イベント一覧取得
curl -X GET "${req.protocol}://${req.get('host')}/api/events"`,

            `# 参加者登録
curl -X POST "${req.protocol}://${req.get('host')}/api/participants/register" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "テスト太郎",
    "email": "test@example.com",
    "eventId": "event-001",
    "participationType": "online"
  }'`,

            `# 管理者機能（JWTトークン必要）
curl -X GET "${req.protocol}://${req.get('host')}/api/participants/event-001" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN"`
          ]
        },

        httpie: {
          description: 'HTTPieを使用したAPIアクセス例',
          basicUsage: [
            `# イベント一覧取得
http GET ${req.protocol}://${req.get('host')}/api/events`,

            `# 参加者登録
http POST ${req.protocol}://${req.get('host')}/api/participants/register \\
  name="テスト太郎" \\
  email="test@example.com" \\
  eventId="event-001" \\
  participationType="online"`,

            `# 管理者機能
http GET ${req.protocol}://${req.get('host')}/api/participants/event-001 \\
  Authorization:"Bearer YOUR_JWT_TOKEN"`
          ]
        }
      },

      community: {
        discord: 'https://discord.gg/lightningtalk',
        github: 'https://github.com/example/lightningtalk-circle',
        discussions: 'https://github.com/example/lightningtalk-circle/discussions',
        issues: 'https://github.com/example/lightningtalk-circle/issues'
      }
    };

    res.json({
      success: true,
      data: sdkInfo
    });
  } catch (error) {
    logger.error('Failed to get SDK information:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get SDK information',
      error: error.message
    });
  }
});

/**
 * APIの更新履歴
 * GET /api/docs/changelog
 */
router.get('/changelog', (req, res) => {
  try {
    const changelog = {
      title: 'Lightning Talk API - Changelog',
      description: 'APIの変更履歴とバージョン情報',
      currentVersion: swaggerDocument.info.version,

      versions: [
        {
          version: '1.0.0',
          releaseDate: '2025-06-22',
          type: 'major',
          changes: {
            added: [
              '基本的なイベント管理API',
              '参加者登録・管理機能',
              '発表提出・管理機能',
              'リアルタイム通知機能（WebSocket, SSE）',
              '複数イベント同時管理機能',
              '詳細な分析・レポート機能',
              'OpenAPI 3.0準拠のAPI仕様',
              'Swagger UI統合ドキュメント'
            ],
            changed: [],
            deprecated: [],
            removed: [],
            fixed: [],
            security: ['JWT認証システム', 'レート制限機能', '入力値検証強化', 'CORS設定最適化']
          },
          migration: {
            breakingChanges: [],
            recommendations: [
              '新規プロジェクトでは最新のSDKを使用してください',
              'リアルタイム機能を活用してユーザーエクスペリエンスを向上させてください'
            ]
          }
        }
      ],

      upcomingFeatures: [
        {
          version: '1.1.0',
          expectedRelease: '2025-07-15',
          features: [
            'GraphQL API対応',
            'ファイルアップロード機能',
            'カレンダー統合',
            'メール通知テンプレートカスタマイズ'
          ]
        },
        {
          version: '1.2.0',
          expectedRelease: '2025-08-30',
          features: [
            'マルチテナント対応',
            '決済システム統合',
            'モバイルアプリ用API拡張',
            '高度な分析ダッシュボード'
          ]
        }
      ],

      deprecationPolicy: {
        notice: 'APIの重要な変更は最低3ヶ月前に通知します',
        supportPeriod: 'メジャーバージョンは最低12ヶ月間サポートします',
        migration: '移行ガイドと互換性情報を提供します'
      }
    };

    res.json({
      success: true,
      data: changelog
    });
  } catch (error) {
    logger.error('Failed to get changelog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get changelog',
      error: error.message
    });
  }
});

module.exports = router;
