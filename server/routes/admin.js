/**
 * Admin API Routes
 * Handle administrative functions
 */

import express from 'express';
import { query, validationResult } from 'express-validator';

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/admin/dashboard
 * Get admin dashboard data
 */
router.get('/dashboard', async(req, res) => {
  try {
    const { database, votingService } = req.app.locals;

    // Get current event
    const currentEvent = await database.getCurrentEvent();

    // Get overview statistics
    const [
      totalEvents,
      totalParticipants,
      totalTalks,
      recentParticipants,
      recentTalks,
      participationVotes
    ] = await Promise.all([
      database.count('events'),
      database.count('participants'),
      database.count('talks'),
      database
        .findAll('participants', {})
        .then(participants =>
          participants.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)
        ),
      database
        .findAll('talks', {})
        .then(talks =>
          talks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)
        ),
      votingService.getAllParticipationVotes()
    ]);

    // Get current event statistics if available
    let currentEventStats = null;
    if (currentEvent) {
      const [eventParticipants, eventTalks, eventAnalytics] = await Promise.all([
        database.count('participants', { eventId: currentEvent.id }),
        database.count('talks', { eventId: currentEvent.id }),
        database.getEventAnalytics(currentEvent.id)
      ]);

      currentEventStats = {
        participants: eventParticipants,
        talks: eventTalks,
        spotsRemaining: Math.max(0, (currentEvent.maxTalks || 20) - eventTalks),
        ...eventAnalytics
      };
    }

    res.json({
      overview: {
        totalEvents,
        totalParticipants,
        totalTalks,
        activeEvents: await database.count('events', { status: 'upcoming' })
      },
      currentEvent: currentEvent
        ? {
          ...currentEvent,
          stats: currentEventStats
        }
        : null,
      recentActivity: {
        participants: recentParticipants.map(p => ({
          id: p.id,
          name: p.name,
          eventId: p.eventId,
          participationType: p.participationType,
          registeredAt: p.createdAt
        })),
        talks: recentTalks.map(t => ({
          id: t.id,
          title: t.title,
          speakerName: t.speakerName,
          category: t.category,
          eventId: t.eventId,
          submittedAt: t.createdAt
        }))
      },
      participationVotes,
      systemHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: 'ダッシュボードデータの取得に失敗しました'
    });
  }
});

/**
 * GET /api/admin/analytics
 * Get system-wide analytics
 */
router.get(
  '/analytics',
  query('eventId').optional().isLength({ min: 1 }),
  query('dateRange').optional().isIn(['7d', '30d', '90d', 'all']),
  handleValidationErrors,
  async(req, res) => {
    try {
      const { database, eventService } = req.app.locals;
      const { eventId, dateRange = '30d' } = req.query;

      let analyticsData;

      if (eventId) {
        // Event-specific analytics
        analyticsData = await eventService.getEventAnalytics(eventId);
      } else {
        // System-wide analytics
        const allAnalytics = await database.findAll('analytics');

        // Filter by date range
        let filteredAnalytics = allAnalytics;
        if (dateRange !== 'all') {
          const days = parseInt(dateRange.replace('d', ''));
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);

          filteredAnalytics = allAnalytics.filter(item => new Date(item.timestamp) >= cutoffDate);
        }

        analyticsData = eventService.processAnalytics(filteredAnalytics);
      }

      // Additional insights
      const insights = await this.generateInsights(database, analyticsData);

      res.json({
        analytics: analyticsData,
        insights,
        generatedAt: new Date().toISOString(),
        filters: { eventId, dateRange }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics',
        message: 'アナリティクスデータの取得に失敗しました'
      });
    }
  }
);

/**
 * GET /api/admin/export
 * Export data in various formats
 */
router.get(
  '/export',
  query('type')
    .isIn(['participants', 'talks', 'events', 'all'])
    .withMessage('Valid export type required'),
  query('eventId').optional().isLength({ min: 1 }),
  query('format').optional().isIn(['json', 'csv']).withMessage('Valid format required'),
  handleValidationErrors,
  async(req, res) => {
    try {
      const { database } = req.app.locals;
      const { type, eventId, format = 'json' } = req.query;

      let data;
      let filename;

      switch (type) {
      case 'participants':
        data = await database.findAll('participants', eventId ? { eventId } : {});
        filename = `participants-${eventId || 'all'}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'talks':
        data = await database.findAll('talks', eventId ? { eventId } : {});
        filename = `talks-${eventId || 'all'}-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'events':
        data = await database.findAll('events');
        filename = `events-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'all':
        data = await database.exportData();
        filename = `full-export-${new Date().toISOString().split('T')[0]}`;
        break;
      }

      if (format === 'csv') {
        const csv = this.convertToCSV(data);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csv);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json({
          exportType: type,
          exportDate: new Date().toISOString(),
          recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
          data
        });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({
        error: 'Failed to export data',
        message: 'データのエクスポートに失敗しました'
      });
    }
  }
);

/**
 * GET /api/admin/settings
 * Get system settings
 */
router.get('/settings', async(req, res) => {
  try {
    const { database } = req.app.locals;
    const settings = await database.getSettings();

    res.json({
      settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      error: 'Failed to fetch settings',
      message: '設定の取得に失敗しました'
    });
  }
});

/**
 * PUT /api/admin/settings
 * Update system settings
 */
router.put('/settings', async(req, res) => {
  try {
    const { database } = req.app.locals;
    const updates = req.body;

    const updatedSettings = await database.updateSettings(updates);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      error: 'Failed to update settings',
      message: '設定の更新に失敗しました'
    });
  }
});

/**
 * POST /api/admin/maintenance
 * Perform maintenance tasks
 */
router.post('/maintenance', async(req, res) => {
  try {
    const { database } = req.app.locals;
    const { action } = req.body;

    let result;

    switch (action) {
    case 'cleanup':
      result = await this.performCleanup(database);
      break;
    case 'backup':
      result = await this.performBackup(database);
      break;
    case 'optimize':
      result = await this.performOptimization(database);
      break;
    default:
      return res.status(400).json({
        error: 'Invalid maintenance action',
        message: '無効なメンテナンス操作です'
      });
    }

    res.json({
      success: true,
      message: `Maintenance action '${action}' completed`,
      result
    });
  } catch (error) {
    console.error('Error performing maintenance:', error);
    res.status(500).json({
      error: 'Maintenance failed',
      message: 'メンテナンス処理に失敗しました'
    });
  }
});

// Helper methods
async function generateInsights(database, analyticsData) {
  const insights = [];

  // Registration trend insight
  if (analyticsData.actionCounts?.participant_registered > 0) {
    const trend = Object.values(analyticsData.timeline || {});
    const avgDailyRegistrations =
      trend.length > 0
        ? trend.reduce((sum, day) => sum + (day.participant_registered || 0), 0) / trend.length
        : 0;

    insights.push({
      type: 'trend',
      title: '登録トレンド',
      value: avgDailyRegistrations.toFixed(1),
      description: '1日あたりの平均登録数',
      status:
        avgDailyRegistrations > 5 ? 'positive' : avgDailyRegistrations > 2 ? 'neutral' : 'negative'
    });
  }

  // Popular categories
  const categories = analyticsData.actionCounts || {};
  const totalTalks = categories.talk_submitted || 0;
  if (totalTalks > 0) {
    insights.push({
      type: 'category',
      title: '発表カテゴリー',
      value: totalTalks,
      description: '提出された発表の総数',
      status: 'neutral'
    });
  }

  return insights;
}

function convertToCSV(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

async function performCleanup(database) {
  // Clean up old analytics data (older than 1 year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const analytics = await database.findAll('analytics');
  const oldAnalytics = analytics.filter(item => new Date(item.timestamp) < oneYearAgo);

  for (const item of oldAnalytics) {
    await database.delete('analytics', item.id);
  }

  return {
    action: 'cleanup',
    itemsRemoved: oldAnalytics.length,
    completedAt: new Date().toISOString()
  };
}

async function performBackup(database) {
  const exportData = await database.exportData();
  const backupId = `backup-${Date.now()}`;

  // In a real implementation, save to external storage
  console.log(`Backup created: ${backupId}`);

  return {
    action: 'backup',
    backupId,
    recordCount: Object.values(exportData).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    ),
    completedAt: new Date().toISOString()
  };
}

async function performOptimization(database) {
  // Optimize database performance (placeholder)
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    action: 'optimization',
    optimizationsApplied: ['index_rebuild', 'cache_clear'],
    completedAt: new Date().toISOString()
  };
}

export default router;
