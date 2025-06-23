/**
 * Lightning Talk App - Main React Component
 * TypeScript/React統合のメインアプリケーション
 */

import React, { useState, useEffect } from 'react';
import { EventCard } from '@lightningtalk/components';
import { useWordPressApi } from '../hooks/useWordPressApi';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { NotificationCenter } from './NotificationCenter';

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

interface AppState {
  currentView: 'events' | 'registration' | 'talks';
  selectedEvent?: Event;
}

export const LightningTalkApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentView: 'events'
  });
  
  const { data: events, loading, error, refetch } = useWordPressApi<Event[]>('/lightningtalk/v1/events');

  useEffect(() => {
    // URL パラメータに基づく初期表示の決定
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') as AppState['currentView'];
    if (view) {
      setState(prev => ({ ...prev, currentView: view }));
    }
  }, []);

  const handleViewChange = (view: AppState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view }));
    
    // URL 更新（SPA的な動作）
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url.toString());
  };

  const handleEventSelect = (event: Event) => {
    setState(prev => ({ 
      ...prev, 
      selectedEvent: event,
      currentView: 'registration'
    }));
  };

  if (error) {
    return (
      <div className="lightningtalk-app-error">
        <h3>エラーが発生しました</h3>
        <p>{error}</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          再試行
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="lightningtalk-app">
        <header className="app-header">
          <h1>Lightning Talk</h1>
          <nav className="app-navigation">
            <button
              className={`nav-btn ${state.currentView === 'events' ? 'active' : ''}`}
              onClick={() => handleViewChange('events')}
            >
              イベント一覧
            </button>
            <button
              className={`nav-btn ${state.currentView === 'registration' ? 'active' : ''}`}
              onClick={() => handleViewChange('registration')}
            >
              参加登録
            </button>
            <button
              className={`nav-btn ${state.currentView === 'talks' ? 'active' : ''}`}
              onClick={() => handleViewChange('talks')}
            >
              発表一覧
            </button>
          </nav>
        </header>

        <main className="app-main">
          {state.currentView === 'events' && (
            <EventsView 
              events={events || []} 
              loading={loading} 
              onEventSelect={handleEventSelect}
            />
          )}
          
          {state.currentView === 'registration' && (
            <RegistrationView 
              selectedEvent={state.selectedEvent}
              onBack={() => handleViewChange('events')}
            />
          )}
          
          {state.currentView === 'talks' && (
            <TalksView />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

/**
 * イベント一覧ビュー
 */
interface EventsViewProps {
  events: Event[];
  loading: boolean;
  onEventSelect: (event: Event) => void;
}

const EventsView: React.FC<EventsViewProps> = ({ events, loading, onEventSelect }) => {
  if (loading) {
    return <LoadingSpinner message="イベントを読み込み中..." />;
  }

  if (events.length === 0) {
    return (
      <div className="no-events">
        <h3>現在開催予定のイベントはありません</h3>
        <p>新しいイベントが企画され次第、こちらでお知らせします。</p>
      </div>
    );
  }

  return (
    <div className="events-view">
      <div className="events-grid">
        {events.map(event => (
          <EventCard
            key={event.id}
            title={event.title}
            description={event.description}
            date={event.date}
            venue={event.venue}
            onlineUrl={event.online_url}
            status={event.status}
            onRegister={() => onEventSelect(event)}
            onViewDetails={() => window.open(event.permalink, '_blank')}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 参加登録ビュー
 */
interface RegistrationViewProps {
  selectedEvent?: Event;
  onBack: () => void;
}

const RegistrationView: React.FC<RegistrationViewProps> = ({ selectedEvent, onBack }) => {
  if (!selectedEvent) {
    return (
      <div className="registration-view">
        <h3>イベントを選択してください</h3>
        <button onClick={onBack} className="btn btn-secondary">
          イベント一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <div className="registration-view">
      <div className="registration-header">
        <button onClick={onBack} className="btn btn-link">
          ← イベント一覧に戻る
        </button>
        <h2>{selectedEvent.title} - 参加登録</h2>
      </div>
      
      {/* 実際の登録フォームは RegistrationForm コンポーネントで処理 */}
      <div id="lightningtalk-registration-form" data-event-id={selectedEvent.id}>
        {/* RegistrationForm コンポーネントがここにマウントされる */}
      </div>
    </div>
  );
};

/**
 * 発表一覧ビュー
 */
const TalksView: React.FC = () => {
  const { data: talks, loading, error } = useWordPressApi<any[]>('/lightningtalk/v1/talks');

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

  if (!talks || talks.length === 0) {
    return (
      <div className="no-talks">
        <h3>まだ発表の登録がありません</h3>
        <p>発表者を募集中です。ぜひご参加ください！</p>
      </div>
    );
  }

  return (
    <div className="talks-view">
      <h2>発表一覧</h2>
      <div className="talks-list">
        {talks.map(talk => (
          <div key={talk.id} className="talk-card">
            <h3>{talk.title}</h3>
            <p className="talk-speaker">発表者: {talk.speaker}</p>
            <p className="talk-description">{talk.description}</p>
            <div className="talk-meta">
              <span className="talk-category">{talk.category}</span>
              <span className="talk-duration">{talk.duration}分</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* 通知センター */}
      <NotificationCenter 
        position="top-right"
        maxVisible={3}
        autoHide={true}
        autoHideDelay={5000}
        enableSound={false}
      />
    </div>
  );
};