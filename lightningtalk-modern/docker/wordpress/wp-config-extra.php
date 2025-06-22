<?php
/**
 * WordPress 開発環境用追加設定
 */

// デバッグ設定
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', true);
define('SCRIPT_DEBUG', true);
define('SAVEQUERIES', true);

// 環境設定
define('WP_ENVIRONMENT_TYPE', 'development');

// CORS設定（開発環境用）
add_action('init', function() {
    // Vite Dev Server からのアクセスを許可
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $allowed_origins = [
            'http://localhost:3000',
            'http://localhost:3001', 
            'http://localhost:6006',
        ];
        
        if (in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce');
        }
    }
    
    // プリフライトリクエスト対応
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
});

// REST API 設定
add_filter('rest_authentication_errors', function($result) {
    // 開発環境では認証エラーを緩和
    if (WP_DEBUG && is_wp_error($result)) {
        return null;
    }
    return $result;
});

// メール設定（Mailhog使用）
add_action('phpmailer_init', function($phpmailer) {
    $phpmailer->isSMTP();
    $phpmailer->Host = 'mailhog';
    $phpmailer->Port = 1025;
    $phpmailer->SMTPAuth = false;
});

// 開発用ユーザー自動作成
add_action('wp_loaded', function() {
    if (!username_exists('developer')) {
        $user_id = wp_create_user('developer', 'developer123', 'developer@lightningtalk.local');
        if (!is_wp_error($user_id)) {
            $user = get_user_by('id', $user_id);
            $user->set_role('administrator');
        }
    }
});

// 自動ログイン（開発環境のみ）
if (WP_DEBUG && !is_user_logged_in() && isset($_GET['auto_login'])) {
    $user = get_user_by('login', 'developer');
    if ($user) {
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID);
        wp_redirect(remove_query_arg('auto_login'));
        exit;
    }
}