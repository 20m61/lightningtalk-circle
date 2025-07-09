<?php
/**
 * Lightning Talk Admin Functions
 * 
 * @package LightningTalkChild
 */

// セキュリティ: 直接アクセス防止
if (!defined('ABSPATH')) {
    exit;
}

/**
 * 管理画面メニュー追加
 */
function lightningtalk_admin_menu() {
    // メイン管理ページ
    add_menu_page(
        __('Lightning Talk', 'lightningtalk-child'),
        __('Lightning Talk', 'lightningtalk-child'),
        'manage_options',
        'lightningtalk-dashboard',
        'lightningtalk_dashboard_page',
        'dashicons-microphone',
        25
    );
    
    // サブメニュー
    add_submenu_page(
        'lightningtalk-dashboard',
        __('Dashboard', 'lightningtalk-child'),
        __('Dashboard', 'lightningtalk-child'),
        'manage_options',
        'lightningtalk-dashboard',
        'lightningtalk_dashboard_page'
    );
    
    add_submenu_page(
        'lightningtalk-dashboard',
        __('Participants', 'lightningtalk-child'),
        __('Participants', 'lightningtalk-child'),
        'manage_options',
        'lightningtalk-participants',
        'lightningtalk_participants_page'
    );
    
    add_submenu_page(
        'lightningtalk-dashboard',
        __('Analytics', 'lightningtalk-child'),
        __('Analytics', 'lightningtalk-child'),
        'manage_options',
        'lightningtalk-analytics',
        'lightningtalk_analytics_page'
    );
    
    add_submenu_page(
        'lightningtalk-dashboard',
        __('Settings', 'lightningtalk-child'),
        __('Settings', 'lightningtalk-child'),
        'manage_options',
        'lightningtalk-settings',
        'lightningtalk_settings_page'
    );
}
add_action('admin_menu', 'lightningtalk_admin_menu');

/**
 * ダッシュボードページ
 */
function lightningtalk_dashboard_page() {
    ?>
    <div class="wrap">
        <h1><?php _e('Lightning Talk Dashboard', 'lightningtalk-child'); ?></h1>
        
        <div id="lightningtalk-admin-dashboard">
            <div class="loading-spinner">
                <?php _e('Loading dashboard...', 'lightningtalk-child'); ?>
            </div>
        </div>
    </div>
    <?php
}

/**
 * 参加者管理ページ
 */
function lightningtalk_participants_page() {
    ?>
    <div class="wrap">
        <h1><?php _e('Participants Management', 'lightningtalk-child'); ?></h1>
        
        <div id="lightningtalk-admin-participants">
            <div class="loading-spinner">
                <?php _e('Loading participants...', 'lightningtalk-child'); ?>
            </div>
        </div>
    </div>
    <?php
}

/**
 * アナリティクスページ
 */
function lightningtalk_analytics_page() {
    ?>
    <div class="wrap">
        <h1><?php _e('Analytics', 'lightningtalk-child'); ?></h1>
        
        <div id="lightningtalk-admin-analytics">
            <div class="loading-spinner">
                <?php _e('Loading analytics...', 'lightningtalk-child'); ?>
            </div>
        </div>
    </div>
    <?php
}

/**
 * 設定ページ
 */
function lightningtalk_settings_page() {
    // 設定保存処理
    if (isset($_POST['submit']) && wp_verify_nonce($_POST['lightningtalk_settings_nonce'], 'lightningtalk_settings')) {
        $settings = [
            'default_event_id' => sanitize_text_field($_POST['default_event_id']),
            'enable_notifications' => isset($_POST['enable_notifications']) ? 'yes' : 'no',
            'max_participants_per_event' => intval($_POST['max_participants_per_event']),
            'max_talks_per_event' => intval($_POST['max_talks_per_event']),
            'auto_approve_talks' => isset($_POST['auto_approve_talks']) ? 'yes' : 'no',
            'email_notifications' => isset($_POST['email_notifications']) ? 'yes' : 'no',
            'registration_confirmation' => isset($_POST['registration_confirmation']) ? 'yes' : 'no'
        ];
        
        foreach ($settings as $key => $value) {
            update_option('lightningtalk_' . $key, $value);
        }
        
        echo '<div class="notice notice-success"><p>' . __('Settings saved successfully!', 'lightningtalk-child') . '</p></div>';
    }
    
    // 現在の設定取得
    $default_event_id = get_option('lightningtalk_default_event_id', '');
    $enable_notifications = get_option('lightningtalk_enable_notifications', 'yes');
    $max_participants = get_option('lightningtalk_max_participants_per_event', '100');
    $max_talks = get_option('lightningtalk_max_talks_per_event', '20');
    $auto_approve_talks = get_option('lightningtalk_auto_approve_talks', 'no');
    $email_notifications = get_option('lightningtalk_email_notifications', 'yes');
    $registration_confirmation = get_option('lightningtalk_registration_confirmation', 'yes');
    
    // イベント一覧取得
    $events = get_posts([
        'post_type' => 'lightningtalk_event',
        'numberposts' => -1,
        'post_status' => 'publish'
    ]);
    ?>
    <div class="wrap">
        <h1><?php _e('Lightning Talk Settings', 'lightningtalk-child'); ?></h1>
        
        <form method="post" action="">
            <?php wp_nonce_field('lightningtalk_settings', 'lightningtalk_settings_nonce'); ?>
            
            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="default_event_id"><?php _e('Default Event', 'lightningtalk-child'); ?></label>
                    </th>
                    <td>
                        <select id="default_event_id" name="default_event_id">
                            <option value=""><?php _e('Select Default Event', 'lightningtalk-child'); ?></option>
                            <?php foreach ($events as $event): ?>
                                <option value="<?php echo $event->ID; ?>" <?php selected($default_event_id, $event->ID); ?>>
                                    <?php echo esc_html($event->post_title); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                        <p class="description"><?php _e('Default event for shortcodes and widgets', 'lightningtalk-child'); ?></p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row"><?php _e('Notifications', 'lightningtalk-child'); ?></th>
                    <td>
                        <fieldset>
                            <label>
                                <input type="checkbox" name="enable_notifications" value="yes" <?php checked($enable_notifications, 'yes'); ?>>
                                <?php _e('Enable real-time notifications', 'lightningtalk-child'); ?>
                            </label>
                            <br>
                            <label>
                                <input type="checkbox" name="email_notifications" value="yes" <?php checked($email_notifications, 'yes'); ?>>
                                <?php _e('Send email notifications', 'lightningtalk-child'); ?>
                            </label>
                            <br>
                            <label>
                                <input type="checkbox" name="registration_confirmation" value="yes" <?php checked($registration_confirmation, 'yes'); ?>>
                                <?php _e('Send registration confirmation emails', 'lightningtalk-child'); ?>
                            </label>
                        </fieldset>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row">
                        <label for="max_participants_per_event"><?php _e('Max Participants per Event', 'lightningtalk-child'); ?></label>
                    </th>
                    <td>
                        <input type="number" id="max_participants_per_event" name="max_participants_per_event" 
                               value="<?php echo esc_attr($max_participants); ?>" min="1" class="small-text">
                        <p class="description"><?php _e('Default maximum number of participants per event', 'lightningtalk-child'); ?></p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row">
                        <label for="max_talks_per_event"><?php _e('Max Talks per Event', 'lightningtalk-child'); ?></label>
                    </th>
                    <td>
                        <input type="number" id="max_talks_per_event" name="max_talks_per_event" 
                               value="<?php echo esc_attr($max_talks); ?>" min="1" class="small-text">
                        <p class="description"><?php _e('Default maximum number of talks per event', 'lightningtalk-child'); ?></p>
                    </td>
                </tr>
                
                <tr>
                    <th scope="row"><?php _e('Talk Management', 'lightningtalk-child'); ?></th>
                    <td>
                        <fieldset>
                            <label>
                                <input type="checkbox" name="auto_approve_talks" value="yes" <?php checked($auto_approve_talks, 'yes'); ?>>
                                <?php _e('Auto-approve submitted talks', 'lightningtalk-child'); ?>
                            </label>
                            <p class="description"><?php _e('Automatically approve talks when submitted (not recommended for large events)', 'lightningtalk-child'); ?></p>
                        </fieldset>
                    </td>
                </tr>
            </table>
            
            <?php submit_button(); ?>
        </form>
        
        <h2><?php _e('System Information', 'lightningtalk-child'); ?></h2>
        <table class="widefat">
            <tbody>
                <tr>
                    <td><strong><?php _e('Theme Version', 'lightningtalk-child'); ?></strong></td>
                    <td><?php echo LIGHTNINGTALK_CHILD_VERSION; ?></td>
                </tr>
                <tr>
                    <td><strong><?php _e('WordPress Version', 'lightningtalk-child'); ?></strong></td>
                    <td><?php echo get_bloginfo('version'); ?></td>
                </tr>
                <tr>
                    <td><strong><?php _e('PHP Version', 'lightningtalk-child'); ?></strong></td>
                    <td><?php echo PHP_VERSION; ?></td>
                </tr>
                <tr>
                    <td><strong><?php _e('REST API Endpoint', 'lightningtalk-child'); ?></strong></td>
                    <td><?php echo rest_url('lightningtalk/v1/'); ?></td>
                </tr>
                <tr>
                    <td><strong><?php _e('Data Storage', 'lightningtalk-child'); ?></strong></td>
                    <td><?php echo wp_upload_dir()['basedir'] . '/lightningtalk-data/'; ?></td>
                </tr>
            </tbody>
        </table>
    </div>
    <?php
}

/**
 * 管理画面通知
 */
function lightningtalk_admin_notices() {
    // WordPress バージョンチェック
    if (version_compare(get_bloginfo('version'), '5.0', '<')) {
        echo '<div class="notice notice-warning"><p>';
        _e('Lightning Talk theme requires WordPress 5.0 or higher for optimal functionality.', 'lightningtalk-child');
        echo '</p></div>';
    }
    
    // REST API チェック
    if (!function_exists('rest_url')) {
        echo '<div class="notice notice-error"><p>';
        _e('REST API is required for Lightning Talk functionality.', 'lightningtalk-child');
        echo '</p></div>';
    }
}
add_action('admin_notices', 'lightningtalk_admin_notices');

/**
 * 管理画面カラムカスタマイズ
 */
function lightningtalk_custom_columns($columns) {
    $columns['event_date'] = __('Event Date', 'lightningtalk-child');
    $columns['venue'] = __('Venue', 'lightningtalk-child');
    $columns['status'] = __('Status', 'lightningtalk-child');
    $columns['participants'] = __('Participants', 'lightningtalk-child');
    return $columns;
}
add_filter('manage_lightningtalk_event_posts_columns', 'lightningtalk_custom_columns');

/**
 * カスタムカラムの内容
 */
function lightningtalk_custom_column_content($column, $post_id) {
    switch ($column) {
        case 'event_date':
            $event_date = get_post_meta($post_id, '_event_date', true);
            echo $event_date ? esc_html(date_i18n(get_option('date_format'), strtotime($event_date))) : '—';
            break;
            
        case 'venue':
            $venue_name = get_post_meta($post_id, '_venue_name', true);
            echo $venue_name ? esc_html($venue_name) : '—';
            break;
            
        case 'status':
            $status = get_post_meta($post_id, '_event_status', true);
            $status_labels = [
                'draft' => __('Draft', 'lightningtalk-child'),
                'upcoming' => __('Upcoming', 'lightningtalk-child'),
                'ongoing' => __('Ongoing', 'lightningtalk-child'),
                'completed' => __('Completed', 'lightningtalk-child'),
                'cancelled' => __('Cancelled', 'lightningtalk-child')
            ];
            echo isset($status_labels[$status]) ? esc_html($status_labels[$status]) : '—';
            break;
            
        case 'participants':
            // 参加者数をカウント（実装は簡易版）
            echo '—'; // 実際のカウント処理を実装
            break;
    }
}
add_action('manage_lightningtalk_event_posts_custom_column', 'lightningtalk_custom_column_content', 10, 2);

/**
 * ヘルプタブ追加
 */
function lightningtalk_add_help_tabs() {
    $screen = get_current_screen();
    
    if ($screen->post_type === 'lightningtalk_event') {
        $screen->add_help_tab([
            'id' => 'lightningtalk_help',
            'title' => __('Lightning Talk Events', 'lightningtalk-child'),
            'content' => '<p>' . __('Create and manage Lightning Talk events. Set event details, venue information, and registration settings.', 'lightningtalk-child') . '</p>'
        ]);
    }
}
add_action('load-post.php', 'lightningtalk_add_help_tabs');
add_action('load-post-new.php', 'lightningtalk_add_help_tabs');