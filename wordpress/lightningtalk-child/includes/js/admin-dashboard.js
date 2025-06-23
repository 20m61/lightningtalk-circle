/**
 * Lightning Talk Admin Dashboard JavaScript
 * WordPress管理画面のダッシュボード機能
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Global variables
    let currentEventData = null;
    let currentTab = 'participants';
    
    // Initialize dashboard
    initializeDashboard();
    
    /**
     * ダッシュボードの初期化
     */
    function initializeDashboard() {
        loadStatsSummary();
        loadCurrentEvent();
        loadRecentActivity();
        loadSystemStatus();
        bindEvents();
    }
    
    /**
     * イベントリスナーをバインド
     */
    function bindEvents() {
        // 同期ボタン
        $('#sync-now-btn').on('click', handleSyncRequest);
        
        // タブ切り替え
        $('.lt-tab-btn').on('click', function() {
            const tab = $(this).data('tab');
            switchActivityTab(tab);
        });
        
        // イベント管理ページのイベント（該当ページのみ）
        if ($('.lightningtalk-events').length > 0) {
            bindEventManagementEvents();
        }
        
        // 発表管理ページのイベント（該当ページのみ）
        if ($('.lightningtalk-talks').length > 0) {
            bindTalkManagementEvents();
        }
    }
    
    /**
     * 統計サマリーの読み込み
     */
    function loadStatsSummary() {
        $.ajax({
            url: lightningTalkAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'lt_get_stats',
                nonce: lightningTalkAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    renderStatsSummary(response.data);
                } else {
                    showError(response.data.message || '統計データの取得に失敗しました');
                }
            },
            error: function() {
                showError('通信エラーが発生しました');
            }
        });
    }
    
    /**
     * 統計サマリーの表示
     */
    function renderStatsSummary(data) {
        const wp = data.wordpress || {};
        const api = data.nodejs_api || {};
        
        const html = `
            <div class="lt-stats-row">
                <div class="lt-stat-item">
                    <h4>WordPress</h4>
                    <p>イベント: ${wp.events || 0}</p>
                    <p>参加者: ${wp.participants || 0}</p>
                    <p>発表: ${wp.talks || 0}</p>
                </div>
                <div class="lt-stat-item">
                    <h4>Node.js API</h4>
                    <p>イベント: ${api.totalEvents || 'N/A'}</p>
                    <p>参加者: ${api.totalParticipants || 'N/A'}</p>
                    <p>発表: ${api.totalTalks || 'N/A'}</p>
                </div>
            </div>
            <div class="lt-sync-info">
                <small>最終同期: ${data.last_sync}</small>
            </div>
        `;
        
        $('#lt-stats-summary').html(html);
    }
    
    /**
     * 現在のイベント情報の読み込み
     */
    function loadCurrentEvent() {
        // Node.js APIから現在のイベント情報を取得
        $.ajax({
            url: lightningTalkAdmin.apiUrl + '/admin/dashboard',
            type: 'GET',
            headers: {
                'X-API-Key': lightningTalkAdmin.apiKey || ''
            },
            success: function(response) {
                if (response.currentEvent) {
                    currentEventData = response.currentEvent;
                    renderCurrentEvent(response.currentEvent);
                } else {
                    $('#lt-current-event-info').html('<p>現在進行中のイベントはありません</p>');
                }
            },
            error: function() {
                $('#lt-current-event-info').html('<p>イベント情報の取得に失敗しました</p>');
            }
        });
    }
    
    /**
     * 現在のイベント情報の表示
     */
    function renderCurrentEvent(event) {
        const stats = event.stats || {};
        const html = `
            <div class="lt-current-event-card">
                <h3>${escapeHtml(event.title)}</h3>
                <p><strong>開催日:</strong> ${formatDate(event.eventDate)}</p>
                <p><strong>会場:</strong> ${escapeHtml(event.venue?.name || '未設定')}</p>
                <div class="lt-event-stats">
                    <div class="lt-stat">
                        <span class="number">${stats.participants || 0}</span>
                        <span class="label">参加者</span>
                    </div>
                    <div class="lt-stat">
                        <span class="number">${stats.talks || 0}</span>
                        <span class="label">発表</span>
                    </div>
                    <div class="lt-stat">
                        <span class="number">${stats.spotsRemaining || 0}</span>
                        <span class="label">残り枠</span>
                    </div>
                </div>
                <div class="lt-event-actions">
                    <a href="/wp-admin/edit.php?post_type=lt_event" class="button">イベント管理</a>
                    <a href="/wp-admin/edit.php?post_type=lt_participant" class="button">参加者管理</a>
                </div>
            </div>
        `;
        
        $('#lt-current-event-info').html(html);
    }
    
    /**
     * 最近の活動の読み込み
     */
    function loadRecentActivity() {
        $.ajax({
            url: lightningTalkAdmin.apiUrl + '/admin/dashboard',
            type: 'GET',
            headers: {
                'X-API-Key': lightningTalkAdmin.apiKey || ''
            },
            success: function(response) {
                if (response.recentActivity) {
                    renderRecentActivity(response.recentActivity);
                } else {
                    $('#lt-recent-activities').html('<p>最近の活動はありません</p>');
                }
            },
            error: function() {
                $('#lt-recent-activities').html('<p>活動情報の取得に失敗しました</p>');
            }
        });
    }
    
    /**
     * 最近の活動の表示
     */
    function renderRecentActivity(activity) {
        const participants = activity.participants || [];
        const talks = activity.talks || [];
        
        let html = '<div class="lt-activity-content">';
        
        if (currentTab === 'participants') {
            html += '<div class="lt-activity-list">';
            if (participants.length > 0) {
                participants.forEach(participant => {
                    html += `
                        <div class="lt-activity-item">
                            <strong>${escapeHtml(participant.name)}</strong>
                            <span class="lt-participation-type">${escapeHtml(participant.participationType)}</span>
                            <small>${formatDateTime(participant.registeredAt)}</small>
                        </div>
                    `;
                });
            } else {
                html += '<p>最近の参加者登録はありません</p>';
            }
            html += '</div>';
        } else {
            html += '<div class="lt-activity-list">';
            if (talks.length > 0) {
                talks.forEach(talk => {
                    html += `
                        <div class="lt-activity-item">
                            <strong>${escapeHtml(talk.title)}</strong>
                            <span class="lt-speaker">${escapeHtml(talk.speakerName)}</span>
                            <span class="lt-category">${escapeHtml(talk.category || '未分類')}</span>
                            <small>${formatDateTime(talk.submittedAt)}</small>
                        </div>
                    `;
                });
            } else {
                html += '<p>最近の発表提出はありません</p>';
            }
            html += '</div>';
        }
        
        html += '</div>';
        $('#lt-recent-activities').html(html);
    }
    
    /**
     * システム状態の読み込み
     */
    function loadSystemStatus() {
        $.ajax({
            url: lightningTalkAdmin.apiUrl + '/admin/dashboard',
            type: 'GET',
            headers: {
                'X-API-Key': lightningTalkAdmin.apiKey || ''
            },
            success: function(response) {
                if (response.systemHealth) {
                    renderSystemStatus(response.systemHealth);
                } else {
                    $('#lt-system-status').html('<p>システム状態の取得に失敗しました</p>');
                }
            },
            error: function() {
                $('#lt-system-status').html('<p class="lt-error">API接続エラー</p>');
            }
        });
    }
    
    /**
     * システム状態の表示
     */
    function renderSystemStatus(health) {
        const uptimeHours = Math.floor(health.uptime / 3600);
        const memoryUsage = Math.round(health.memoryUsage.used / 1024 / 1024);
        
        const html = `
            <div class="lt-system-info">
                <div class="lt-system-item">
                    <span class="label">稼働時間:</span>
                    <span class="value">${uptimeHours}時間</span>
                </div>
                <div class="lt-system-item">
                    <span class="label">メモリ使用量:</span>
                    <span class="value">${memoryUsage}MB</span>
                </div>
                <div class="lt-system-item">
                    <span class="label">API接続:</span>
                    <span class="value lt-status-ok">正常</span>
                </div>
                <div class="lt-system-item">
                    <span class="label">最終更新:</span>
                    <span class="value">${formatDateTime(health.timestamp)}</span>
                </div>
            </div>
        `;
        
        $('#lt-system-status').html(html);
    }
    
    /**
     * 同期リクエストの処理
     */
    function handleSyncRequest() {
        if (!confirm(lightningTalkAdmin.translations.confirmSync)) {
            return;
        }
        
        const $btn = $('#sync-now-btn');
        const originalText = $btn.text();
        
        $btn.prop('disabled', true).text(lightningTalkAdmin.translations.loading);
        
        $.ajax({
            url: lightningTalkAdmin.ajaxUrl,
            type: 'POST',
            data: {
                action: 'lt_sync_data',
                nonce: lightningTalkAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    showSuccess(lightningTalkAdmin.translations.syncSuccess);
                    // データを再読み込み
                    loadStatsSummary();
                    loadCurrentEvent();
                    loadRecentActivity();
                    // 同期時刻を更新
                    $('#last-sync-time').text(response.data.timestamp);
                } else {
                    showError(response.data.message || lightningTalkAdmin.translations.syncError);
                }
            },
            error: function() {
                showError(lightningTalkAdmin.translations.syncError);
            },
            complete: function() {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    }
    
    /**
     * アクティビティタブの切り替え
     */
    function switchActivityTab(tab) {
        $('.lt-tab-btn').removeClass('active');
        $(`.lt-tab-btn[data-tab="${tab}"]`).addClass('active');
        currentTab = tab;
        loadRecentActivity();
    }
    
    /**
     * イベント管理のイベントバインド
     */
    function bindEventManagementEvents() {
        $('#create-event-btn').on('click', openCreateEventModal);
        $('#sync-events-btn').on('click', syncEvents);
        $('#event-form').on('submit', handleEventSubmit);
        $('.lt-modal-close').on('click', closeEventModal);
        
        // モーダル外クリックで閉じる
        $('#event-modal').on('click', function(e) {
            if (e.target === this) {
                closeEventModal();
            }
        });
        
        // イベント一覧を読み込み
        loadEvents();
    }
    
    /**
     * 発表管理のイベントバインド
     */
    function bindTalkManagementEvents() {
        $('#apply-filters').on('click', applyTalkFilters);
        $('#select-all-talks').on('change', toggleAllTalks);
        $('#apply-bulk-action').on('click', applyBulkAction);
        
        // 発表一覧を読み込み
        loadTalks();
    }
    
    /**
     * ユーティリティ関数
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP');
    }
    
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP');
    }
    
    function showSuccess(message) {
        const notice = $('<div class="notice notice-success is-dismissible"><p>' + message + '</p></div>');
        $('.wrap').prepend(notice);
        setTimeout(() => notice.fadeOut(), 5000);
    }
    
    function showError(message) {
        const notice = $('<div class="notice notice-error is-dismissible"><p>' + message + '</p></div>');
        $('.wrap').prepend(notice);
        setTimeout(() => notice.fadeOut(), 8000);
    }
    
    // Global functions for modal management
    window.openCreateEventModal = function() {
        $('#modal-title').text('新しいイベントを作成');
        $('#event-form')[0].reset();
        $('#event-modal').show();
    };
    
    window.closeEventModal = function() {
        $('#event-modal').hide();
        currentEventData = null;
    };
    
    // Additional functions for event and talk management would go here
    // (loadEvents, syncEvents, handleEventSubmit, loadTalks, etc.)
});