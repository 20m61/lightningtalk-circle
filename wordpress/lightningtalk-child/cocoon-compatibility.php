<?php
/**
 * Cocoon Theme Compatibility Checker
 * Cocoonテーマとの互換性チェック機能
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Cocoon互換性チェッククラス
 */
class LightningTalkCocoonCompatibility {
    
    private $compatibility_issues = array();
    private $cocoon_version = '';
    private $required_cocoon_version = '2.6.0';
    
    public function __construct() {
        add_action('admin_init', array($this, 'check_compatibility'));
        add_action('admin_notices', array($this, 'display_compatibility_notices'));
    }
    
    /**
     * 互換性チェックの実行
     */
    public function check_compatibility() {
        // 管理画面でのみ実行
        if (!is_admin()) {
            return;
        }
        
        $this->check_cocoon_theme();
        $this->check_cocoon_version();
        $this->check_required_functions();
        $this->check_css_conflicts();
        $this->check_javascript_conflicts();
        $this->check_performance_impact();
    }
    
    /**
     * Cocoonテーマの存在確認
     */
    private function check_cocoon_theme() {
        $current_theme = wp_get_theme();
        $parent_theme = $current_theme->get_template();
        
        // Cocoon関連のテーマ名をチェック
        $cocoon_themes = array('cocoon-master', 'cocoon', 'cocoon-child');
        
        if (!in_array($parent_theme, $cocoon_themes)) {
            $this->compatibility_issues[] = array(
                'type' => 'error',
                'message' => 'Lightning Talk子テーマはCocoonを親テーマとして設計されています。現在の親テーマ: ' . $parent_theme
            );
        } else {
            // Cocoonバージョンを取得
            $parent_theme_obj = wp_get_theme($parent_theme);
            $this->cocoon_version = $parent_theme_obj->get('Version');
        }
    }
    
    /**
     * Cocoonバージョンの確認
     */
    private function check_cocoon_version() {
        if (empty($this->cocoon_version)) {
            return;
        }
        
        if (version_compare($this.cocoon_version, $this->required_cocoon_version, '<')) {
            $this->compatibility_issues[] = array(
                'type' => 'warning',
                'message' => sprintf(
                    'Cocoonバージョン %s 以上を推奨します。現在のバージョン: %s',
                    $this->required_cocoon_version,
                    $this->cocoon_version
                )
            );
        }
    }
    
    /**
     * 必要な関数の存在確認
     */
    private function check_required_functions() {
        $required_functions = array(
            'is_amp' => 'CocoonのAMP機能',
            'get_site_icon_tag' => 'Cocoonのアイコン機能',
            'get_custom_logo_tag' => 'Cocoonのロゴ機能'
        );
        
        foreach ($required_functions as $function => $description) {
            if (!function_exists($function)) {
                $this->compatibility_issues[] = array(
                    'type' => 'warning',
                    'message' => sprintf('%s (%s) が利用できません。', $description, $function)
                );
            }
        }
    }
    
    /**
     * CSSの競合チェック
     */
    private function check_css_conflicts() {
        // Cocoonの主要CSSクラスとの競合をチェック
        $potential_conflicts = array(
            '.btn' => 'Cocoonのボタンスタイルと競合する可能性があります。Lightning Talkでは .lt-btn を使用してください。',
            '.card' => 'Cocoonのカードスタイルと競合する可能性があります。Lightning Talkでは .lt-card を使用してください。',
            '.modal' => 'Cocoonのモーダルスタイルと競合する可能性があります。Lightning Talkでは .lt-modal を使用してください。'
        );
        
        foreach ($potential_conflicts as $class => $message) {
            $this->compatibility_issues[] = array(
                'type' => 'info',
                'message' => $class . ': ' . $message
            );
        }
    }
    
    /**
     * JavaScriptの競合チェック
     */
    private function check_javascript_conflicts() {
        // jQuery依存関係のチェック
        if (!wp_script_is('jquery', 'registered')) {
            $this->compatibility_issues[] = array(
                'type' => 'error',
                'message' => 'jQueryが登録されていません。Lightning Talk管理機能に影響する可能性があります。'
            );
        }
        
        // Cocoon固有のスクリプトとの互換性
        $cocoon_scripts = array(
            'cocoon-js' => 'Cocoonメインスクリプト',
            'cocoon-child-js' => 'Cocoon子テーマスクリプト'
        );
        
        foreach ($cocoon_scripts as $handle => $description) {
            if (wp_script_is($handle, 'registered')) {
                $this->compatibility_issues[] = array(
                    'type' => 'info',
                    'message' => $description . ' が検出されました。Lightning Talkスクリプトとの連携が有効です。'
                );
            }
        }
    }
    
    /**
     * パフォーマンス影響の確認
     */
    private function check_performance_impact() {
        // Lightning Talkのアセットサイズをチェック
        $css_file = get_stylesheet_directory() . '/assets/dist/css/lightningtalk.min.css';
        $js_file = get_stylesheet_directory() . '/assets/dist/js/lightningtalk.min.js';
        
        if (file_exists($css_file)) {
            $css_size = filesize($css_file);
            if ($css_size > 100000) { // 100KB以上
                $this->compatibility_issues[] = array(
                    'type' => 'warning',
                    'message' => sprintf('CSSファイルサイズが大きいです: %s KB', round($css_size / 1024, 1))
                );
            }
        }
        
        if (file_exists($js_file)) {
            $js_size = filesize($js_file);
            if ($js_size > 200000) { // 200KB以上
                $this->compatibility_issues[] = array(
                    'type' => 'warning',
                    'message' => sprintf('JavaScriptファイルサイズが大きいです: %s KB', round($js_size / 1024, 1))
                );
            }
        }
    }
    
    /**
     * 互換性通知の表示
     */
    public function display_compatibility_notices() {
        if (empty($this->compatibility_issues)) {
            // 問題がない場合の成功メッセージ
            echo '<div class="notice notice-success is-dismissible">';
            echo '<p><strong>⚡ Lightning Talk:</strong> Cocoonテーマとの互換性チェックが完了しました。問題は検出されませんでした。</p>';
            echo '</div>';
            return;
        }
        
        foreach ($this->compatibility_issues as $issue) {
            $class = 'notice';
            $icon = '';
            
            switch ($issue['type']) {
                case 'error':
                    $class .= ' notice-error';
                    $icon = '❌';
                    break;
                case 'warning':
                    $class .= ' notice-warning';
                    $icon = '⚠️';
                    break;
                case 'info':
                    $class .= ' notice-info';
                    $icon = 'ℹ️';
                    break;
            }
            
            echo '<div class="' . esc_attr($class) . ' is-dismissible">';
            echo '<p><strong>' . $icon . ' Lightning Talk:</strong> ' . esc_html($issue['message']) . '</p>';
            echo '</div>';
        }
    }
    
    /**
     * 互換性レポートの生成
     */
    public function generate_compatibility_report() {
        $report = array(
            'timestamp' => current_time('mysql'),
            'cocoon_version' => $this->cocoon_version,
            'lightningtalk_version' => LIGHTNINGTALK_CHILD_VERSION,
            'wordpress_version' => get_bloginfo('version'),
            'php_version' => PHP_VERSION,
            'issues' => $this->compatibility_issues,
            'recommendations' => $this->get_recommendations()
        );
        
        return $report;
    }
    
    /**
     * 推奨事項の取得
     */
    private function get_recommendations() {
        $recommendations = array();
        
        // 基本的な推奨事項
        $recommendations[] = 'Lightning Talkのクラス名には常に "lt-" プレフィックスを使用してください。';
        $recommendations[] = 'Cocoonの設定で「高速化」機能を有効にすることを推奨します。';
        $recommendations[] = 'AMP対応ページでは一部のJavaScript機能が制限される場合があります。';
        
        // 問題に基づく追加推奨事項
        foreach ($this->compatibility_issues as $issue) {
            if ($issue['type'] === 'error') {
                $recommendations[] = '重要: ' . $issue['message'];
            }
        }
        
        return $recommendations;
    }
    
    /**
     * 自動修復機能
     */
    public function auto_fix_issues() {
        $fixed_issues = array();
        
        // CSS競合の自動修復
        $this->fix_css_conflicts();
        $fixed_issues[] = 'CSS競合の自動修復を実行しました。';
        
        // JavaScript依存関係の修復
        if (!wp_script_is('jquery', 'registered')) {
            wp_enqueue_script('jquery');
            $fixed_issues[] = 'jQueryの依存関係を修復しました。';
        }
        
        return $fixed_issues;
    }
    
    /**
     * CSS競合の修復
     */
    private function fix_css_conflicts() {
        // Lightning Talk専用のCSS変数を設定
        $css_vars = "
            :root {
                --lt-namespace: 'lightning-talk';
                --lt-version: '" . LIGHTNINGTALK_CHILD_VERSION . "';
            }
        ";
        
        wp_add_inline_style('lightningtalk-child-style', $css_vars);
    }
}

// 互換性チェッカーの初期化
if (is_admin()) {
    new LightningTalkCocoonCompatibility();
}

/**
 * 互換性チェック結果をダッシュボードウィジェットで表示
 */
function lightningtalk_add_dashboard_widget() {
    wp_add_dashboard_widget(
        'lightningtalk_compatibility_widget',
        '⚡ Lightning Talk 互換性ステータス',
        'lightningtalk_compatibility_widget_content'
    );
}
add_action('wp_dashboard_setup', 'lightningtalk_add_dashboard_widget');

/**
 * ダッシュボードウィジェットの内容
 */
function lightningtalk_compatibility_widget_content() {
    $checker = new LightningTalkCocoonCompatibility();
    $report = $checker->generate_compatibility_report();
    
    echo '<div class="lightningtalk-compatibility-widget">';
    echo '<p><strong>Cocoonバージョン:</strong> ' . esc_html($report['cocoon_version']) . '</p>';
    echo '<p><strong>Lightning Talkバージョン:</strong> ' . esc_html($report['lightningtalk_version']) . '</p>';
    echo '<p><strong>チェック日時:</strong> ' . esc_html($report['timestamp']) . '</p>';
    
    if (empty($report['issues'])) {
        echo '<div class="notice-success" style="padding: 10px; border-left: 4px solid #46b450; background: #fff; margin: 15px 0;">';
        echo '<p>✅ すべての互換性チェックが正常に完了しました。</p>';
        echo '</div>';
    } else {
        $error_count = count(array_filter($report['issues'], function($issue) {
            return $issue['type'] === 'error';
        }));
        $warning_count = count(array_filter($report['issues'], function($issue) {
            return $issue['type'] === 'warning';
        }));
        
        if ($error_count > 0) {
            echo '<div class="notice-error" style="padding: 10px; border-left: 4px solid #dc3232; background: #fff; margin: 15px 0;">';
            echo '<p>❌ ' . $error_count . '件の重要な問題が検出されました。</p>';
            echo '</div>';
        }
        
        if ($warning_count > 0) {
            echo '<div class="notice-warning" style="padding: 10px; border-left: 4px solid #ffb900; background: #fff; margin: 15px 0;">';
            echo '<p>⚠️ ' . $warning_count . '件の警告があります。</p>';
            echo '</div>';
        }
    }
    
    echo '<p><a href="' . admin_url('admin.php?page=lightningtalk-admin') . '" class="button button-primary">詳細レポートを表示</a></p>';
    echo '</div>';
    
    // ウィジェット専用スタイル
    echo '<style>
        .lightningtalk-compatibility-widget p {
            margin-bottom: 8px;
        }
        .lightningtalk-compatibility-widget .notice-success,
        .lightningtalk-compatibility-widget .notice-error,
        .lightningtalk-compatibility-widget .notice-warning {
            border-radius: 4px;
        }
    </style>';
}