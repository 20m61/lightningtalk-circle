import { jest } from '@jest/globals';
/**
 * Analytics Service Unit Tests
 * 分析サービスの単体テスト
 */

// Mock logger before importing
jest.unstable_mockModule('../../../server/utils/logger.js', () => ({
  createLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}));

// Mock DatabaseService
jest.unstable_mockModule('../../../server/services/database.js', () => ({
  DatabaseService: {
    getInstance: jest.fn().mockReturnValue({
      query: jest.fn()
    })
  }
}));

// Import the class
import { AnalyticsService } from '../../../server/services/analyticsService.js';

describe('AnalyticsService', () => {
  let analyticsService;
  let mockDatabase;

  beforeEach(() => {
    // データベースのモックを設定
    mockDatabase = {
      query: jest.fn()
    };

    // Create a new instance for each test
    analyticsService = new AnalyticsService();
    analyticsService.db = mockDatabase;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventStatistics', () => {
    it('should return basic event statistics', async () => {
      const eventId = 'event-001';
      // eslint-disable-next-line no-unused-vars
      const mockBasicStats = {
        id: 'event-001',
        title: 'Test Event',
        total_participants: 25,
        total_talks: 8,
        online_participants: 15,
        offline_participants: 10
      };

      analyticsService.getBasicEventStats = jest.fn().mockResolvedValue({
        eventInfo: {
          id: eventId,
          title: 'Test Event'
        },
        summary: {
          totalParticipants: 25,
          totalTalks: 8,
          onlineParticipants: 15,
          offlineParticipants: 10
        }
      });

      analyticsService.getParticipantStats = jest.fn().mockResolvedValue({
        distribution: {
          byType: [
            { type: 'online', count: 15, percentage: 60 },
            { type: 'offline', count: 10, percentage: 40 }
          ]
        }
      });

      analyticsService.getTalkStats = jest.fn().mockResolvedValue({
        distribution: {
          byCategory: [
            { category: '技術', count: 5, percentage: 62.5 },
            { category: '趣味', count: 3, percentage: 37.5 }
          ]
        }
      });

      const result = await analyticsService.getEventStatistics(eventId);

      expect(result).toHaveProperty('eventId', eventId);
      expect(result).toHaveProperty('generatedAt');
      expect(result.statistics.basic.summary.totalParticipants).toBe(25);
      expect(result.statistics.basic.summary.totalTalks).toBe(8);
    });

    it('should include trends when requested', async () => {
      const eventId = 'event-001';
      const options = { includeTrends: true };

      analyticsService.getBasicEventStats = jest.fn().mockResolvedValue({
        eventInfo: { id: eventId },
        summary: { totalParticipants: 25 }
      });
      analyticsService.getParticipantStats = jest.fn().mockResolvedValue({ distribution: {} });
      analyticsService.getTalkStats = jest.fn().mockResolvedValue({ distribution: {} });
      analyticsService.getEventTrends = jest.fn().mockResolvedValue({
        registrations: {
          daily: [{ date: '2025-06-20', count: 5 }],
          cumulative: [{ date: '2025-06-20', total: 5 }]
        }
      });

      const result = await analyticsService.getEventStatistics(eventId, options);

      expect(result.trends).toBeDefined();
      expect(analyticsService.getEventTrends).toHaveBeenCalledWith(eventId, {
        startDate: undefined,
        endDate: undefined
      });
    });

    it('should handle errors gracefully', async () => {
      const eventId = 'invalid-event';

      analyticsService.getBasicEventStats = jest
        .fn()
        .mockRejectedValue(new Error('Event not found'));

      await expect(analyticsService.getEventStatistics(eventId)).rejects.toThrow(
        'Failed to generate event statistics'
      );
    });
  });

  describe('getBasicEventStats', () => {
    it('should query and return basic event statistics', async () => {
      const eventId = 'event-001';
      const mockQueryResult = [
        {
          id: 'event-001',
          title: 'Test Event',
          date: '2025-06-25T19:00:00Z',
          venue: 'Test Venue',
          status: 'upcoming',
          total_participants: 25,
          total_talks: 8,
          online_participants: 15,
          offline_participants: 10,
          confirmed_talks: 6,
          pending_talks: 2,
          avg_talk_duration: 5.5
        }
      ];

      mockDatabase.query.mockResolvedValue(mockQueryResult);

      const result = await analyticsService.getBasicEventStats(eventId);

      expect(result.eventInfo.id).toBe(eventId);
      expect(result.eventInfo.title).toBe('Test Event');
      expect(result.summary.totalParticipants).toBe(25);
      expect(result.summary.totalTalks).toBe(8);
      expect(result.summary.onlineParticipants).toBe(15);
      expect(result.summary.offlineParticipants).toBe(10);
      expect(mockDatabase.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), [eventId]);
    });

    it('should throw error when event not found', async () => {
      const eventId = 'nonexistent';
      mockDatabase.query.mockResolvedValue([]);

      await expect(analyticsService.getBasicEventStats(eventId)).rejects.toThrow('Event not found');
    });
  });

  describe('getParticipantStats', () => {
    it('should return participant distribution statistics', async () => {
      const eventId = 'event-001';
      const mockDistribution = [
        { participation_type: 'online', count: 15, percentage: 60.0 },
        { participation_type: 'offline', count: 10, percentage: 40.0 }
      ];
      const mockTimeline = [
        { date: '2025-06-20', registrations: 5, participation_type: 'online' },
        { date: '2025-06-20', registrations: 3, participation_type: 'offline' }
      ];
      const mockGeographic = [
        { location: '東京都', count: 12 },
        { location: '大阪府', count: 8 }
      ];
      const mockAttributes = [
        { organization_type: 'Individual', count: 18, avg_experience_level: 2.1 },
        { organization_type: 'Company', count: 7, avg_experience_level: 2.8 }
      ];

      mockDatabase.query
        .mockResolvedValueOnce(mockDistribution)
        .mockResolvedValueOnce(mockTimeline)
        .mockResolvedValueOnce(mockGeographic)
        .mockResolvedValueOnce(mockAttributes);

      analyticsService.processRegistrationTimeline = jest
        .fn()
        .mockReturnValue([{ date: '2025-06-20', online: 5, offline: 3, total: 8 }]);
      analyticsService.calculateAveragePerDay = jest.fn().mockReturnValue(4.2);
      analyticsService.findPeakRegistrationDay = jest.fn().mockReturnValue({
        date: '2025-06-20',
        registrations: 8
      });

      const result = await analyticsService.getParticipantStats(eventId);

      expect(result.distribution.byType).toHaveLength(2);
      expect(result.distribution.byType[0].type).toBe('online');
      expect(result.distribution.byType[0].count).toBe(15);
      expect(result.distribution.byType[0].percentage).toBe(60);
      expect(result.timeline).toHaveLength(1);
      expect(result.summary.averagePerDay).toBe(4.2);
    });
  });

  describe('getTalkStats', () => {
    it('should return talk distribution and speaker statistics', async () => {
      const eventId = 'event-001';
      const mockTalkDistribution = [
        { category: '技術', status: 'confirmed', count: 5, avg_duration: 5.2 },
        { category: '趣味', status: 'confirmed', count: 3, avg_duration: 4.8 }
      ];
      const mockSpeakerAnalysis = [
        {
          unique_speakers: 8,
          total_talks: 8,
          talks_per_speaker: 1.0,
          first_time_speakers: 3,
          experienced_speakers: 5
        }
      ];
      const mockSubmissionTimeline = [
        { date: '2025-06-15', submissions: 3, status: 'confirmed' },
        { date: '2025-06-16', submissions: 2, status: 'pending' }
      ];
      const mockCategoryPopularity = [
        { category: '技術', count: 5, percentage: 62.5, avg_duration: 5.2 },
        { category: '趣味', count: 3, percentage: 37.5, avg_duration: 4.8 }
      ];

      mockDatabase.query
        .mockResolvedValueOnce(mockTalkDistribution)
        .mockResolvedValueOnce(mockSpeakerAnalysis)
        .mockResolvedValueOnce(mockSubmissionTimeline)
        .mockResolvedValueOnce(mockCategoryPopularity);

      analyticsService.groupByStatus = jest.fn().mockReturnValue({
        confirmed: [
          { category: '技術', count: 5, averageDuration: 5.2 },
          { category: '趣味', count: 3, averageDuration: 4.8 }
        ]
      });
      analyticsService.processSubmissionTimeline = jest
        .fn()
        .mockReturnValue([{ date: '2025-06-15', confirmed: 3, pending: 0, total: 3 }]);
      analyticsService.calculateAverageDuration = jest.fn().mockReturnValue(5.0);
      analyticsService.analyzeDurationDistribution = jest.fn().mockReturnValue({
        '5min': 6,
        '10min': 2
      });

      const result = await analyticsService.getTalkStats(eventId);

      expect(result.distribution.byCategory).toHaveLength(2);
      expect(result.distribution.byCategory[0].category).toBe('技術');
      expect(result.speakers.uniqueSpeakers).toBe(8);
      expect(result.speakers.totalTalks).toBe(8);
      expect(result.speakers.firstTimeSpeakers).toBe(3);
      expect(result.duration.average).toBe(5.0);
    });
  });

  describe('generateReport', () => {
    it('should generate summary report', async () => {
      const eventId = 'event-001';
      const reportType = 'summary';
      const mockStats = {
        statistics: {
          basic: {
            eventInfo: {
              title: 'Test Event'
            },
            summary: {
              totalParticipants: 25,
              totalTalks: 8
            }
          },
          participants: {
            distribution: {
              byType: [{ type: 'online', percentage: 60 }]
            }
          }
        }
      };

      analyticsService.getEventStatistics = jest.fn().mockResolvedValue(mockStats);
      analyticsService.generateSummaryReport = jest.fn().mockReturnValue({
        type: 'summary',
        title: 'Test Event - サマリーレポート',
        keyMetrics: {
          participants: 25,
          talks: 8,
          onlineRatio: 60
        }
      });

      const result = await analyticsService.generateReport(eventId, reportType);

      expect(result.type).toBe('summary');
      expect(result.keyMetrics.participants).toBe(25);
      expect(analyticsService.getEventStatistics).toHaveBeenCalledWith(
        eventId,
        expect.objectContaining({
          includeDetails: true,
          includeTrends: true
        })
      );
    });

    it('should throw error for invalid report type', async () => {
      const eventId = 'event-001';
      const reportType = 'invalid';

      analyticsService.getEventStatistics = jest.fn().mockResolvedValue({});

      await expect(analyticsService.generateReport(eventId, reportType)).rejects.toThrow(
        'Failed to generate report'
      );
    });
  });

  describe('helper methods', () => {
    describe('processRegistrationTimeline', () => {
      it('should process timeline data correctly', () => {
        const timeline = [
          { date: '2025-06-20', registrations: 5, participation_type: 'online' },
          { date: '2025-06-20', registrations: 3, participation_type: 'offline' },
          { date: '2025-06-21', registrations: 7, participation_type: 'online' }
        ];

        const result = analyticsService.processRegistrationTimeline(timeline);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          date: '2025-06-20',
          online: 5,
          offline: 3,
          total: 8
        });
        expect(result[1]).toEqual({
          date: '2025-06-21',
          online: 7,
          offline: 0,
          total: 7
        });
      });
    });

    describe('calculateAveragePerDay', () => {
      it('should calculate average registrations per day', () => {
        const timeline = [
          { date: '2025-06-20', registrations: 5 },
          { date: '2025-06-21', registrations: 7 },
          { date: '2025-06-21', registrations: 3 }
        ];

        const result = analyticsService.calculateAveragePerDay(timeline);

        expect(result).toBe(7.5); // 15 registrations / 2 unique days
      });

      it('should return 0 for empty timeline', () => {
        const result = analyticsService.calculateAveragePerDay([]);
        expect(result).toBe(0);
      });
    });

    describe('findPeakRegistrationDay', () => {
      it('should find day with highest registrations', () => {
        const timeline = [
          { date: '2025-06-20', registrations: 5 },
          { date: '2025-06-21', registrations: 12 },
          { date: '2025-06-22', registrations: 7 }
        ];

        const result = analyticsService.findPeakRegistrationDay(timeline);

        expect(result).toEqual({
          date: '2025-06-21',
          registrations: 12
        });
      });

      it('should return null for empty timeline', () => {
        const result = analyticsService.findPeakRegistrationDay([]);
        expect(result).toBeNull();
      });
    });

    describe('linearRegression', () => {
      it('should calculate linear regression for predictions', () => {
        const data = [{ value: 2 }, { value: 4 }, { value: 6 }, { value: 8 }];

        const result = analyticsService.linearRegression(data);

        expect(result).toHaveProperty('nextWeek');
        expect(result).toHaveProperty('confidence');
        expect(result.nextWeek).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });

      it('should handle insufficient data', () => {
        const data = [{ value: 5 }];

        const result = analyticsService.linearRegression(data);

        expect(result.nextWeek).toBe(0);
        expect(result.confidence).toBe(0);
      });
    });
  });

  describe('performance tests', () => {
    it('should handle large datasets efficiently', async () => {
      const eventId = 'large-event';
      const largeDatasetDistribution = [
        { participation_type: 'online', count: 500, percentage: 50.0 },
        { participation_type: 'offline', count: 500, percentage: 50.0 }
      ];
      const largeDatasetTimeline = Array.from({ length: 100 }, (_, i) => ({
        date: `2025-06-${20 + (i % 7)}`,
        registrations: Math.floor(Math.random() * 10) + 1,
        participation_type: i % 2 === 0 ? 'online' : 'offline'
      }));
      const largeDatasetGeographic = [
        { location: '東京都', count: 600 },
        { location: '大阪府', count: 400 }
      ];
      const largeDatasetAttributes = [
        { organization_type: 'Individual', count: 700, avg_experience_level: 2.1 },
        { organization_type: 'Company', count: 300, avg_experience_level: 2.8 }
      ];

      mockDatabase.query
        .mockResolvedValueOnce(largeDatasetDistribution)
        .mockResolvedValueOnce(largeDatasetTimeline)
        .mockResolvedValueOnce(largeDatasetGeographic)
        .mockResolvedValueOnce(largeDatasetAttributes);

      analyticsService.getBasicEventStats = jest.fn().mockResolvedValue({
        eventInfo: { id: eventId },
        summary: { totalParticipants: 1000 }
      });
      analyticsService.getTalkStats = jest.fn().mockResolvedValue({ distribution: {} });

      const startTime = Date.now();
      await analyticsService.getParticipantStats(eventId);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
    });
  });
});
