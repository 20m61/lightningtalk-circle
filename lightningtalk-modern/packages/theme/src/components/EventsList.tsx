/**
 * Events List Component
 * イベント一覧表示コンポーネント
 */

import React, { useState, useEffect } from 'react';
import { useWordPressApi } from '../hooks/useWordPressApi';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  venue: string;
  online_url?: string;
  status: string;
  permalink: string;
}

export const EventsList: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const { data: events, loading, error } = useWordPressApi<Event[]>('/lightningtalk/v1/events');

  const filteredEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return eventDate >= now;
      case 'past':
        return eventDate < now;
      default:
        return true;
    }
  }) || [];

  if (loading) {
    return <LoadingSpinner message="イベント一覧を読み込み中..." />;
  }

  if (error) {
    return (
      <div className="events-error">
        <h3>イベント一覧の読み込みに失敗しました</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="events-list-component">
      <div className="events-filter">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          すべて
        </button>
        <button
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          開催予定
        </button>
        <button
          className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          過去のイベント
        </button>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="no-events">
          <h3>
            {filter === 'upcoming' ? '開催予定のイベントはありません' : 
             filter === 'past' ? '過去のイベントはありません' : 
             'イベントがありません'}
          </h3>
          <p>新しいイベントが企画され次第、こちらでお知らせします。</p>
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map(event => (
            <EventListItem key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

interface EventListItemProps {
  event: Event;
}

const EventListItem: React.FC<EventListItemProps> = ({ event }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming': return '開催予定';
      case 'ongoing': return '開催中';
      case 'completed': return '終了';
      case 'cancelled': return 'キャンセル';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'upcoming': return 'status-upcoming';
      case 'ongoing': return 'status-ongoing';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  return (
    <div className="event-list-item">
      <div className="event-header">
        <h3 className="event-title">{event.title}</h3>
        <span className={`event-status ${getStatusClass(event.status)}`}>
          {getStatusLabel(event.status)}
        </span>
      </div>
      
      <div className="event-meta">
        <div className="event-date">
          📅 {formatDate(event.date)}
        </div>
        <div className="event-venue">
          📍 {event.venue}
        </div>
        {event.online_url && (
          <div className="event-online">
            💻 オンライン参加可能
          </div>
        )}
      </div>

      {event.description && (
        <div className="event-description">
          {event.description.length > 150 
            ? `${event.description.substring(0, 150)}...` 
            : event.description}
        </div>
      )}

      <div className="event-actions">
        <a 
          href={event.permalink} 
          className="btn btn-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          詳細を見る
        </a>
        {event.status === 'upcoming' && (
          <button 
            className="btn btn-secondary"
            onClick={() => {
              // 参加登録ページにリダイレクト
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'registration');
              url.searchParams.set('event', event.id.toString());
              window.location.href = url.toString();
            }}
          >
            参加登録
          </button>
        )}
      </div>
    </div>
  );
};