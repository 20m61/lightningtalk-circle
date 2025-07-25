/**
 * Lightning Talk WordPress Admin Scripts
 * WordPress管理画面用のスクリプト
 */

(function($) {
    'use strict';

    /**
     * Lightning Talk管理画面機能
     */
    class LightningTalkAdmin {
        constructor() {
            this.init();
        }

        init() {
            // DOMが読み込まれたら初期化
            $(document).ready(() => {
                this.setupEventManagement();
                this.setupParticipantManagement();
                this.setupTalkManagement();
                this.setupCustomFields();
                this.setupPreview();
                this.setupExport();
                this.setupNotifications();
            });
        }

        /**
         * イベント管理機能の設定
         */
        setupEventManagement() {
            // イベント編集画面での機能
            if (window.pagenow === 'lt_event') {
                this.initEventEditor();
            }
        }

        /**
         * イベントエディターの初期化
         */
        initEventEditor() {
            // 日時ピッカーの設定
            this.setupDateTimePicker();
            
            // 会場情報の動的入力
            this.setupVenueFields();
            
            // オンライン参加設定
            this.setupOnlineSettings();
            
            // 定員管理
            this.setupCapacityManagement();
        }

        /**
         * 日時ピッカーの設定
         */
        setupDateTimePicker() {
            $('#event_date').datetimepicker({
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                stepMinute: 5,
                onSelect: (dateText) => {
                    this.updateEventPreview();
                }
            });

            $('#event_end_date').datetimepicker({
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                stepMinute: 5
            });
        }

        /**
         * 会場情報フィールドの設定
         */
        setupVenueFields() {
            $('#venue_type').change((e) => {
                const venueType = $(e.target).val();
                
                if (venueType === 'online') {
                    $('#physical_venue_fields').hide();
                    $('#online_venue_fields').show();
                } else if (venueType === 'hybrid') {
                    $('#physical_venue_fields').show();
                    $('#online_venue_fields').show();
                } else {
                    $('#physical_venue_fields').show();
                    $('#online_venue_fields').hide();
                }
            });
        }

        /**
         * オンライン設定の管理
         */
        setupOnlineSettings() {
            $('#enable_online').change((e) => {
                if ($(e.target).is(':checked')) {
                    $('#online_settings').show();
                } else {
                    $('#online_settings').hide();
                }
            });

            // Google Meet URLの自動生成
            $('#generate_meet_url').click((e) => {
                e.preventDefault();
                this.generateMeetUrl();
            });
        }

        /**
         * 定員管理の設定
         */
        setupCapacityManagement() {
            $('#max_participants').on('input', () => {
                this.updateCapacityIndicator();
            });
        }

        /**
         * 参加者管理機能の設定
         */
        setupParticipantManagement() {
            if (window.pagenow === 'lightningtalk_page_lightningtalk-participants') {
                this.initParticipantManager();
            }
        }

        /**
         * 参加者マネージャーの初期化
         */
        initParticipantManager() {
            // 参加者一覧テーブルの設定
            $('#participants-table').DataTable({
                pageLength: 25,
                order: [[3, 'desc']], // 登録日でソート
                columnDefs: [
                    { orderable: false, targets: [4] } // アクション列は非ソート
                ],
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.4/i18n/ja.json'
                }
            });

            // 一括操作の設定
            this.setupBulkActions();
            
            // CSVエクスポート
            this.setupCSVExport();
            
            // メール送信機能
            this.setupEmailFeatures();
        }

        /**
         * 一括操作の設定
         */
        setupBulkActions() {
            $('#bulk-action-apply').click((e) => {
                e.preventDefault();
                const action = $('#bulk-action-selector').val();
                const selected = $('input[name="participants[]"]:checked');
                
                if (selected.length === 0) {
                    alert('参加者を選択してください。');
                    return;
                }
                
                switch (action) {
                    case 'approve':
                        this.bulkApprove(selected);
                        break;
                    case 'reject':
                        this.bulkReject(selected);
                        break;
                    case 'delete':
                        this.bulkDelete(selected);
                        break;
                    case 'export':
                        this.bulkExport(selected);
                        break;
                }
            });
        }

        /**
         * CSVエクスポートの設定
         */
        setupCSVExport() {
            $('#export-csv').click((e) => {
                e.preventDefault();
                const eventId = $('#event-filter').val();
                this.exportToCSV(eventId);
            });
        }

        /**
         * メール機能の設定
         */
        setupEmailFeatures() {
            $('#send-reminder-email').click((e) => {
                e.preventDefault();
                const eventId = $('#event-filter').val();
                this.sendReminderEmails(eventId);
            });
        }

        /**
         * 発表管理機能の設定
         */
        setupTalkManagement() {
            if (window.pagenow === 'lt_talk') {
                this.initTalkEditor();
            }
        }

        /**
         * 発表エディターの初期化
         */
        initTalkEditor() {
            // 発表時間の設定
            this.setupTalkDuration();
            
            // カテゴリー管理
            this.setupTalkCategories();
            
            // 発表者情報の自動入力
            this.setupSpeakerAutoComplete();
        }

        /**
         * カスタムフィールドの設定
         */
        setupCustomFields() {
            // 条件付き表示の設定
            this.setupConditionalFields();
            
            // リアルタイムバリデーション
            this.setupFieldValidation();
            
            // メタボックスの管理
            this.setupMetaBoxes();
        }

        /**
         * プレビュー機能の設定
         */
        setupPreview() {
            $('#lt-preview-button').click((e) => {
                e.preventDefault();
                this.openPreviewModal();
            });
        }

        /**
         * プレビューモーダルを開く
         */
        openPreviewModal() {
            const eventData = this.collectEventData();
            const previewHTML = this.generatePreviewHTML(eventData);
            
            // モーダルを作成して表示
            const modal = $(`
                <div id="lt-preview-modal" class="lt-modal">
                    <div class="lt-modal-content">
                        <span class="lt-close">&times;</span>
                        <h2>イベントプレビュー</h2>
                        <div class="lt-preview-content">
                            ${previewHTML}
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append(modal);
            modal.show();
            
            // 閉じるボタンの設定
            modal.find('.lt-close').click(() => {
                modal.remove();
            });
        }

        /**
         * エクスポート機能の設定
         */
        setupExport() {
            $('#export-participants').click((e) => {
                e.preventDefault();
                this.exportParticipants();
            });
        }

        /**
         * 通知機能の設定
         */
        setupNotifications() {
            // 成功/エラーメッセージの表示
            this.showAdminNotices();
            
            // リアルタイム通知の設定
            this.setupRealTimeNotifications();
        }

        /**
         * Google Meet URL生成
         */
        generateMeetUrl() {
            // 仮のGoogle Meet URL生成（実際の実装では適切なAPIを使用）
            const randomString = Math.random().toString(36).substring(2, 15);
            const meetUrl = `https://meet.google.com/${randomString}`;
            
            $('#online_url').val(meetUrl);
            this.showNotification('Google Meet URLを生成しました。', 'success');
        }

        /**
         * 容量インジケーターの更新
         */
        updateCapacityIndicator() {
            const maxParticipants = parseInt($('#max_participants').val()) || 0;
            const currentParticipants = parseInt($('#current_participants').text()) || 0;
            const percentage = maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;
            
            $('#capacity-indicator .capacity-bar').css('width', `${percentage}%`);
            $('#capacity-percentage').text(`${Math.round(percentage)}%`);
            
            // 80%を超えた場合の警告
            if (percentage > 80) {
                $('#capacity-indicator').addClass('warning');
            } else {
                $('#capacity-indicator').removeClass('warning');
            }
        }

        /**
         * イベントデータの収集
         */
        collectEventData() {
            return {
                title: $('#title').val(),
                date: $('#event_date').val(),
                venue: $('#venue_name').val(),
                venueAddress: $('#venue_address').val(),
                onlineUrl: $('#online_url').val(),
                capacity: $('#max_participants').val(),
                description: $('#content').val()
            };
        }

        /**
         * プレビューHTMLの生成
         */
        generatePreviewHTML(eventData) {
            return `
                <div class="lt-event-card">
                    <div class="date-highlight">
                        📅 ${eventData.date}
                    </div>
                    <h3>${eventData.title}</h3>
                    
                    <div class="venue-status">
                        <h4>📍 会場について</h4>
                        <p><strong>${eventData.venue}</strong></p>
                        <p>${eventData.venueAddress}</p>
                    </div>

                    <div class="online-info">
                        <h4>💻 オンライン参加も可能！</h4>
                        <p><strong>Google Meet:</strong> <a href="${eventData.onlineUrl}" target="_blank">参加リンク</a></p>
                    </div>

                    <div class="description">
                        ${eventData.description}
                    </div>
                </div>
            `;
        }

        /**
         * 一括承認
         */
        bulkApprove(selected) {
            const participantIds = selected.map(function() {
                return $(this).val();
            }).get();
            
            this.performBulkAction('approve', participantIds, '参加者を承認しました。');
        }

        /**
         * 一括削除
         */
        bulkDelete(selected) {
            if (!confirm('選択した参加者を削除しますか？この操作は取り消せません。')) {
                return;
            }
            
            const participantIds = selected.map(function() {
                return $(this).val();
            }).get();
            
            this.performBulkAction('delete', participantIds, '参加者を削除しました。');
        }

        /**
         * 一括操作の実行
         */
        performBulkAction(action, ids, successMessage) {
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: `lightningtalk_bulk_${action}`,
                    participant_ids: ids,
                    nonce: lightningtalk_admin.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.showNotification(successMessage, 'success');
                        location.reload();
                    } else {
                        this.showNotification('操作に失敗しました。', 'error');
                    }
                },
                error: () => {
                    this.showNotification('エラーが発生しました。', 'error');
                }
            });
        }

        /**
         * CSVエクスポート
         */
        exportToCSV(eventId) {
            window.location.href = `${ajaxurl}?action=lightningtalk_export_csv&event_id=${eventId}&nonce=${lightningtalk_admin.nonce}`;
        }

        /**
         * リマインダーメール送信
         */
        sendReminderEmails(eventId) {
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'lightningtalk_send_reminder',
                    event_id: eventId,
                    nonce: lightningtalk_admin.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.showNotification(`${response.data.sent_count}件のリマインダーメールを送信しました。`, 'success');
                    } else {
                        this.showNotification('メール送信に失敗しました。', 'error');
                    }
                }
            });
        }

        /**
         * 通知の表示
         */
        showNotification(message, type = 'info') {
            const notification = $(`
                <div class="notice notice-${type} is-dismissible">
                    <p>${message}</p>
                </div>
            `);
            
            $('.wrap h1').after(notification);
            
            // 3秒後に自動で消去
            setTimeout(() => {
                notification.fadeOut();
            }, 3000);
        }

        /**
         * 管理画面通知の表示
         */
        showAdminNotices() {
            // URLパラメーターから通知を取得
            const urlParams = new URLSearchParams(window.location.search);
            const message = urlParams.get('lt_message');
            const type = urlParams.get('lt_type') || 'success';
            
            if (message) {
                this.showNotification(decodeURIComponent(message), type);
            }
        }

        /**
         * リアルタイム通知の設定
         */
        setupRealTimeNotifications() {
            // WebSocket接続（将来の拡張用）
            // this.connectWebSocket();
        }
    }

    // Lightning Talk管理機能の初期化
    new LightningTalkAdmin();

})(jQuery);