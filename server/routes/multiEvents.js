/**
 * Multi-Event Management Routes
 * 複数イベント管理のAPIエンドポイント
 */

import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('MultiEvents');
import multiEventService from '../services/multiEventService.js';

const router = express.Router();

/**
 * 複数イベント作成
 * POST /api/multi-events/create-batch
 */
router.post(
  '/create-batch',
  [
    body('events').isArray({ min: 1 }).withMessage('少なくとも1つのイベントが必要です'),
    body('events.*.title').notEmpty().withMessage('イベントタイトルが必要です'),
    body('events.*.date').isISO8601().withMessage('有効な日付形式が必要です'),
    body('events.*.venue').notEmpty().withMessage('会場情報が必要です'),
    body('options.checkConflicts').optional().isBoolean(),
    body('options.autoResolve').optional().isBoolean(),
    body('options.notifyParticipants').optional().isBoolean(),
    body('options.batchSize').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { events, options = {} } = req.body;

      logger.info(`Creating batch of ${events.length} events`);

      const result = await multiEventService.createMultipleEvents(events, options);

      res.status(201).json({
        success: true,
        message: `${result.created.length}件のイベントが正常に作成されました`,
        data: result
      });
    } catch (error) {
      logger.error('Failed to create batch events:', error);
      res.status(500).json({
        success: false,
        message: 'イベント一括作成に失敗しました',
        error: error.message
      });
    }
  }
);

/**
 * 並行イベント管理
 * GET /api/multi-events/concurrent
 */
router.get(
  '/concurrent',
  [
    query('dateRange.start').optional().isISO8601(),
    query('dateRange.end').optional().isISO8601(),
    query('includeConflicts').optional().isBoolean(),
    query('resolveConflicts').optional().isBoolean(),
    query('priorityOrder').optional().isIn(['date', 'priority', 'participants'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const options = {
        dateRange: req.query.dateRange
          ? {
              start: req.query.dateRange.start,
              end: req.query.dateRange.end
            }
          : undefined,
        includeConflicts: req.query.includeConflicts !== 'false',
        resolveConflicts: req.query.resolveConflicts === 'true',
        priorityOrder: req.query.priorityOrder || 'date'
      };

      const result = await multiEventService.manageConcurrentEvents(options);

      res.json({
        success: true,
        message: '並行イベント管理情報を取得しました',
        data: result
      });
    } catch (error) {
      logger.error('Failed to manage concurrent events:', error);
      res.status(500).json({
        success: false,
        message: '並行イベント管理に失敗しました',
        error: error.message
      });
    }
  }
);

/**
 * 共有リソース管理
 * POST /api/multi-events/shared-resources
 */
router.post(
  '/shared-resources',
  [
    body('eventIds').isArray({ min: 2 }).withMessage('少なくとも2つのイベントIDが必要です'),
    body('eventIds.*').isString().notEmpty(),
    body('resourceType')
      .isIn(['venue', 'equipment', 'staff', 'budget'])
      .withMessage('有効なリソースタイプを指定してください'),
    body('options.allocationStrategy').optional().isIn(['priority', 'equal', 'demand-based']),
    body('options.autoBalance').optional().isBoolean(),
    body('options.notifyChanges').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { eventIds, resourceType, options = {} } = req.body;

      const result = await multiEventService.manageSharedResources(eventIds, resourceType, options);

      res.json({
        success: true,
        message: 'リソース管理が完了しました',
        data: result
      });
    } catch (error) {
      logger.error('Failed to manage shared resources:', error);
      res.status(500).json({
        success: false,
        message: '共有リソース管理に失敗しました',
        error: error.message
      });
    }
  }
);

/**
 * クロスイベント参加者管理
 * GET /api/multi-events/cross-participants
 */
router.get(
  '/cross-participants',
  [
    query('timeRange.start').optional().isISO8601(),
    query('timeRange.end').optional().isISO8601(),
    query('detectDuplicates').optional().isBoolean(),
    query('suggestOptimalEvents').optional().isBoolean(),
    query('autoNotify').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const options = {
        timeRange: req.query.timeRange
          ? {
              start: req.query.timeRange.start,
              end: req.query.timeRange.end
            }
          : undefined,
        detectDuplicates: req.query.detectDuplicates !== 'false',
        suggestOptimalEvents: req.query.suggestOptimalEvents !== 'false',
        autoNotify: req.query.autoNotify === 'true'
      };

      const result = await multiEventService.manageCrossEventParticipants(options);

      res.json({
        success: true,
        message: 'クロスイベント参加者分析を完了しました',
        data: result
      });
    } catch (error) {
      logger.error('Failed to manage cross-event participants:', error);
      res.status(500).json({
        success: false,
        message: 'クロスイベント参加者管理に失敗しました',
        error: error.message
      });
    }
  }
);

/**
 * 統合分析レポート
 * POST /api/multi-events/combined-analytics
 */
router.post(
  '/combined-analytics',
  [
    body('eventIds').isArray({ min: 1 }).withMessage('少なくとも1つのイベントIDが必要です'),
    body('eventIds.*').isString().notEmpty(),
    body('options.includeComparisons').optional().isBoolean(),
    body('options.includeTrends').optional().isBoolean(),
    body('options.includeForecasts').optional().isBoolean(),
    body('options.timeGranularity').optional().isIn(['hourly', 'daily', 'weekly', 'monthly'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { eventIds, options = {} } = req.body;

      logger.info(`Generating combined analytics for ${eventIds.length} events`);

      const result = await multiEventService.generateCombinedAnalytics(eventIds, options);

      res.json({
        success: true,
        message: '統合分析レポートを生成しました',
        data: result
      });
    } catch (error) {
      logger.error('Failed to generate combined analytics:', error);
      res.status(500).json({
        success: false,
        message: '統合分析レポート生成に失敗しました',
        error: error.message
      });
    }
  }
);

/**
 * イベント競合チェック
 * POST /api/multi-events/check-conflicts
 */
router.post(
  '/check-conflicts',
  [
    body('eventData').isObject().withMessage('イベントデータが必要です'),
    body('eventData.title').notEmpty().withMessage('イベントタイトルが必要です'),
    body('eventData.date').isISO8601().withMessage('有効な日付形式が必要です'),
    body('eventData.venue').notEmpty().withMessage('会場情報が必要です'),
    body('options.checkTime').optional().isBoolean(),
    body('options.checkVenue').optional().isBoolean(),
    body('options.checkResources').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const { eventData, options = {} } = req.body;

      const conflictInfo = await multiEventService.checkEventConflicts(eventData, options);

      res.json({
        success: true,
        message: '競合チェックを完了しました',
        data: conflictInfo
      });
    } catch (error) {
      logger.error('Failed to check event conflicts:', error);
      res.status(500).json({
        success: false,
        message: 'イベント競合チェックに失敗しました',
        error: error.message
      });
    }
  }
);

/**
 * イベント最適化提案
 * GET /api/multi-events/optimization-suggestions
 */
router.get(
  '/optimization-suggestions',
  [
    query('eventIds').optional().isString(),
    query('timeRange.start').optional().isISO8601(),
    query('timeRange.end').optional().isISO8601(),
    query('optimizationType').optional().isIn(['schedule', 'resources', 'participants', 'all'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const options = {
        eventIds: req.query.eventIds ? req.query.eventIds.split(',') : undefined,
        timeRange: req.query.timeRange
          ? {
              start: req.query.timeRange.start,
              end: req.query.timeRange.end
            }
          : undefined,
        optimizationType: req.query.optimizationType || 'all'
      };

      const suggestions = await multiEventService.generateOptimizationSuggestions(options);

      res.json({
        success: true,
        message: '最適化提案を生成しました',
        data: suggestions
      });
    } catch (error) {
      logger.error('Failed to generate optimization suggestions:', error);
      res.status(500).json({
        success: false,
        message: '最適化提案の生成に失敗しました',
        error: error.message
      });
    }
  }
);

/**
 * リアルタイム管理ダッシュボード
 * GET /api/multi-events/dashboard
 */
router.get(
  '/dashboard',
  [
    query('refreshInterval').optional().isInt({ min: 5, max: 300 }),
    query('includeMetrics').optional().isBoolean(),
    query('includeAlerts').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'バリデーションエラー',
          errors: errors.array()
        });
      }

      const options = {
        refreshInterval: parseInt(req.query.refreshInterval) || 30,
        includeMetrics: req.query.includeMetrics !== 'false',
        includeAlerts: req.query.includeAlerts !== 'false'
      };

      // リアルタイムデータの集約
      const [concurrentEvents, crossParticipants, resourceStatus] = await Promise.all([
        multiEventService.manageConcurrentEvents({ includeConflicts: true }),
        multiEventService.manageCrossEventParticipants({ detectDuplicates: true }),
        multiEventService.getResourceStatus()
      ]);

      const dashboard = {
        timestamp: new Date().toISOString(),
        refreshInterval: options.refreshInterval,
        overview: {
          activeEvents: concurrentEvents.activeEvents,
          concurrentGroups: concurrentEvents.concurrentGroups.length,
          totalConflicts: concurrentEvents.conflicts?.totalConflicts || 0,
          crossEventParticipants: crossParticipants.multiEventParticipants
        },
        metrics: options.includeMetrics
          ? {
              eventUtilization: this.calculateEventUtilization(concurrentEvents),
              resourceEfficiency: this.calculateResourceEfficiency(resourceStatus),
              participantSatisfaction: this.calculateParticipantSatisfaction(crossParticipants)
            }
          : null,
        alerts: options.includeAlerts
          ? [
              ...concurrentEvents.managementStatus.warnings,
              ...this.generateResourceAlerts(resourceStatus),
              ...this.generateParticipantAlerts(crossParticipants)
            ]
          : null,
        recommendations: [
          ...concurrentEvents.managementStatus.recommendations,
          ...this.generateDashboardRecommendations(concurrentEvents, crossParticipants)
        ]
      };

      res.json({
        success: true,
        message: 'ダッシュボードデータを取得しました',
        data: dashboard
      });
    } catch (error) {
      logger.error('Failed to get dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'ダッシュボードデータの取得に失敗しました',
        error: error.message
      });
    }
  }
);

// ヘルパーメソッド
router.calculateEventUtilization = concurrentEvents => {
  if (concurrentEvents.activeEvents === 0) {
    return 0;
  }
  const utilizationRate =
    (concurrentEvents.activeEvents - (concurrentEvents.conflicts?.totalConflicts || 0)) /
    concurrentEvents.activeEvents;
  return Math.max(0, Math.min(1, utilizationRate));
};

router.calculateResourceEfficiency = _resourceStatus => {
  // リソース効率の計算ロジック
  return 0.85; // プレースホルダー
};

router.calculateParticipantSatisfaction = _crossParticipants => {
  // 参加者満足度の計算ロジック
  return 0.92; // プレースホルダー
};

router.generateResourceAlerts = _resourceStatus => {
  // リソース関連のアラート生成
  return [];
};

router.generateParticipantAlerts = crossParticipants => {
  const alerts = [];

  if (crossParticipants.duplicates.length > 0) {
    alerts.push({
      type: 'warning',
      message: `${crossParticipants.duplicates.length}件の重複登録が検出されました`,
      action: 'duplicate-resolution-required'
    });
  }

  return alerts;
};

router.generateDashboardRecommendations = (concurrentEvents, crossParticipants) => {
  const recommendations = [];

  if (concurrentEvents.concurrentGroups.length > 2) {
    recommendations.push({
      type: 'optimization',
      message: '複数の並行イベントがあります。スケジュール調整を検討してください。',
      priority: 'medium'
    });
  }

  if (crossParticipants.multiEventParticipants > crossParticipants.totalParticipants * 0.3) {
    recommendations.push({
      type: 'insight',
      message: '多くの参加者が複数イベントに参加しています。連携企画を検討してください。',
      priority: 'low'
    });
  }

  return recommendations;
};

export default router;
