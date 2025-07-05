/**
 * Event Search Functionality Unit Tests
 */

import { jest } from '@jest/globals';

describe('Event Search Logic', () => {
  describe('Text Search', () => {
    test('should filter events by search query in title', () => {
      const events = [
        { id: '1', title: 'Lightning Talk Session', description: 'Join us' },
        { id: '2', title: 'Tech Conference', description: 'Annual event' },
        { id: '3', title: 'Lightning Demo', description: 'Quick demos' }
      ];

      const query = 'lightning';
      const filtered = events.filter(
        event =>
          event.title.toLowerCase().includes(query.toLowerCase()) ||
          event.description.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '3']);
    });

    test('should filter events by search query in description', () => {
      const events = [
        { id: '1', title: 'Event 1', description: 'Lightning talks included' },
        { id: '2', title: 'Event 2', description: 'No special content' },
        { id: '3', title: 'Event 3', description: 'Features lightning presentations' }
      ];

      const query = 'lightning';
      const filtered = events.filter(
        event =>
          event.title.toLowerCase().includes(query.toLowerCase()) ||
          event.description.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '3']);
    });

    test('should handle case-insensitive search', () => {
      const events = [
        { id: '1', title: 'LIGHTNING TALK', description: 'test' },
        { id: '2', title: 'Lightning Talk', description: 'test' },
        { id: '3', title: 'lightning talk', description: 'test' }
      ];

      const query = 'LiGhTnInG';
      const filtered = events.filter(event =>
        event.title.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(3);
    });
  });

  describe('Status Filtering', () => {
    test('should filter events by status', () => {
      const events = [
        { id: '1', status: 'upcoming' },
        { id: '2', status: 'ongoing' },
        { id: '3', status: 'upcoming' },
        { id: '4', status: 'completed' }
      ];

      const filtered = events.filter(event => event.status === 'upcoming');
      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '3']);
    });

    test('should handle "all" status filter', () => {
      const events = [
        { id: '1', status: 'upcoming' },
        { id: '2', status: 'ongoing' },
        { id: '3', status: 'completed' }
      ];

      const status = 'all';
      const filtered = status === 'all' ? events : events.filter(e => e.status === status);
      expect(filtered).toHaveLength(3);
    });
  });

  describe('Venue Type Filtering', () => {
    test('should filter online events', () => {
      const events = [
        { id: '1', venue: { online: true } },
        { id: '2', venue: { address: '123 Main St' } },
        { id: '3', venue: { online: true, address: '456 Oak Ave' } }
      ];

      const filtered = events.filter(event => {
        const hasOnline = event.venue?.online || false;
        const hasOffline = event.venue?.address || event.venue?.name;
        return hasOnline && !hasOffline;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    test('should filter offline events', () => {
      const events = [
        { id: '1', venue: { online: true } },
        { id: '2', venue: { address: '123 Main St' } },
        { id: '3', venue: { online: true, address: '456 Oak Ave' } }
      ];

      const filtered = events.filter(event => {
        const hasOnline = event.venue?.online || false;
        const hasOffline = event.venue?.address || event.venue?.name;
        return !hasOnline && hasOffline;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    test('should filter hybrid events', () => {
      const events = [
        { id: '1', venue: { online: true } },
        { id: '2', venue: { address: '123 Main St' } },
        { id: '3', venue: { online: true, address: '456 Oak Ave' } }
      ];

      const filtered = events.filter(event => {
        const hasOnline = event.venue?.online || false;
        const hasOffline = event.venue?.address || event.venue?.name;
        return hasOnline && hasOffline;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('3');
    });
  });

  describe('Date Range Filtering', () => {
    test('should filter events within date range', () => {
      const events = [
        { id: '1', date: '2025-06-01T19:00:00+09:00' },
        { id: '2', date: '2025-07-15T19:00:00+09:00' },
        { id: '3', date: '2025-08-01T19:00:00+09:00' }
      ];

      const dateFrom = '2025-07-01';
      const dateTo = '2025-07-31';

      const filtered = events.filter(event => {
        const eventDate = new Date(event.date);
        if (dateFrom && eventDate < new Date(dateFrom)) return false;
        if (dateTo && eventDate > new Date(dateTo)) return false;
        return true;
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('2');
    });

    test('should handle date from only', () => {
      const events = [
        { id: '1', date: '2025-06-01T19:00:00+09:00' },
        { id: '2', date: '2025-07-15T19:00:00+09:00' },
        { id: '3', date: '2025-08-01T19:00:00+09:00' }
      ];

      const dateFrom = '2025-07-01';

      const filtered = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= new Date(dateFrom);
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['2', '3']);
    });

    test('should handle date to only', () => {
      const events = [
        { id: '1', date: '2025-06-01T19:00:00+09:00' },
        { id: '2', date: '2025-07-15T19:00:00+09:00' },
        { id: '3', date: '2025-08-01T19:00:00+09:00' }
      ];

      const dateTo = '2025-07-31';

      const filtered = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate <= new Date(dateTo);
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map(e => e.id)).toEqual(['1', '2']);
    });
  });

  describe('Sorting', () => {
    test('should sort by date ascending', () => {
      const events = [
        { id: '2', date: '2025-07-15T19:00:00+09:00' },
        { id: '1', date: '2025-07-01T19:00:00+09:00' },
        { id: '3', date: '2025-08-01T19:00:00+09:00' }
      ];

      const sorted = [...events].sort((a, b) => {
        const aValue = new Date(a.date);
        const bValue = new Date(b.date);
        return aValue > bValue ? 1 : -1;
      });

      expect(sorted.map(e => e.id)).toEqual(['1', '2', '3']);
    });

    test('should sort by date descending', () => {
      const events = [
        { id: '2', date: '2025-07-15T19:00:00+09:00' },
        { id: '1', date: '2025-07-01T19:00:00+09:00' },
        { id: '3', date: '2025-08-01T19:00:00+09:00' }
      ];

      const sorted = [...events].sort((a, b) => {
        const aValue = new Date(a.date);
        const bValue = new Date(b.date);
        return bValue > aValue ? 1 : -1;
      });

      expect(sorted.map(e => e.id)).toEqual(['3', '2', '1']);
    });

    test('should sort by title alphabetically', () => {
      const events = [
        { id: '1', title: 'Beta Event' },
        { id: '2', title: 'Alpha Event' },
        { id: '3', title: 'Gamma Event' }
      ];

      const sorted = [...events].sort((a, b) => {
        const aValue = a.title.toLowerCase();
        const bValue = b.title.toLowerCase();
        return aValue > bValue ? 1 : -1;
      });

      expect(sorted.map(e => e.id)).toEqual(['2', '1', '3']);
    });
  });

  describe('Pagination', () => {
    test('should paginate results correctly', () => {
      const events = Array.from({ length: 25 }, (_, i) => ({
        id: `event-${i + 1}`,
        title: `Event ${i + 1}`
      }));

      const page = 2;
      const perPage = 10;
      const offset = (page - 1) * perPage;
      const paginated = events.slice(offset, offset + perPage);

      expect(paginated).toHaveLength(10);
      expect(paginated[0].id).toBe('event-11');
      expect(paginated[9].id).toBe('event-20');
    });

    test('should calculate pagination metadata', () => {
      const totalEvents = 25;
      const perPage = 10;
      const page = 2;

      const totalPages = Math.ceil(totalEvents / perPage);
      const hasMore = page < totalPages;

      expect(totalPages).toBe(3);
      expect(hasMore).toBe(true);
    });

    test('should handle last page correctly', () => {
      const events = Array.from({ length: 25 }, (_, i) => ({
        id: `event-${i + 1}`,
        title: `Event ${i + 1}`
      }));

      const page = 3;
      const perPage = 10;
      const offset = (page - 1) * perPage;
      const paginated = events.slice(offset, offset + perPage);

      expect(paginated).toHaveLength(5);
      expect(paginated[0].id).toBe('event-21');
      expect(paginated[4].id).toBe('event-25');
    });
  });

  describe('Summary Statistics', () => {
    test('should calculate event statistics correctly', () => {
      const events = [
        { id: '1', status: 'upcoming' },
        { id: '2', status: 'upcoming' },
        { id: '3', status: 'ongoing' },
        { id: '4', status: 'completed' },
        { id: '5', status: 'completed' },
        { id: '6', status: 'completed' },
        { id: '7', status: 'cancelled' }
      ];

      const stats = {
        totalEvents: events.length,
        upcomingEvents: events.filter(e => e.status === 'upcoming').length,
        ongoingEvents: events.filter(e => e.status === 'ongoing').length,
        completedEvents: events.filter(e => e.status === 'completed').length,
        cancelledEvents: events.filter(e => e.status === 'cancelled').length
      };

      expect(stats).toEqual({
        totalEvents: 7,
        upcomingEvents: 2,
        ongoingEvents: 1,
        completedEvents: 3,
        cancelledEvents: 1
      });
    });
  });

  describe('Combined Filters', () => {
    test('should apply multiple filters together', () => {
      const events = [
        {
          id: '1',
          title: 'Lightning Talk Online',
          description: 'Online session',
          date: '2025-07-20T19:00:00+09:00',
          status: 'upcoming',
          venue: { online: true }
        },
        {
          id: '2',
          title: 'Lightning Talk Offline',
          description: 'Offline session',
          date: '2025-07-25T19:00:00+09:00',
          status: 'upcoming',
          venue: { address: '123 Main St' }
        },
        {
          id: '3',
          title: 'Tech Conference',
          description: 'Various talks',
          date: '2025-08-10T19:00:00+09:00',
          status: 'upcoming',
          venue: { online: true }
        },
        {
          id: '4',
          title: 'Past Lightning Event',
          description: 'Lightning talks',
          date: '2025-06-01T19:00:00+09:00',
          status: 'completed',
          venue: { online: true }
        }
      ];

      // Apply filters: search + status + venue + date
      const filtered = events
        .filter(
          event =>
            event.title.toLowerCase().includes('lightning') ||
            event.description.toLowerCase().includes('lightning')
        )
        .filter(event => event.status === 'upcoming')
        .filter(event => event.venue?.online)
        .filter(event => {
          const eventDate = new Date(event.date);
          return eventDate >= new Date('2025-07-01') && eventDate <= new Date('2025-07-31');
        });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });
});
