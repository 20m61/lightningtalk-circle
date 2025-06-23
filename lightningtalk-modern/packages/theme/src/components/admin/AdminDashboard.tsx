/**
 * Admin Dashboard Component
 * WordPress管理画面のメインダッシュボード
 */

import React, { useState, useEffect } from 'react';
import { useWordPressApi } from '../../hooks/useWordPressApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface DashboardData {
  overview: {
    totalEvents: number;
    totalParticipants: number;
    totalTalks: number;
    activeEvents: number;
  };
  currentEvent?: {
    id: number;
    title: string;
    eventDate: string;
    stats: {
      participants: number;
      talks: number;
      spotsRemaining: number;
    };
  };
  recentActivity: {
    participants: Array<{
      id: number;
      name: string;
      eventId: number;
      participationType: string;
      registeredAt: string;
    }>;
    talks: Array<{
      id: number;
      title: string;
      speakerName: string;
      category: string;
      eventId: number;
      submittedAt: string;
    }>;
  };
  systemHealth: {
    uptime: number;
    memoryUsage: any;
    timestamp: string;
  };
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'system'>('overview');
  const { data: dashboardData, loading, error, refetch } = useWordPressApi<DashboardData>('/admin/dashboard');

  useEffect(() => {
    // 定期的にダッシュボードデータを更新
    const interval = setInterval(() => {
      refetch();
    }, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [refetch]);

  if (loading && !dashboardData) {
    return <LoadingSpinner message="ダッシュボードを読み込み中..." />;
  }

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <h3>ダッシュボードの読み込みに失敗しました</h3>
        <p>{error}</p>
        <button onClick={() => refetch()} className="button button-primary">
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="lightningtalk-admin-dashboard">
      <div className="dashboard-header">
        <h1>Lightning Talk ダッシュボード</h1>
        <div className="dashboard-actions">
          <button 
            onClick={() => refetch()} 
            className="button button-secondary"
            disabled={loading}
          >
            {loading ? '更新中...' : '更新'}
          </button>
        </div>
      </div>

      {dashboardData && (
        <>
          {/* 概要統計 */}
          <div className="dashboard-stats">
            <div className="stat-card">
              <div className="stat-number">{dashboardData.overview.totalEvents}</div>
              <div className="stat-label">総イベント数</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dashboardData.overview.totalParticipants}</div>
              <div className="stat-label">総参加者数</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dashboardData.overview.totalTalks}</div>
              <div className="stat-label">総発表数</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{dashboardData.overview.activeEvents}</div>
              <div className="stat-label">アクティブイベント</div>
            </div>
          </div>

          {/* 現在のイベント */}
          {dashboardData.currentEvent && (
            <div className="dashboard-current-event">
              <h2>現在のイベント</h2>
              <div className="current-event-card">
                <div className="event-info">
                  <h3>{dashboardData.currentEvent.title}</h3>
                  <p className="event-date">
                    開催日: {formatDate(dashboardData.currentEvent.eventDate)}
                  </p>
                </div>
                <div className="event-stats">
                  <div className="event-stat">
                    <span className="stat-value">{dashboardData.currentEvent.stats.participants}</span>
                    <span className="stat-label">参加者</span>
                  </div>
                  <div className="event-stat">
                    <span className="stat-value">{dashboardData.currentEvent.stats.talks}</span>
                    <span className="stat-label">発表</span>
                  </div>
                  <div className="event-stat">
                    <span className="stat-value">{dashboardData.currentEvent.stats.spotsRemaining}</span>
                    <span className="stat-label">残り枠</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* タブナビゲーション */}
          <div className="dashboard-tabs">
            <nav className="nav-tab-wrapper">
              <button
                className={`nav-tab ${activeTab === 'overview' ? 'nav-tab-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                概要
              </button>
              <button
                className={`nav-tab ${activeTab === 'activity' ? 'nav-tab-active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                最近の活動
              </button>
              <button
                className={`nav-tab ${activeTab === 'system' ? 'nav-tab-active' : ''}`}
                onClick={() => setActiveTab('system')}
              >
                システム状態
              </button>
            </nav>

            <div className="tab-content">
              {activeTab === 'overview' && (
                <OverviewTab data={dashboardData} />
              )}
              {activeTab === 'activity' && (
                <ActivityTab data={dashboardData.recentActivity} />
              )}
              {activeTab === 'system' && (
                <SystemTab data={dashboardData.systemHealth} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 概要タブ
 */
interface OverviewTabProps {
  data: DashboardData;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ data }) => {
  return (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="overview-card">
          <h3>イベント管理</h3>
          <p>新しいイベントの作成・編集や既存イベントの管理</p>
          <a href="/wp-admin/admin.php?page=lightningtalk-events" className="button button-primary">
            イベント管理
          </a>
        </div>
        
        <div className="overview-card">
          <h3>参加者管理</h3>
          <p>参加者の登録状況確認や連絡先管理</p>
          <a href="/wp-admin/edit.php?post_type=lt_participant" className="button button-primary">
            参加者管理
          </a>
        </div>
        
        <div className="overview-card">
          <h3>発表管理</h3>
          <p>発表の審査・承認やスケジュール管理</p>
          <a href="/wp-admin/admin.php?page=lightningtalk-talks" className="button button-primary">
            発表管理
          </a>
        </div>
        
        <div className="overview-card">
          <h3>設定</h3>
          <p>システム設定や通知設定の管理</p>
          <a href="/wp-admin/admin.php?page=lightningtalk-settings" className="button button-primary">
            設定
          </a>
        </div>
      </div>
    </div>
  );
};

/**
 * 活動タブ
 */
interface ActivityTabProps {
  data: DashboardData['recentActivity'];
}

const ActivityTab: React.FC<ActivityTabProps> = ({ data }) => {
  const [activeActivityTab, setActiveActivityTab] = useState<'participants' | 'talks'>('participants');

  return (
    <div className="activity-tab">
      <div className="activity-sub-tabs">
        <button
          className={`activity-tab-btn ${activeActivityTab === 'participants' ? 'active' : ''}`}
          onClick={() => setActiveActivityTab('participants')}
        >
          新規参加者 ({data.participants.length})
        </button>
        <button
          className={`activity-tab-btn ${activeActivityTab === 'talks' ? 'active' : ''}`}
          onClick={() => setActiveActivityTab('talks')}
        >
          新規発表 ({data.talks.length})
        </button>
      </div>

      <div className="activity-content">
        {activeActivityTab === 'participants' && (
          <div className="participants-list">
            {data.participants.length === 0 ? (
              <p>最近の参加者登録はありません</p>
            ) : (
              <div className="activity-items">
                {data.participants.map(participant => (
                  <div key={participant.id} className="activity-item">
                    <div className="activity-info">
                      <strong>{participant.name}</strong>
                      <span className="activity-meta">
                        {participant.participationType} - {formatDateTime(participant.registeredAt)}
                      </span>
                    </div>
                    <div className="activity-actions">
                      <a href={`/wp-admin/post.php?post=${participant.id}&action=edit`} className="button button-small">
                        編集
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeActivityTab === 'talks' && (
          <div className="talks-list">
            {data.talks.length === 0 ? (
              <p>最近の発表提出はありません</p>
            ) : (
              <div className="activity-items">
                {data.talks.map(talk => (
                  <div key={talk.id} className="activity-item">
                    <div className="activity-info">
                      <strong>{talk.title}</strong>
                      <span className="activity-meta">
                        {talk.speakerName} - {talk.category} - {formatDateTime(talk.submittedAt)}
                      </span>
                    </div>
                    <div className="activity-actions">
                      <a href={`/wp-admin/post.php?post=${talk.id}&action=edit`} className="button button-small">
                        編集
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * システムタブ
 */
interface SystemTabProps {
  data: DashboardData['systemHealth'];
}

const SystemTab: React.FC<SystemTabProps> = ({ data }) => {
  const formatUptime = (uptime: number) => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}時間${minutes}分`;
  };

  const formatMemoryUsage = (memory: any) => {
    if (!memory) return 'N/A';
    const used = Math.round(memory.used / 1024 / 1024);
    const total = Math.round(memory.heapTotal / 1024 / 1024);
    return `${used}MB / ${total}MB`;
  };

  return (
    <div className="system-tab">
      <div className="system-info-grid">
        <div className="system-info-card">
          <h3>サーバー稼働時間</h3>
          <div className="system-value">{formatUptime(data.uptime)}</div>
        </div>
        
        <div className="system-info-card">
          <h3>メモリ使用量</h3>
          <div className="system-value">{formatMemoryUsage(data.memoryUsage)}</div>
        </div>
        
        <div className="system-info-card">
          <h3>API接続状態</h3>
          <div className="system-value status-ok">正常</div>
        </div>
        
        <div className="system-info-card">
          <h3>最終更新</h3>
          <div className="system-value">{formatDateTime(data.timestamp)}</div>
        </div>
      </div>

      <div className="system-actions">
        <button className="button button-secondary">
          システムログを表示
        </button>
        <button className="button button-secondary">
          キャッシュをクリア
        </button>
        <button className="button button-secondary">
          診断情報をエクスポート
        </button>
      </div>
    </div>
  );
};

/**
 * ユーティリティ関数
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}