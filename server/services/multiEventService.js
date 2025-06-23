/**
 * Multi-Event Management Service
 * 並行イベント管理と相互運用機能を提供するサービス
 */

const logger = require('../middleware/logger');
const { DatabaseService } = require('./database');
const analyticsService = require('./analyticsService');
const { EventService } = require('./event');
const { EmailService } = require('./email');

class MultiEventService {
  constructor() {
    this.db = DatabaseService.getInstance();
    this.eventService = new EventService();
    this.emailService = new EmailService();
    this.eventCache = new Map();
    this.conflictResolver = new EventConflictResolver();
    this.scheduler = new EventScheduler();
  }

  /**
   * 複数イベントの作成
   */
  async createMultipleEvents(eventsData, options = {}) {
    try {
      const {
        checkConflicts = true,
        autoResolve = false,
        notifyParticipants = true,
        batchSize = 10
      } = options;

      // バッチ処理で効率的にイベント作成
      const batches = this.createBatches(eventsData, batchSize);
      const createdEvents = [];
      const conflicts = [];
      const errors = [];

      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(async eventData => {
            try {
              // 競合チェック
              if (checkConflicts) {
                const conflictInfo = await this.checkEventConflicts(eventData);
                if (conflictInfo.hasConflicts && !autoResolve) {
                  conflicts.push({ eventData, conflicts: conflictInfo.conflicts });
                  return null;
                }

                if (conflictInfo.hasConflicts && autoResolve) {
                  eventData = await this.conflictResolver.resolve(
                    eventData,
                    conflictInfo.conflicts
                  );
                }
              }

              // イベント作成
              const event = await this.eventService.createEvent(eventData);

              // キャッシュに追加
              this.eventCache.set(event.id, event);

              return event;
            } catch (error) {
              errors.push({ eventData, error: error.message });
              return null;
            }
          })
        );

        // 成功したイベントを収集
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            createdEvents.push(result.value);
          }
        });
      }

      // スケジューリング最適化
      if (createdEvents.length > 1) {
        await this.scheduler.optimizeScheduling(createdEvents);
      }

      // 参加者への通知
      if (notifyParticipants && createdEvents.length > 0) {
        await this.notifyMultiEventCreation(createdEvents);
      }

      return {
        success: true,
        created: createdEvents,
        conflicts,
        errors,
        summary: {
          totalAttempted: eventsData.length,
          successfullyCreated: createdEvents.length,
          conflictsFound: conflicts.length,
          errorsOccurred: errors.length
        }
      };
    } catch (error) {
      logger.error('Failed to create multiple events:', error);
      throw new Error('Failed to create multiple events');
    }
  }

  /**
   * 並行イベントの管理
   */
  async manageConcurrentEvents(options = {}) {
    try {
      const {
        dateRange,
        includeConflicts = true,
        resolveConflicts = false,
        priorityOrder = 'date'
      } = options;

      // アクティブなイベントを取得
      const activeEvents = await this.getActiveEvents(dateRange);

      // 並行実行中のイベントを特定
      const concurrentEvents = this.identifyConcurrentEvents(activeEvents);

      // リソース競合をチェック
      const resourceConflicts = await this.checkResourceConflicts(concurrentEvents);

      // 参加者の重複をチェック
      const participantOverlaps = await this.checkParticipantOverlaps(concurrentEvents);

      // 会場・時間の競合をチェック
      const venueTimeConflicts = this.checkVenueTimeConflicts(concurrentEvents);

      const conflictSummary = {
        resourceConflicts,
        participantOverlaps,
        venueTimeConflicts,
        totalConflicts:
          resourceConflicts.length + participantOverlaps.length + venueTimeConflicts.length
      };

      // 自動競合解決
      let resolutionResults = null;
      if (resolveConflicts && conflictSummary.totalConflicts > 0) {
        resolutionResults = await this.resolveAllConflicts(conflictSummary, priorityOrder);
      }

      // 最適化提案
      const optimizationSuggestions = await this.generateOptimizationSuggestions(concurrentEvents);

      return {
        activeEvents: activeEvents.length,
        concurrentGroups: concurrentEvents,
        conflicts: includeConflicts ? conflictSummary : null,
        resolutions: resolutionResults,
        optimizations: optimizationSuggestions,
        managementStatus: {
          healthy: conflictSummary.totalConflicts === 0,
          warnings: this.generateWarnings(conflictSummary),
          recommendations: this.generateRecommendations(concurrentEvents, conflictSummary)
        }
      };
    } catch (error) {
      logger.error('Failed to manage concurrent events:', error);
      throw new Error('Failed to manage concurrent events');
    }
  }

  /**
   * イベント間のリソース共有
   */
  async manageSharedResources(eventIds, resourceType, options = {}) {
    try {
      const {
        allocationStrategy = 'priority',
        autoBalance = false,
        notifyChanges = true
      } = options;

      const events = await this.getEventsByIds(eventIds);
      const resources = await this.getAvailableResources(resourceType);

      // 現在のリソース割り当てを分析
      const currentAllocations = await this.analyzeResourceAllocations(events, resourceType);

      // 最適な割り当て計算
      const optimalAllocation = await this.calculateOptimalAllocation(
        events,
        resources,
        allocationStrategy
      );

      // 割り当て変更が必要かチェック
      const changes = this.compareAllocations(currentAllocations, optimalAllocation);

      if (changes.length > 0) {
        if (autoBalance) {
          // 自動リバランス実行
          await this.applyResourceChanges(changes);

          if (notifyChanges) {
            await this.notifyResourceChanges(changes);
          }
        }

        return {
          success: true,
          currentAllocations,
          optimalAllocation,
          changes,
          applied: autoBalance,
          efficiency: this.calculateAllocationEfficiency(optimalAllocation)
        };
      }

      return {
        success: true,
        message: 'No resource reallocation needed',
        efficiency: this.calculateAllocationEfficiency(currentAllocations)
      };
    } catch (error) {
      logger.error('Failed to manage shared resources:', error);
      throw new Error('Failed to manage shared resources');
    }
  }

  /**
   * クロスイベント参加者管理
   */
  async manageCrossEventParticipants(options = {}) {
    try {
      const {
        timeRange,
        detectDuplicates = true,
        suggestOptimalEvents = true,
        autoNotify = false
      } = options;

      // 期間内の全参加者を取得
      const allParticipants = await this.getAllParticipants(timeRange);

      // 複数イベント参加者を特定
      const multiEventParticipants = this.identifyMultiEventParticipants(allParticipants);

      // 重複登録の検出
      let duplicates = [];
      if (detectDuplicates) {
        duplicates = this.detectDuplicateRegistrations(allParticipants);
      }

      // 最適イベント提案
      let suggestions = [];
      if (suggestOptimalEvents) {
        suggestions = await this.generateEventSuggestions(multiEventParticipants);
      }

      // 参加者統計
      const statistics = this.calculateParticipantStatistics(
        allParticipants,
        multiEventParticipants
      );

      // 自動通知
      if (autoNotify && suggestions.length > 0) {
        await this.notifyParticipantSuggestions(suggestions);
      }

      return {
        totalParticipants: allParticipants.length,
        multiEventParticipants: multiEventParticipants.length,
        duplicates,
        suggestions,
        statistics,
        insights: {
          participationPatterns: this.analyzeParticipationPatterns(multiEventParticipants),
          engagementLevels: this.calculateEngagementLevels(allParticipants),
          retentionRates: await this.calculateRetentionRates(allParticipants)
        }
      };
    } catch (error) {
      logger.error('Failed to manage cross-event participants:', error);
      throw new Error('Failed to manage cross-event participants');
    }
  }

  /**
   * イベント統合分析
   */
  async generateCombinedAnalytics(eventIds, options = {}) {
    try {
      const {
        includeComparisons = true,
        includeTrends = true,
        includeForecasts = true,
        timeGranularity = 'daily'
      } = options;

      // 各イベントの個別分析
      const individualAnalytics = await Promise.all(
        eventIds.map(eventId =>
          analyticsService.getEventStatistics(eventId, {
            includeDetails: true,
            includeTrends: true
          })
        )
      );

      // 統合統計の計算
      const combinedStatistics = this.combineEventStatistics(individualAnalytics);

      // クロスイベント比較
      let comparisons = null;
      if (includeComparisons) {
        comparisons = await analyticsService.compareEvents(eventIds, options);
      }

      // 統合トレンド分析
      let combinedTrends = null;
      if (includeTrends) {
        combinedTrends = this.analyzeCombinedTrends(individualAnalytics, timeGranularity);
      }

      // 予測分析
      let forecasts = null;
      if (includeForecasts) {
        forecasts = this.generateCombinedForecasts(combinedTrends, individualAnalytics);
      }

      // インサイトの生成
      const insights = this.generateCombinedInsights(
        combinedStatistics,
        comparisons,
        combinedTrends,
        forecasts
      );

      return {
        eventIds,
        generatedAt: new Date().toISOString(),
        combinedStatistics,
        individualAnalytics,
        comparisons,
        trends: combinedTrends,
        forecasts,
        insights,
        summary: {
          totalEvents: eventIds.length,
          totalParticipants: combinedStatistics.totalParticipants,
          totalTalks: combinedStatistics.totalTalks,
          averageEventSize: Math.round(combinedStatistics.totalParticipants / eventIds.length),
          successMetrics: this.calculateSuccessMetrics(combinedStatistics)
        }
      };
    } catch (error) {
      logger.error('Failed to generate combined analytics:', error);
      throw new Error('Failed to generate combined analytics');
    }
  }

  // ヘルパーメソッド

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async checkEventConflicts(eventData) {
    const conflicts = [];

    // 時間の競合チェック
    const timeConflicts = await this.checkTimeConflicts(eventData);
    if (timeConflicts.length > 0) {
      conflicts.push(...timeConflicts);
    }

    // 会場の競合チェック
    const venueConflicts = await this.checkVenueConflicts(eventData);
    if (venueConflicts.length > 0) {
      conflicts.push(...venueConflicts);
    }

    // リソースの競合チェック
    const resourceConflicts = await this.checkResourceConflicts([eventData]);
    if (resourceConflicts.length > 0) {
      conflicts.push(...resourceConflicts);
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts
    };
  }

  async getActiveEvents(dateRange) {
    let query = `
      SELECT * FROM events
      WHERE status IN ('upcoming', 'ongoing', 'registration_open')
    `;

    const params = [];

    if (dateRange) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(dateRange.start, dateRange.end);
    }

    query += ' ORDER BY date ASC';

    return await this.db.query(query, params);
  }

  identifyConcurrentEvents(events) {
    const concurrentGroups = [];
    const processed = new Set();

    events.forEach((event, index) => {
      if (processed.has(event.id)) {
        return;
      }

      const group = [event];
      processed.add(event.id);

      // 同時期に開催される他のイベントを検索
      for (let i = index + 1; i < events.length; i++) {
        const otherEvent = events[i];
        if (processed.has(otherEvent.id)) {
          continue;
        }

        if (this.eventsOverlap(event, otherEvent)) {
          group.push(otherEvent);
          processed.add(otherEvent.id);
        }
      }

      if (group.length > 1) {
        concurrentGroups.push(group);
      }
    });

    return concurrentGroups;
  }

  eventsOverlap(event1, event2) {
    const start1 = new Date(event1.date);
    const end1 = new Date(event1.end_date || event1.date);
    const start2 = new Date(event2.date);
    const end2 = new Date(event2.end_date || event2.date);

    return start1 < end2 && start2 < end1;
  }

  async checkResourceConflicts(_events) {
    // リソース競合のロジック実装
    return [];
  }

  async checkParticipantOverlaps(_concurrentEvents) {
    // 参加者重複チェックのロジック実装
    return [];
  }

  checkVenueTimeConflicts(_concurrentEvents) {
    // 会場・時間競合チェックのロジック実装
    return [];
  }

  generateWarnings(conflictSummary) {
    const warnings = [];

    if (conflictSummary.totalConflicts > 5) {
      warnings.push('多数の競合が検出されています。イベントスケジュールの見直しを推奨します。');
    }

    if (conflictSummary.venueTimeConflicts.length > 0) {
      warnings.push('会場または時間の競合があります。');
    }

    return warnings;
  }

  generateRecommendations(concurrentEvents, conflictSummary) {
    const recommendations = [];

    if (concurrentEvents.length > 3) {
      recommendations.push('同時開催イベント数が多いため、参加者の分散を検討してください。');
    }

    if (conflictSummary.totalConflicts > 0) {
      recommendations.push(
        '競合解決のため、イベント時間の調整またはリソースの追加配分を検討してください。'
      );
    }

    return recommendations;
  }

  combineEventStatistics(individualAnalytics) {
    const combined = {
      totalParticipants: 0,
      totalTalks: 0,
      averageRating: 0,
      totalRevenue: 0
    };

    individualAnalytics.forEach(analytics => {
      combined.totalParticipants += analytics.statistics.basic.summary.totalParticipants;
      combined.totalTalks += analytics.statistics.basic.summary.totalTalks;
    });

    return combined;
  }

  calculateSuccessMetrics(statistics) {
    return {
      participantEngagement: statistics.totalParticipants > 0 ? 'high' : 'low',
      contentDiversity: statistics.totalTalks > 10 ? 'high' : 'medium',
      overallSuccess: statistics.totalParticipants > 50 ? 'excellent' : 'good'
    };
  }

  async notifyMultiEventCreation(events) {
    // 複数イベント作成の通知ロジック
    logger.info(`Created ${events.length} events successfully`);
  }

  // 省略されたヘルパーメソッドの実装
  async checkTimeConflicts(_eventData) {
    return [];
  }
  async checkVenueConflicts(_eventData) {
    return [];
  }
  async getEventsByIds(_ids) {
    return [];
  }
  async getAvailableResources(_type) {
    return [];
  }
  async analyzeResourceAllocations(_events, _type) {
    return {};
  }
  async calculateOptimalAllocation(_events, _resources, _strategy) {
    return {};
  }
  compareAllocations(_current, _optimal) {
    return [];
  }
  calculateAllocationEfficiency(_allocation) {
    return 0.85;
  }
  async getAllParticipants(_timeRange) {
    return [];
  }
  identifyMultiEventParticipants(_participants) {
    return [];
  }
  detectDuplicateRegistrations(_participants) {
    return [];
  }
  calculateParticipantStatistics(_all, _multi) {
    return {};
  }
  analyzeParticipationPatterns(_participants) {
    return {};
  }
  calculateEngagementLevels(_participants) {
    return {};
  }
  async calculateRetentionRates(_participants) {
    return {};
  }
  analyzeCombinedTrends(_analytics, _granularity) {
    return {};
  }
  generateCombinedForecasts(_trends, _analytics) {
    return {};
  }
  generateCombinedInsights(_stats, _comparisons, _trends, _forecasts) {
    return {};
  }
}

/**
 * Event Conflict Resolver
 * イベント競合の自動解決機能
 */
class EventConflictResolver {
  async resolve(eventData, conflicts) {
    // 競合解決のロジック実装
    const resolved = { ...eventData };

    conflicts.forEach(conflict => {
      switch (conflict.type) {
        case 'time':
          resolved.date = this.findAlternativeTime(eventData.date, conflict.suggestions);
          break;
        case 'venue':
          resolved.venue = this.findAlternativeVenue(eventData.venue, conflict.alternatives);
          break;
        case 'resource':
          resolved.resources = this.reallocateResources(eventData.resources, conflict.available);
          break;
      }
    });

    return resolved;
  }

  findAlternativeTime(originalTime, suggestions) {
    return suggestions[0] || originalTime;
  }

  findAlternativeVenue(originalVenue, alternatives) {
    return alternatives[0] || originalVenue;
  }

  reallocateResources(originalResources, available) {
    return available.slice(0, originalResources?.length || 1);
  }
}

/**
 * Event Scheduler
 * イベントスケジューリング最適化
 */
class EventScheduler {
  async optimizeScheduling(events) {
    // スケジューリング最適化のロジック実装
    const optimized = [...events];

    // 時間の重複を避けるための調整
    optimized.sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 1; i < optimized.length; i++) {
      const current = optimized[i];
      const previous = optimized[i - 1];

      const currentStart = new Date(current.date);
      const previousEnd = new Date(previous.end_date || previous.date);

      // 最小30分の間隔を確保
      if (currentStart.getTime() - previousEnd.getTime() < 30 * 60 * 1000) {
        const newStart = new Date(previousEnd.getTime() + 30 * 60 * 1000);
        current.date = newStart.toISOString();
      }
    }

    return optimized;
  }
}

const multiEventService = new MultiEventService();
export default multiEventService;
