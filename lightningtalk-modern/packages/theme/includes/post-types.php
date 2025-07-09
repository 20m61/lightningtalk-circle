<?php
/**
 * Lightning Talk Custom Post Types
 * 
 * @package LightningTalkChild
 */

// セキュリティ: 直接アクセス防止
if (!defined('ABSPATH')) {
    exit;
}

/**
 * カスタム投稿タイプ登録
 */
function lightningtalk_register_post_types() {
    
    // Lightning Talk イベント投稿タイプ
    register_post_type('lightningtalk_event', [
        'labels' => [
            'name' => __('Lightning Talk Events', 'lightningtalk-child'),
            'singular_name' => __('Lightning Talk Event', 'lightningtalk-child'),
            'add_new' => __('Add New Event', 'lightningtalk-child'),
            'add_new_item' => __('Add New Lightning Talk Event', 'lightningtalk-child'),
            'edit_item' => __('Edit Lightning Talk Event', 'lightningtalk-child'),
            'new_item' => __('New Lightning Talk Event', 'lightningtalk-child'),
            'view_item' => __('View Lightning Talk Event', 'lightningtalk-child'),
            'search_items' => __('Search Lightning Talk Events', 'lightningtalk-child'),
            'not_found' => __('No Lightning Talk Events found', 'lightningtalk-child'),
            'not_found_in_trash' => __('No Lightning Talk Events found in trash', 'lightningtalk-child'),
        ],
        'public' => true,
        'has_archive' => true,
        'supports' => ['title', 'editor', 'thumbnail', 'excerpt'],
        'menu_icon' => 'dashicons-microphone',
        'menu_position' => 25,
        'show_in_rest' => true,
        'rest_base' => 'lightningtalk_events',
        'capability_type' => 'post',
        'capabilities' => [
            'edit_post' => 'edit_lightningtalk_event',
            'read_post' => 'read_lightningtalk_event',
            'delete_post' => 'delete_lightningtalk_event',
            'edit_posts' => 'edit_lightningtalk_events',
            'edit_others_posts' => 'edit_others_lightningtalk_events',
            'publish_posts' => 'publish_lightningtalk_events',
            'read_private_posts' => 'read_private_lightningtalk_events',
        ],
        'rewrite' => [
            'slug' => 'lightning-talk-events',
            'with_front' => false
        ]
    ]);
    
    // Lightning Talk 発表投稿タイプ
    register_post_type('lightningtalk_talk', [
        'labels' => [
            'name' => __('Lightning Talks', 'lightningtalk-child'),
            'singular_name' => __('Lightning Talk', 'lightningtalk-child'),
            'add_new' => __('Add New Talk', 'lightningtalk-child'),
            'add_new_item' => __('Add New Lightning Talk', 'lightningtalk-child'),
            'edit_item' => __('Edit Lightning Talk', 'lightningtalk-child'),
            'new_item' => __('New Lightning Talk', 'lightningtalk-child'),
            'view_item' => __('View Lightning Talk', 'lightningtalk-child'),
            'search_items' => __('Search Lightning Talks', 'lightningtalk-child'),
            'not_found' => __('No Lightning Talks found', 'lightningtalk-child'),
            'not_found_in_trash' => __('No Lightning Talks found in trash', 'lightningtalk-child'),
        ],
        'public' => true,
        'has_archive' => true,
        'supports' => ['title', 'editor', 'thumbnail'],
        'menu_icon' => 'dashicons-megaphone',
        'menu_position' => 26,
        'show_in_rest' => true,
        'rest_base' => 'lightningtalk_talks',
        'capability_type' => 'post',
        'rewrite' => [
            'slug' => 'lightning-talks',
            'with_front' => false
        ]
    ]);
}
add_action('init', 'lightningtalk_register_post_types');

/**
 * カスタムタクソノミー登録
 */
function lightningtalk_register_taxonomies() {
    
    // 発表カテゴリー
    register_taxonomy('talk_category', 'lightningtalk_talk', [
        'labels' => [
            'name' => __('Talk Categories', 'lightningtalk-child'),
            'singular_name' => __('Talk Category', 'lightningtalk-child'),
            'add_new_item' => __('Add New Talk Category', 'lightningtalk-child'),
            'edit_item' => __('Edit Talk Category', 'lightningtalk-child'),
            'update_item' => __('Update Talk Category', 'lightningtalk-child'),
            'view_item' => __('View Talk Category', 'lightningtalk-child'),
            'search_items' => __('Search Talk Categories', 'lightningtalk-child'),
            'not_found' => __('No Talk Categories found', 'lightningtalk-child'),
        ],
        'hierarchical' => true,
        'public' => true,
        'show_ui' => true,
        'show_admin_column' => true,
        'show_in_nav_menus' => true,
        'show_tagcloud' => true,
        'show_in_rest' => true,
        'rest_base' => 'talk_categories',
        'rewrite' => [
            'slug' => 'talk-category',
            'with_front' => false
        ]
    ]);
    
    // イベントタグ
    register_taxonomy('event_tag', 'lightningtalk_event', [
        'labels' => [
            'name' => __('Event Tags', 'lightningtalk-child'),
            'singular_name' => __('Event Tag', 'lightningtalk-child'),
            'add_new_item' => __('Add New Event Tag', 'lightningtalk-child'),
            'edit_item' => __('Edit Event Tag', 'lightningtalk-child'),
            'update_item' => __('Update Event Tag', 'lightningtalk-child'),
            'view_item' => __('View Event Tag', 'lightningtalk-child'),
            'search_items' => __('Search Event Tags', 'lightningtalk-child'),
            'not_found' => __('No Event Tags found', 'lightningtalk-child'),
        ],
        'hierarchical' => false,
        'public' => true,
        'show_ui' => true,
        'show_admin_column' => true,
        'show_in_nav_menus' => true,
        'show_tagcloud' => true,
        'show_in_rest' => true,
        'rest_base' => 'event_tags',
        'rewrite' => [
            'slug' => 'event-tag',
            'with_front' => false
        ]
    ]);
}
add_action('init', 'lightningtalk_register_taxonomies');

/**
 * カスタムフィールド（メタボックス）
 */
function lightningtalk_add_meta_boxes() {
    
    // イベント詳細メタボックス
    add_meta_box(
        'lightningtalk_event_details',
        __('Event Details', 'lightningtalk-child'),
        'lightningtalk_event_details_callback',
        'lightningtalk_event',
        'normal',
        'high'
    );
    
    // 発表詳細メタボックス
    add_meta_box(
        'lightningtalk_talk_details',
        __('Talk Details', 'lightningtalk-child'),
        'lightningtalk_talk_details_callback',
        'lightningtalk_talk',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'lightningtalk_add_meta_boxes');

/**
 * イベント詳細メタボックスコールバック
 */
function lightningtalk_event_details_callback($post) {
    wp_nonce_field('lightningtalk_event_nonce', 'lightningtalk_event_nonce_field');
    
    $event_date = get_post_meta($post->ID, '_event_date', true);
    $event_time = get_post_meta($post->ID, '_event_time', true);
    $venue_name = get_post_meta($post->ID, '_venue_name', true);
    $venue_address = get_post_meta($post->ID, '_venue_address', true);
    $online_url = get_post_meta($post->ID, '_online_url', true);
    $max_participants = get_post_meta($post->ID, '_max_participants', true);
    $max_talks = get_post_meta($post->ID, '_max_talks', true) ?: 20;
    $registration_open = get_post_meta($post->ID, '_registration_open', true);
    $event_status = get_post_meta($post->ID, '_event_status', true) ?: 'draft';
    
    ?>
    <table class="form-table">
        <tr>
            <th><label for="event_date"><?php _e('Event Date', 'lightningtalk-child'); ?></label></th>
            <td><input type="date" id="event_date" name="event_date" value="<?php echo esc_attr($event_date); ?>" /></td>
        </tr>
        <tr>
            <th><label for="event_time"><?php _e('Event Time', 'lightningtalk-child'); ?></label></th>
            <td><input type="time" id="event_time" name="event_time" value="<?php echo esc_attr($event_time); ?>" /></td>
        </tr>
        <tr>
            <th><label for="venue_name"><?php _e('Venue Name', 'lightningtalk-child'); ?></label></th>
            <td><input type="text" id="venue_name" name="venue_name" value="<?php echo esc_attr($venue_name); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="venue_address"><?php _e('Venue Address', 'lightningtalk-child'); ?></label></th>
            <td><textarea id="venue_address" name="venue_address" rows="3" class="large-text"><?php echo esc_textarea($venue_address); ?></textarea></td>
        </tr>
        <tr>
            <th><label for="online_url"><?php _e('Online URL', 'lightningtalk-child'); ?></label></th>
            <td><input type="url" id="online_url" name="online_url" value="<?php echo esc_attr($online_url); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="max_participants"><?php _e('Max Participants', 'lightningtalk-child'); ?></label></th>
            <td><input type="number" id="max_participants" name="max_participants" value="<?php echo esc_attr($max_participants); ?>" min="1" /></td>
        </tr>
        <tr>
            <th><label for="max_talks"><?php _e('Max Talks', 'lightningtalk-child'); ?></label></th>
            <td><input type="number" id="max_talks" name="max_talks" value="<?php echo esc_attr($max_talks); ?>" min="1" /></td>
        </tr>
        <tr>
            <th><label for="registration_open"><?php _e('Registration Open', 'lightningtalk-child'); ?></label></th>
            <td>
                <select id="registration_open" name="registration_open">
                    <option value="yes" <?php selected($registration_open, 'yes'); ?>><?php _e('Yes', 'lightningtalk-child'); ?></option>
                    <option value="no" <?php selected($registration_open, 'no'); ?>><?php _e('No', 'lightningtalk-child'); ?></option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="event_status"><?php _e('Event Status', 'lightningtalk-child'); ?></label></th>
            <td>
                <select id="event_status" name="event_status">
                    <option value="draft" <?php selected($event_status, 'draft'); ?>><?php _e('Draft', 'lightningtalk-child'); ?></option>
                    <option value="upcoming" <?php selected($event_status, 'upcoming'); ?>><?php _e('Upcoming', 'lightningtalk-child'); ?></option>
                    <option value="ongoing" <?php selected($event_status, 'ongoing'); ?>><?php _e('Ongoing', 'lightningtalk-child'); ?></option>
                    <option value="completed" <?php selected($event_status, 'completed'); ?>><?php _e('Completed', 'lightningtalk-child'); ?></option>
                    <option value="cancelled" <?php selected($event_status, 'cancelled'); ?>><?php _e('Cancelled', 'lightningtalk-child'); ?></option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * 発表詳細メタボックスコールバック
 */
function lightningtalk_talk_details_callback($post) {
    wp_nonce_field('lightningtalk_talk_nonce', 'lightningtalk_talk_nonce_field');
    
    $speaker_name = get_post_meta($post->ID, '_speaker_name', true);
    $speaker_email = get_post_meta($post->ID, '_speaker_email', true);
    $event_id = get_post_meta($post->ID, '_event_id', true);
    $talk_duration = get_post_meta($post->ID, '_talk_duration', true) ?: 5;
    $talk_status = get_post_meta($post->ID, '_talk_status', true) ?: 'pending';
    
    // イベント一覧取得
    $events = get_posts([
        'post_type' => 'lightningtalk_event',
        'numberposts' => -1,
        'post_status' => 'publish'
    ]);
    
    ?>
    <table class="form-table">
        <tr>
            <th><label for="speaker_name"><?php _e('Speaker Name', 'lightningtalk-child'); ?></label></th>
            <td><input type="text" id="speaker_name" name="speaker_name" value="<?php echo esc_attr($speaker_name); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="speaker_email"><?php _e('Speaker Email', 'lightningtalk-child'); ?></label></th>
            <td><input type="email" id="speaker_email" name="speaker_email" value="<?php echo esc_attr($speaker_email); ?>" class="regular-text" /></td>
        </tr>
        <tr>
            <th><label for="event_id"><?php _e('Related Event', 'lightningtalk-child'); ?></label></th>
            <td>
                <select id="event_id" name="event_id">
                    <option value=""><?php _e('Select Event', 'lightningtalk-child'); ?></option>
                    <?php foreach ($events as $event): ?>
                        <option value="<?php echo $event->ID; ?>" <?php selected($event_id, $event->ID); ?>>
                            <?php echo esc_html($event->post_title); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="talk_duration"><?php _e('Duration (minutes)', 'lightningtalk-child'); ?></label></th>
            <td><input type="number" id="talk_duration" name="talk_duration" value="<?php echo esc_attr($talk_duration); ?>" min="1" max="30" /></td>
        </tr>
        <tr>
            <th><label for="talk_status"><?php _e('Talk Status', 'lightningtalk-child'); ?></label></th>
            <td>
                <select id="talk_status" name="talk_status">
                    <option value="pending" <?php selected($talk_status, 'pending'); ?>><?php _e('Pending', 'lightningtalk-child'); ?></option>
                    <option value="approved" <?php selected($talk_status, 'approved'); ?>><?php _e('Approved', 'lightningtalk-child'); ?></option>
                    <option value="rejected" <?php selected($talk_status, 'rejected'); ?>><?php _e('Rejected', 'lightningtalk-child'); ?></option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

/**
 * メタデータ保存
 */
function lightningtalk_save_meta_data($post_id) {
    // 自動保存時は処理しない
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    // 権限チェック
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // イベントメタデータ保存
    if (isset($_POST['lightningtalk_event_nonce_field']) && 
        wp_verify_nonce($_POST['lightningtalk_event_nonce_field'], 'lightningtalk_event_nonce')) {
        
        $event_fields = [
            'event_date', 'event_time', 'venue_name', 'venue_address', 
            'online_url', 'max_participants', 'max_talks', 'registration_open', 'event_status'
        ];
        
        foreach ($event_fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
            }
        }
    }
    
    // 発表メタデータ保存
    if (isset($_POST['lightningtalk_talk_nonce_field']) && 
        wp_verify_nonce($_POST['lightningtalk_talk_nonce_field'], 'lightningtalk_talk_nonce')) {
        
        $talk_fields = [
            'speaker_name', 'speaker_email', 'event_id', 'talk_duration', 'talk_status'
        ];
        
        foreach ($talk_fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
            }
        }
    }
}
add_action('save_post', 'lightningtalk_save_meta_data');

/**
 * 権限設定
 */
function lightningtalk_add_capabilities() {
    $roles = ['administrator', 'editor'];
    
    foreach ($roles as $role_name) {
        $role = get_role($role_name);
        if ($role) {
            $role->add_cap('edit_lightningtalk_event');
            $role->add_cap('read_lightningtalk_event');
            $role->add_cap('delete_lightningtalk_event');
            $role->add_cap('edit_lightningtalk_events');
            $role->add_cap('edit_others_lightningtalk_events');
            $role->add_cap('publish_lightningtalk_events');
            $role->add_cap('read_private_lightningtalk_events');
        }
    }
}
add_action('init', 'lightningtalk_add_capabilities');