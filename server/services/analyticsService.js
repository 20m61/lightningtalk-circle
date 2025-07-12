import { createLogger } from '../utils/logger.js';
import { DatabaseService } from './database.js';

const logger = createLogger('analytics-service');

/**
 * Analytics Service
 * イベント分析とレポート機能を提供するサービス
 */

class AnalyticsService {
  constructor() {
    this.db = DatabaseService.getInstance();
  }

  /**
   * イベント統計の取得
   */
  async getEventStatistics(eventId, options = {}) {
    try {
      const { startDate, endDate, includeDetails = false, includeTrends = false } = options;

      // 基本統計
      const basicStats = await this.getBasicEventStats(eventId);

      // 参加者統計
      const participantStats = await this.getParticipantStats(eventId, { startDate, endDate });

      // 発表統計
      const talkStats = await this.getTalkStats(eventId);

      // 時系列データ（トレンド分析）
      let trends = null;
      if (includeTrends) {
        trends = await this.getEventTrends(eventId, { startDate, endDate });
      }

      // 詳細データ
      let details = null;
      if (includeDetails) {
        details = await this.getEventDetails(eventId);
      }

      return {
        eventId,
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate || null,
          endDate: endDate || null
        },
        statistics: {
          basic: basicStats,
          participants: participantStats,
          talks: talkStats
        },
        trends,
        details
      };
    } catch (error) {
      logger.error('Failed to get event statistics:', error);
      throw new Error('Failed to generate event statistics');
    }
  }

  /**
   * 基本イベント統計
   */
  async getBasicEventStats(eventId) {
    const stats = await this.db.query(
      `
      SELECT
        e.id,
        e.title,
        e.date,
        e.venue,
        e.status,
        COUNT(DISTINCT p.id) as total_participants,
        COUNT(DISTINCT t.id) as total_talks,
        COUNT(DISTINCT CASE WHEN p.participation_type = 'online' THEN p.id END) as online_participants,
        COUNT(DISTINCT CASE WHEN p.participation_type = 'offline' THEN p.id END) as offline_participants,
        COUNT(DISTINCT CASE WHEN t.status = 'confirmed' THEN t.id END) as confirmed_talks,
        COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) as pending_talks,
        AVG(CASE WHEN t.duration IS NOT NULL THEN t.duration END) as avg_talk_duration,
        MAX(p.created_at) as last_registration,
        MIN(p.created_at) as first_registration
      FROM events e
      LEFT JOIN participants p ON e.id = p.event_id
      LEFT JOIN talks t ON e.id = t.event_id
      WHERE e.id = ?
      GROUP BY e.id
    `,
      [eventId]
    );

    if (!stats || stats.length === 0) {
      throw new Error('Event not found');
    }

    const [event] = stats;

    return {
      eventInfo: {
        id: event.id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        status: event.status
      },
      summary: {
        totalParticipants: event.total_participants || 0,
        totalTalks: event.total_talks || 0,
        onlineParticipants: event.online_participants || 0,
        offlineParticipants: event.offline_participants || 0,
        confirmedTalks: event.confirmed_talks || 0,
        pendingTalks: event.pending_talks || 0,
        averageTalkDuration: parseFloat(event.avg_talk_duration) || 0,
        registrationPeriod: {
          first: event.first_registration,
          last: event.last_registration
        }
      }
    };
  }

  /**
   * 参加者統計
   */
  async getParticipantStats(eventId, options = {}) {
    const { startDate, endDate } = options;

    let dateFilter = '';
    const params = [eventId];

    if (startDate && endDate) {
      dateFilter = 'AND p.created_at BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // 参加者の基本分布
    const participantDistribution = await this.db.query(
      `
      SELECT
        participation_type,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM participants WHERE event_id = ?) as percentage
      FROM participants p
      WHERE event_id = ? ${dateFilter}
      GROUP BY participation_type
    `,
      params
    );

    // 時間別登録数
    const registrationTimeline = await this.db.query(
      `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as registrations,
        participation_type
      FROM participants p
      WHERE event_id = ? ${dateFilter}
      GROUP BY DATE(created_at), participation_type
      ORDER BY date
    `,
      params
    );

    // 地域別分布（optional field）
    const geographicDistribution = await this.db.query(
      `
      SELECT
        COALESCE(location, 'Unknown') as location,
        COUNT(*) as count
      FROM participants p
      WHERE event_id = ? ${dateFilter}
      GROUP BY location
      ORDER BY count DESC
    `,
      params
    );

    // 参加者の属性分析
    const attributeAnalysis = await this.db.query(
      `
      SELECT
        COALESCE(organization, 'Individual') as organization_type,
        COUNT(*) as count,
        AVG(CASE WHEN experience_level IS NOT NULL THEN
          CASE experience_level
            WHEN 'beginner' THEN 1
            WHEN 'intermediate' THEN 2
            WHEN 'advanced' THEN 3
            ELSE 2
          END
        END) as avg_experience_level
      FROM participants p
      WHERE event_id = ? ${dateFilter}
      GROUP BY organization_type
      ORDER BY count DESC
    `,
      params
    );

    return {
      distribution: {
        byType: participantDistribution.map(row => ({
          type: row.participation_type,
          count: row.count,
          percentage: parseFloat(row.percentage.toFixed(2))
        })),
        byLocation: geographicDistribution.map(row => ({
          location: row.location,
          count: row.count
        })),
        byOrganization: attributeAnalysis.map(row => ({
          organizationType: row.organization_type,
          count: row.count,
          averageExperienceLevel: parseFloat(row.avg_experience_level?.toFixed(2)) || 0
        }))
      },
      timeline: this.processRegistrationTimeline(registrationTimeline),
      summary: {
        totalRegistrations: participantDistribution.reduce((sum, row) => sum + row.count, 0),
        averagePerDay: this.calculateAveragePerDay(registrationTimeline),
        peakRegistrationDay: this.findPeakRegistrationDay(registrationTimeline)
      }
    };
  }

  /**
   * 発表統計
   */
  async getTalkStats(eventId) {
    // 発表の基本統計
    const talkDistribution = await this.db.query(
      `
      SELECT
        category,
        status,
        COUNT(*) as count,
        AVG(duration) as avg_duration,
        MIN(duration) as min_duration,
        MAX(duration) as max_duration
      FROM talks
      WHERE event_id = ?
      GROUP BY category, status
      ORDER BY category, status
    `,
      [eventId]
    );

    // 発表者の属性
    const speakerAnalysis = await this.db.query(
      `
      SELECT
        COUNT(DISTINCT speaker_name) as unique_speakers,
        COUNT(*) as total_talks,
        COUNT(*) * 1.0 / COUNT(DISTINCT speaker_name) as talks_per_speaker,
        COUNT(CASE WHEN experience_level = 'first_time' THEN 1 END) as first_time_speakers,
        COUNT(CASE WHEN experience_level = 'experienced' THEN 1 END) as experienced_speakers
      FROM talks
      WHERE event_id = ?
    `,
      [eventId]
    );

    // 申込み時系列
    const submissionTimeline = await this.db.query(
      `
      SELECT
        DATE(created_at) as date,
        COUNT(*) as submissions,
        status
      FROM talks
      WHERE event_id = ?
      GROUP BY DATE(created_at), status
      ORDER BY date
    `,
      [eventId]
    );

    // カテゴリ別人気度
    const categoryPopularity = await this.db.query(
      `
      SELECT
        category,
        COUNT(*) as count,
        COUNT(*) * 100.0 / (SELECT COUNT(*) FROM talks WHERE event_id = ?) as percentage,
        AVG(duration) as avg_duration
      FROM talks
      WHERE event_id = ?
      GROUP BY category
      ORDER BY count DESC
    `,
      [eventId, eventId]
    );

    const [speakerStats] = speakerAnalysis;

    return {
      distribution: {
        byCategory: categoryPopularity.map(row => ({
          category: row.category,
          count: row.count,
          percentage: parseFloat(row.percentage.toFixed(2)),
          averageDuration: parseFloat(row.avg_duration?.toFixed(1)) || 0
        })),
        byStatus: this.groupByStatus(talkDistribution)
      },
      speakers: {
        uniqueSpeakers: speakerStats.unique_speakers || 0,
        totalTalks: speakerStats.total_talks || 0,
        talksPerSpeaker: parseFloat(speakerStats.talks_per_speaker?.toFixed(2)) || 0,
        firstTimeSpeakers: speakerStats.first_time_speakers || 0,
        experiencedSpeakers: speakerStats.experienced_speakers || 0
      },
      timeline: this.processSubmissionTimeline(submissionTimeline),
      duration: {
        average: this.calculateAverageDuration(talkDistribution),
        distribution: this.analyzeDurationDistribution(talkDistribution)
      }
    };
  }

  /**
   * イベントトレンド分析
   */
  async getEventTrends(eventId, options = {}) {
    const { startDate, endDate } = options;

    // 日別登録数推移
    const dailyRegistrations = await this.getDailyRegistrations(eventId, { startDate, endDate });

    // 日別発表申込み推移
    const dailySubmissions = await this.getDailySubmissions(eventId, { startDate, endDate });

    // 参加タイプの推移
    const participationTypeTrends = await this.getParticipationTypeTrends(eventId, {
      startDate,
      endDate
    });

    // 予測データ（回帰分析）
    const predictions = this.calculatePredictions(dailyRegistrations, dailySubmissions);

    return {
      registrations: {
        daily: dailyRegistrations,
        cumulative: this.calculateCumulative(dailyRegistrations),
        predictions: predictions.registrations
      },
      submissions: {
        daily: dailySubmissions,
        cumulative: this.calculateCumulative(dailySubmissions),
        predictions: predictions.submissions
      },
      participationTypes: participationTypeTrends,
      insights: this.generateTrendInsights(
        dailyRegistrations,
        dailySubmissions,
        participationTypeTrends
      )
    };
  }

  /**
   * イベント詳細データ
   */
  async getEventDetails(eventId) {
    // 参加者詳細リスト
    const participantsList = await this.db.query(
      `
      SELECT
        id,
        name,
        email,
        participation_type,
        organization,
        location,
        experience_level,
        created_at
      FROM participants
      WHERE event_id = ?
      ORDER BY created_at DESC
    `,
      [eventId]
    );

    // 発表詳細リスト
    const talksList = await this.db.query(
      `
      SELECT
        id,
        title,
        speaker_name,
        speaker_email,
        category,
        duration,
        description,
        status,
        experience_level,
        created_at
      FROM talks
      WHERE event_id = ?
      ORDER BY created_at DESC
    `,
      [eventId]
    );

    // フィードバック集計
    const feedbackSummary = await this.getFeedbackSummary(eventId);

    return {
      participants: participantsList,
      talks: talksList,
      feedback: feedbackSummary,
      export: {
        participantsCsv: this.generateParticipantsCsv(participantsList),
        talksCsv: this.generateTalksCsv(talksList)
      }
    };
  }

  /**
   * 複数イベント比較分析
   */
  async compareEvents(eventIds, options = {}) {
    const comparisons = [];

    for (const eventId of eventIds) {
      const stats = await this.getEventStatistics(eventId, options);
      comparisons.push({
        eventId,
        title: stats.statistics.basic.eventInfo.title,
        date: stats.statistics.basic.eventInfo.date,
        metrics: {
          participants: stats.statistics.basic.summary.totalParticipants,
          talks: stats.statistics.basic.summary.totalTalks,
          onlineRatio:
            stats.statistics.participants.distribution.byType.find(t => t.type === 'online')
              ?.percentage || 0,
          avgTalkDuration: stats.statistics.basic.summary.averageTalkDuration
        }
      });
    }

    // 比較分析
    const analysis = this.analyzeEventComparisons(comparisons);

    return {
      events: comparisons,
      analysis,
      insights: this.generateComparisonInsights(comparisons, analysis)
    };
  }

  /**
   * レポート生成
   */
  async generateReport(eventId, reportType, options = {}) {
    try {
      const stats = await this.getEventStatistics(eventId, {
        includeDetails: true,
        includeTrends: true,
        ...options
      });

      switch (reportType) {
        case 'summary':
          return this.generateSummaryReport(stats);
        case 'detailed':
          return this.generateDetailedReport(stats);
        case 'executive':
          return this.generateExecutiveReport(stats);
        case 'participant':
          return this.generateParticipantReport(stats);
        case 'speaker':
          return this.generateSpeakerReport(stats);
        default:
          throw new Error('Invalid report type');
      }
    } catch (error) {
      logger.error('Failed to generate report:', error);
      throw new Error('Failed to generate report');
    }
  }

  // ヘルパーメソッド

  processRegistrationTimeline(timeline) {
    const processed = {};
    timeline.forEach(row => {
      if (!processed[row.date]) {
        processed[row.date] = { date: row.date, online: 0, offline: 0, total: 0 };
      }
      processed[row.date][row.participation_type] = row.registrations;
      processed[row.date].total += row.registrations;
    });
    return Object.values(processed);
  }

  processSubmissionTimeline(timeline) {
    const processed = {};
    timeline.forEach(row => {
      if (!processed[row.date]) {
        processed[row.date] = { date: row.date, confirmed: 0, pending: 0, total: 0 };
      }
      processed[row.date][row.status] = row.submissions;
      processed[row.date].total += row.submissions;
    });
    return Object.values(processed);
  }

  groupByStatus(distribution) {
    const statusGroups = {};
    distribution.forEach(row => {
      if (!statusGroups[row.status]) {
        statusGroups[row.status] = [];
      }
      statusGroups[row.status].push({
        category: row.category,
        count: row.count,
        averageDuration: parseFloat(row.avg_duration?.toFixed(1)) || 0
      });
    });
    return statusGroups;
  }

  calculateAveragePerDay(timeline) {
    if (!timeline.length) {
      return 0;
    }
    const totalDays = new Set(timeline.map(row => row.date)).size;
    const totalRegistrations = timeline.reduce((sum, row) => sum + row.registrations, 0);
    return parseFloat((totalRegistrations / totalDays).toFixed(2));
  }

  findPeakRegistrationDay(timeline) {
    if (!timeline || !timeline.length) {
      return null;
    }
    return timeline.reduce((peak, current) =>
      current.registrations > peak.registrations ? current : peak
    );
  }

  calculateAverageDuration(distribution) {
    let totalDuration = 0;
    let totalCount = 0;

    distribution.forEach(row => {
      if (row.avg_duration) {
        totalDuration += row.avg_duration * row.count;
        totalCount += row.count;
      }
    });

    return totalCount > 0 ? parseFloat((totalDuration / totalCount).toFixed(1)) : 0;
  }

  analyzeDurationDistribution(distribution) {
    const durations = {};
    distribution.forEach(row => {
      const duration = Math.round(row.avg_duration / 5) * 5; // 5分単位で丸める
      durations[`${duration}min`] = (durations[`${duration}min`] || 0) + row.count;
    });
    return durations;
  }

  calculateCumulative(dailyData) {
    let cumulative = 0;
    return dailyData.map(day => ({
      date: day.date,
      value: (cumulative += day.value || day.registrations || day.submissions || 0)
    }));
  }

  calculatePredictions(registrations, submissions) {
    // 簡易線形回帰による予測
    return {
      registrations: this.linearRegression(registrations),
      submissions: this.linearRegression(submissions)
    };
  }

  linearRegression(data) {
    if (data.length < 2) {
      return { nextWeek: 0, confidence: 0 };
    }

    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.value || d.registrations || d.submissions || 0);

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const nextWeekPrediction = slope * (n + 7) + intercept;

    return {
      nextWeek: Math.max(0, Math.round(nextWeekPrediction)),
      confidence: this.calculateConfidence(data, slope, intercept)
    };
  }

  calculateConfidence(data, slope, intercept) {
    // R²値の計算
    const y = data.map(d => d.value || d.registrations || d.submissions || 0);
    const yMean = y.reduce((a, b) => a + b, 0) / y.length;

    let ssRes = 0;
    let ssTot = 0;

    y.forEach((yi, i) => {
      const predicted = slope * i + intercept;
      ssRes += Math.pow(yi - predicted, 2);
      ssTot += Math.pow(yi - yMean, 2);
    });

    const rSquared = 1 - ssRes / ssTot;
    return Math.max(0, Math.min(1, rSquared));
  }

  generateTrendInsights(registrations, _submissions, _participationTypes) {
    const insights = [];

    // 登録トレンド分析
    if (registrations.length > 1) {
      const recent = registrations.slice(-7);
      const earlier = registrations.slice(-14, -7);
      const recentAvg = recent.reduce((sum, d) => sum + d.registrations, 0) / recent.length;
      const earlierAvg = earlier.reduce((sum, d) => sum + d.registrations, 0) / earlier.length;

      if (recentAvg > earlierAvg * 1.2) {
        insights.push({
          type: 'positive',
          message: '登録数が増加傾向にあります',
          metric: 'registrations',
          change: (((recentAvg - earlierAvg) / earlierAvg) * 100).toFixed(1)
        });
      } else if (recentAvg < earlierAvg * 0.8) {
        insights.push({
          type: 'warning',
          message: '登録数が減少傾向にあります',
          metric: 'registrations',
          change: (((recentAvg - earlierAvg) / earlierAvg) * 100).toFixed(1)
        });
      }
    }

    return insights;
  }

  analyzeEventComparisons(comparisons) {
    const metrics = ['participants', 'talks', 'onlineRatio', 'avgTalkDuration'];
    const analysis = {};

    metrics.forEach(metric => {
      const values = comparisons.map(c => c.metrics[metric]);
      analysis[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        standardDeviation: this.calculateStandardDeviation(values)
      };
    });

    return analysis;
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }

  generateComparisonInsights(comparisons, _analysis) {
    const insights = [];

    // 参加者数の分析
    const participantValues = comparisons.map(c => c.metrics.participants);
    const maxParticipants = Math.max(...participantValues);
    const bestEvent = comparisons.find(c => c.metrics.participants === maxParticipants);

    insights.push({
      type: 'highlight',
      message: `最も参加者が多かったのは「${bestEvent.title}」で${maxParticipants}名でした`,
      category: 'participation'
    });

    return insights;
  }

  generateSummaryReport(stats) {
    return {
      type: 'summary',
      title: `${stats.statistics.basic.eventInfo.title} - サマリーレポート`,
      generatedAt: new Date().toISOString(),
      keyMetrics: {
        participants: stats.statistics.basic.summary.totalParticipants,
        talks: stats.statistics.basic.summary.totalTalks,
        onlineRatio:
          stats.statistics.participants.distribution.byType.find(t => t.type === 'online')
            ?.percentage || 0
      },
      highlights: [
        `総参加者数: ${stats.statistics.basic.summary.totalParticipants}名`,
        `総発表数: ${stats.statistics.basic.summary.totalTalks}件`,
        `オンライン参加率: ${
          stats.statistics.participants.distribution.byType.find(t => t.type === 'online')
            ?.percentage || 0
        }%`
      ]
    };
  }

  async getDailyRegistrations(eventId, options = {}) {
    const { startDate, endDate } = options;
    let dateFilter = '';
    const params = [eventId];

    if (startDate && endDate) {
      dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    try {
      const results = await this.db.query(
        `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as registrations
        FROM participants
        WHERE event_id = ? ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
        params
      );
      return results || [];
    } catch (error) {
      logger.error('Failed to get daily registrations:', error);
      return [];
    }
  }

  async getDailySubmissions(eventId, options = {}) {
    const { startDate, endDate } = options;
    let dateFilter = '';
    const params = [eventId];

    if (startDate && endDate) {
      dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    try {
      const results = await this.db.query(
        `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as submissions
        FROM talks
        WHERE event_id = ? ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
        params
      );
      return results || [];
    } catch (error) {
      logger.error('Failed to get daily submissions:', error);
      return [];
    }
  }

  async getParticipationTypeTrends(eventId, options = {}) {
    const { startDate, endDate } = options;
    let dateFilter = '';
    const params = [eventId];

    if (startDate && endDate) {
      dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    try {
      const results = await this.db.query(
        `
        SELECT
          DATE(created_at) as date,
          participation_type,
          COUNT(*) as count
        FROM participants
        WHERE event_id = ? ${dateFilter}
        GROUP BY DATE(created_at), participation_type
        ORDER BY date, participation_type
      `,
        params
      );
      return results || [];
    } catch (error) {
      logger.error('Failed to get participation type trends:', error);
      return [];
    }
  }

  async getFeedbackSummary(eventId) {
    try {
      const results = await this.db.query(
        `
        SELECT
          rating,
          COUNT(*) as count,
          AVG(rating) as average_rating
        FROM feedback
        WHERE event_id = ?
        GROUP BY rating
        ORDER BY rating
      `,
        [eventId]
      );

      return {
        totalFeedback: results.reduce((sum, r) => sum + r.count, 0),
        averageRating:
          results.length > 0
            ? results.reduce((sum, r) => sum + r.rating * r.count, 0) /
              results.reduce((sum, r) => sum + r.count, 0)
            : 0,
        distribution: results
      };
    } catch (error) {
      logger.error('Failed to get feedback summary:', error);
      return {
        totalFeedback: 0,
        averageRating: 0,
        distribution: []
      };
    }
  }

  generateParticipantsCsv(participants) {
    if (!participants || participants.length === 0) {
      return 'No participants data available';
    }

    const headers = [
      'ID',
      'Name',
      'Email',
      'Participation Type',
      'Organization',
      'Location',
      'Experience Level',
      'Created At'
    ];
    const csvRows = [headers.join(',')];

    participants.forEach(p => {
      const row = [
        p.id,
        `"${p.name || ''}"`,
        `"${p.email || ''}"`,
        p.participation_type || '',
        `"${p.organization || ''}"`,
        `"${p.location || ''}"`,
        p.experience_level || '',
        p.created_at || ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  generateTalksCsv(talks) {
    if (!talks || talks.length === 0) {
      return 'No talks data available';
    }

    const headers = [
      'ID',
      'Title',
      'Speaker Name',
      'Speaker Email',
      'Category',
      'Duration',
      'Status',
      'Experience Level',
      'Created At'
    ];
    const csvRows = [headers.join(',')];

    talks.forEach(t => {
      const row = [
        t.id,
        `"${t.title || ''}"`,
        `"${t.speaker_name || ''}"`,
        `"${t.speaker_email || ''}"`,
        t.category || '',
        t.duration || '',
        t.status || '',
        t.experience_level || '',
        t.created_at || ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  generateDetailedReport(stats) {
    return {
      type: 'detailed',
      title: `${stats.statistics.basic.eventInfo.title} - 詳細レポート`,
      generatedAt: new Date().toISOString(),
      sections: {
        eventOverview: stats.statistics.basic,
        participantAnalysis: stats.statistics.participants,
        talkAnalysis: stats.statistics.talks,
        trends: stats.trends,
        details: stats.details
      },
      recommendations: this.generateRecommendations(stats)
    };
  }

  generateExecutiveReport(stats) {
    return {
      type: 'executive',
      title: `${stats.statistics.basic.eventInfo.title} - エグゼクティブサマリー`,
      generatedAt: new Date().toISOString(),
      executiveSummary: {
        totalParticipants: stats.statistics.basic.summary.totalParticipants,
        totalTalks: stats.statistics.basic.summary.totalTalks,
        successMetrics: {
          participationRate: this.calculateParticipationRate(stats),
          engagementScore: this.calculateEngagementScore(stats),
          contentQuality: this.calculateContentQuality(stats)
        }
      },
      keyInsights: this.generateKeyInsights(stats),
      actionItems: this.generateActionItems(stats)
    };
  }

  generateParticipantReport(stats) {
    return {
      type: 'participant',
      title: `${stats.statistics.basic.eventInfo.title} - 参加者レポート`,
      generatedAt: new Date().toISOString(),
      participantMetrics: stats.statistics.participants,
      demographics: {
        byType: stats.statistics.participants.distribution.byType,
        byLocation: stats.statistics.participants.distribution.byLocation,
        byOrganization: stats.statistics.participants.distribution.byOrganization
      },
      registrationTrends: stats.trends?.registrations,
      participantList: stats.details?.participants
    };
  }

  generateSpeakerReport(stats) {
    return {
      type: 'speaker',
      title: `${stats.statistics.basic.eventInfo.title} - 発表者レポート`,
      generatedAt: new Date().toISOString(),
      speakerMetrics: stats.statistics.talks.speakers,
      talkDistribution: stats.statistics.talks.distribution,
      contentAnalysis: {
        categoryDistribution: stats.statistics.talks.distribution.byCategory,
        durationAnalysis: stats.statistics.talks.duration
      },
      submissionTrends: stats.trends?.submissions,
      speakerList: stats.details?.talks
    };
  }

  // Additional helper methods for reports
  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.statistics.basic.summary.totalParticipants < 50) {
      recommendations.push({
        type: 'marketing',
        priority: 'high',
        message: '参加者数を増やすためのマーケティング強化を推奨します'
      });
    }

    if (stats.statistics.basic.summary.totalTalks < 10) {
      recommendations.push({
        type: 'content',
        priority: 'medium',
        message: '発表者の募集活動を強化することを推奨します'
      });
    }

    return recommendations;
  }

  calculateParticipationRate(stats) {
    const registered = stats.statistics.basic.summary.totalParticipants;
    const capacity = 100; // Assumed capacity
    return Math.min(100, (registered / capacity) * 100);
  }

  calculateEngagementScore(stats) {
    const talks = stats.statistics.basic.summary.totalTalks;
    const participants = stats.statistics.basic.summary.totalParticipants;
    return participants > 0 ? Math.min(100, (talks / participants) * 100) : 0;
  }

  calculateContentQuality(stats) {
    const confirmedTalks = stats.statistics.basic.summary.confirmedTalks;
    const totalTalks = stats.statistics.basic.summary.totalTalks;
    return totalTalks > 0 ? (confirmedTalks / totalTalks) * 100 : 0;
  }

  generateKeyInsights(stats) {
    const insights = [];

    const onlineParticipants =
      stats.statistics.participants.distribution.byType.find(t => t.type === 'online')?.count || 0;
    const totalParticipants = stats.statistics.basic.summary.totalParticipants;

    if (totalParticipants > 0) {
      const onlineRatio = (onlineParticipants / totalParticipants) * 100;
      insights.push(`オンライン参加者が${onlineRatio.toFixed(1)}%を占めています`);
    }

    return insights;
  }

  generateActionItems(stats) {
    const actionItems = [];

    if (stats.statistics.basic.summary.pendingTalks > 0) {
      actionItems.push({
        action: '保留中の発表申込みを確認し、承認プロセスを進める',
        priority: 'high',
        count: stats.statistics.basic.summary.pendingTalks
      });
    }

    return actionItems;
  }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
export { AnalyticsService };
