<?php
/**
 * Lightning Talk Child Theme Functions
 * 
 * Modern WordPress child theme with Vite integration
 * 
 * @package LightningTalkChild
 * @version 1.0.0
 */

// セキュリティ: 直接アクセス防止
if (!defined('ABSPATH')) {
    exit;
}

// テーマ定数定義
define('LIGHTNINGTALK_CHILD_VERSION', '1.0.0');
define('LIGHTNINGTALK_CHILD_PATH', get_stylesheet_directory());
define('LIGHTNINGTALK_CHILD_URL', get_stylesheet_directory_uri());

/**
 * テーマセットアップ
 */
function lightningtalk_child_setup() {
    // 言語ファイル読み込み
    load_child_theme_textdomain('lightningtalk-child', LIGHTNINGTALK_CHILD_PATH . '/languages');
    
    // テーマサポート追加
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption']);
    add_theme_support('responsive-embeds');
    
    // Lightning Talk用メニュー登録
    register_nav_menus([
        'lightning-talk-menu' => __('Lightning Talk Menu', 'lightningtalk-child'),
    ]);
}
add_action('after_setup_theme', 'lightningtalk_child_setup');

/**
 * Vite統合アセット管理
 */
class LightningTalkViteIntegration {
    private $isDev;
    private $manifest;
    
    public function __construct() {
        $this->isDev = defined('WP_DEBUG') && WP_DEBUG && file_exists(LIGHTNINGTALK_CHILD_PATH . '/src');
        $this->loadManifest();
        
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets']);
    }
    
    private function loadManifest() {
        if (!$this->isDev) {
            $manifestPath = LIGHTNINGTALK_CHILD_PATH . '/dist/manifest.json';
            if (file_exists($manifestPath)) {
                $this->manifest = json_decode(file_get_contents($manifestPath), true);
            }
        }
    }
    
    public function enqueueAssets() {
        if ($this->isDev) {
            // 開発環境: Vite Dev Server
            wp_enqueue_script('vite-client', 'http://localhost:3000/@vite/client', [], null);
            wp_enqueue_script('lightningtalk-main', 'http://localhost:3000/src/main.ts', ['vite-client'], null);
            
            // HMR用設定
            wp_add_inline_script('vite-client', '
                if (import.meta.hot) {
                    import.meta.hot.on("vite:beforeUpdate", () => console.log("Updating..."));
                }
            ');
        } else {
            // 本番環境: ビルド済みアセット
            $this->enqueueProductionAssets();
        }
        
        // WordPress API データ提供
        wp_localize_script($this->isDev ? 'lightningtalk-main' : 'lightningtalk-theme', 'wpLightningTalk', [
            'apiUrl' => home_url('/wp-json/'),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => wp_get_current_user(),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'siteUrl' => get_site_url(),
            'themeUrl' => LIGHTNINGTALK_CHILD_URL,
        ]);
    }
    
    private function enqueueProductionAssets() {
        if (!$this->manifest) return;
        
        // メインJS
        if (isset($this->manifest['src/main.ts'])) {
            $mainJs = $this->manifest['src/main.ts'];
            wp_enqueue_script(
                'lightningtalk-theme',
                LIGHTNINGTALK_CHILD_URL . '/dist/' . $mainJs['file'],
                ['jquery'],
                LIGHTNINGTALK_CHILD_VERSION,
                true
            );
            
            // CSS
            if (isset($mainJs['css'])) {
                foreach ($mainJs['css'] as $cssFile) {
                    wp_enqueue_style(
                        'lightningtalk-theme-' . basename($cssFile, '.css'),
                        LIGHTNINGTALK_CHILD_URL . '/dist/' . $cssFile,
                        [],
                        LIGHTNINGTALK_CHILD_VERSION
                    );
                }
            }
        }
    }
    
    public function enqueueAdminAssets($hook) {
        // 管理画面用アセット
        if (strpos($hook, 'lightningtalk') !== false) {
            if ($this->isDev) {
                wp_enqueue_script('lightningtalk-admin', 'http://localhost:3000/src/admin.ts', ['vite-client'], null);
            } else {
                // 本番環境の管理画面アセット
                if ($this->manifest && isset($this->manifest['src/admin.ts'])) {
                    $adminJs = $this->manifest['src/admin.ts'];
                    wp_enqueue_script(
                        'lightningtalk-admin',
                        LIGHTNINGTALK_CHILD_URL . '/dist/' . $adminJs['file'],
                        ['jquery'],
                        LIGHTNINGTALK_CHILD_VERSION,
                        true
                    );
                }
            }
        }
    }
}

// Vite統合初期化
new LightningTalkViteIntegration();

/**
 * 追加機能読み込み
 */
require_once LIGHTNINGTALK_CHILD_PATH . '/includes/post-types.php';
require_once LIGHTNINGTALK_CHILD_PATH . '/includes/rest-api.php';
require_once LIGHTNINGTALK_CHILD_PATH . '/includes/shortcodes.php';
require_once LIGHTNINGTALK_CHILD_PATH . '/includes/admin.php';

/**
 * 子テーマカスタマイザー
 */
function lightningtalk_child_customize_register($wp_customize) {
    // Lightning Talk設定セクション
    $wp_customize->add_section('lightningtalk_settings', [
        'title' => __('Lightning Talk Settings', 'lightningtalk-child'),
        'priority' => 30,
    ]);
    
    // デフォルトイベント設定
    $wp_customize->add_setting('lightningtalk_default_event', [
        'default' => '',
        'sanitize_callback' => 'sanitize_text_field',
    ]);
    
    $wp_customize->add_control('lightningtalk_default_event', [
        'label' => __('Default Event ID', 'lightningtalk-child'),
        'section' => 'lightningtalk_settings',
        'type' => 'number',
    ]);
}
add_action('customize_register', 'lightningtalk_child_customize_register');