/**
 * DateTime Picker for WordPress Admin
 * WordPress管理画面用日時ピッカー
 */

(function($) {
    'use strict';

    /**
     * カスタム日時ピッカークラス
     */
    class LightningTalkDateTimePicker {
        constructor() {
            this.init();
        }

        init() {
            if (typeof $.fn.datetimepicker !== 'undefined') {
                this.setupDateTimePickers();
            } else {
                // jQuery UI Datepicker を使用
                this.setupBasicDatePickers();
            }
        }

        /**
         * 高機能日時ピッカーの設定
         */
        setupDateTimePickers() {
            $('.lt-datetime-picker').datetimepicker({
                dateFormat: 'yy-mm-dd',
                timeFormat: 'HH:mm:ss',
                stepMinute: 5,
                showSecond: false,
                onSelect: function(dateText, inst) {
                    // 選択後のコールバック
                    $(this).trigger('ltDateTimeChange', [dateText]);
                }
            });
        }

        /**
         * 基本的な日付ピッカーの設定
         */
        setupBasicDatePickers() {
            $('.lt-date-picker').datepicker({
                dateFormat: 'yy-mm-dd',
                changeMonth: true,
                changeYear: true,
                onSelect: function(dateText, inst) {
                    $(this).trigger('ltDateChange', [dateText]);
                }
            });

            $('.lt-time-picker').timepicker({
                timeFormat: 'HH:mm:ss',
                stepMinute: 5,
                showSecond: false
            });
        }
    }

    // WordPress管理画面で初期化
    $(document).ready(function() {
        if (window.pagenow && (
            window.pagenow.includes('lt_event') || 
            window.pagenow.includes('lightningtalk')
        )) {
            new LightningTalkDateTimePicker();
        }
    });

})(jQuery);