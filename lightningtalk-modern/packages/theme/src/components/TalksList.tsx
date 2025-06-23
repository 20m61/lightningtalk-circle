/**
 * Talks List Component
 * 発表一覧表示コンポーネント
 */

import React, { useState } from 'react';
import { useWordPressApi } from '../hooks/useWordPressApi';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface Talk {
  id: number;
  title: string;
  description: string;
  speaker: string;
  category: string;
  duration: number;
  eventId?: number;
  status?: string;
  submittedAt?: string;
}

export const TalksList: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  
  const { data: talks, loading, error } = useWordPressApi<Talk[]>('/lightningtalk/v1/talks');
  const { data: events } = useWordPressApi<any[]>('/lightningtalk/v1/events');

  // カテゴリー一覧の取得
  const categories = talks ? [...new Set(talks.map(talk => talk.category).filter(Boolean))] : [];

  // フィルタリングされた発表一覧
  const filteredTalks = talks?.filter(talk => {
    const categoryMatch = selectedCategory === 'all' || talk.category === selectedCategory;
    const eventMatch = selectedEvent === 'all' || talk.eventId?.toString() === selectedEvent;
    return categoryMatch && eventMatch;
  }) || [];

  if (loading) {
    return <LoadingSpinner message="発表一覧を読み込み中..." />;
  }

  if (error) {
    return (
      <div className="talks-error">
        <h3>発表一覧の読み込みに失敗しました</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="talks-list-component">
      <div className="talks-header">
        <h2>発表一覧</h2>
        <div className="talks-stats">
          <span className="stat-item">
            総発表数: <strong>{talks?.length || 0}</strong>
          </span>
          <span className="stat-item">
            表示中: <strong>{filteredTalks.length}</strong>
          </span>
        </div>
      </div>

      <div className="talks-filters">
        <div className="filter-group">
          <label htmlFor="category-filter">カテゴリー:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">すべて</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="event-filter">イベント:</label>
          <select
            id="event-filter"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            <option value="all">すべて</option>
            {events?.map(event => (
              <option key={event.id} value={event.id.toString()}>
                {event.title}
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-secondary reset-filters"
          onClick={() => {
            setSelectedCategory('all');
            setSelectedEvent('all');
          }}
        >
          フィルターをリセット
        </button>
      </div>

      {filteredTalks.length === 0 ? (
        <div className="no-talks">
          <h3>
            {selectedCategory !== 'all' || selectedEvent !== 'all' 
              ? '条件に一致する発表がありません' 
              : 'まだ発表の登録がありません'}
          </h3>
          <p>
            {selectedCategory !== 'all' || selectedEvent !== 'all'
              ? 'フィルター条件を変更してみてください。'
              : '発表者を募集中です。ぜひご参加ください！'}
          </p>
        </div>
      ) : (
        <div className="talks-grid">
          {filteredTalks.map(talk => (
            <TalkCard key={talk.id} talk={talk} events={events} />
          ))}
        </div>
      )}
    </div>
  );
};

interface TalkCardProps {
  talk: Talk;
  events?: any[];
}

const TalkCard: React.FC<TalkCardProps> = ({ talk, events }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP');
  };

  const getEventTitle = (eventId?: number) => {
    if (!eventId || !events) return '';
    const event = events.find(e => e.id === eventId);
    return event?.title || '';
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'pending': return '審査中';
      case 'approved': return '承認済み';
      case 'rejected': return '却下';
      case 'scheduled': return 'スケジュール済み';
      default: return status || '未設定';
    }
  };

  const getStatusClass = (status?: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'approved': return 'status-approved';
      case 'rejected': return 'status-rejected';
      case 'scheduled': return 'status-scheduled';
      default: return 'status-default';
    }
  };

  return (
    <div className="talk-card">
      <div className="talk-header">
        <h3 className="talk-title">{talk.title}</h3>
        {talk.status && (
          <span className={`talk-status ${getStatusClass(talk.status)}`}>
            {getStatusLabel(talk.status)}
          </span>
        )}
      </div>

      <div className="talk-speaker">
        👤 発表者: <strong>{talk.speaker}</strong>
      </div>

      {talk.description && (
        <div className="talk-description">
          {talk.description}
        </div>
      )}

      <div className="talk-meta">
        {talk.category && (
          <span className="talk-category">
            🏷️ {getCategoryLabel(talk.category)}
          </span>
        )}
        
        <span className="talk-duration">
          ⏱️ {talk.duration}分
        </span>

        {talk.eventId && (
          <span className="talk-event">
            📅 {getEventTitle(talk.eventId)}
          </span>
        )}
      </div>

      {talk.submittedAt && (
        <div className="talk-submitted">
          提出日: {formatDate(talk.submittedAt)}
        </div>
      )}

      <div className="talk-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => {
            // 発表詳細を表示（モーダルまたは別ページ）
            console.log('Show talk details:', talk.id);
          }}
        >
          詳細を見る
        </button>
        
        {talk.eventId && (
          <button 
            className="btn btn-link"
            onClick={() => {
              // イベント詳細にジャンプ
              const event = events?.find(e => e.id === talk.eventId);
              if (event?.permalink) {
                window.open(event.permalink, '_blank');
              }
            }}
          >
            イベント詳細
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * カテゴリーラベルの取得
 */
function getCategoryLabel(category: string): string {
  const categoryLabels: Record<string, string> = {
    'tech': '技術',
    'business': 'ビジネス',
    'design': 'デザイン',
    'career': 'キャリア',
    'hobby': '趣味',
    'other': 'その他'
  };
  
  return categoryLabels[category] || category;
}