<?php
/**
 * Lightning Talk Shortcodes
 * 
 * @package LightningTalkChild
 */

// セキュリティ: 直接アクセス防止
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Lightning Talk イベント表示ショートコード
 * Usage: [lightningtalk_event id="123" type="card"]
 */
function lightningtalk_event_shortcode($atts) {
    $atts = shortcode_atts([
        'id' => '',
        'type' => 'card',
        'show_registration' => 'true'
    ], $atts);
    
    if (empty($atts['id'])) {
        return '<p>' . __('Event ID is required', 'lightningtalk-child') . '</p>';
    }
    
    $event = get_post($atts['id']);
    if (!$event || $event->post_type !== 'lightningtalk_event') {
        return '<p>' . __('Event not found', 'lightningtalk-child') . '</p>';
    }
    
    $event_date = get_post_meta($event->ID, '_event_date', true);
    $venue_name = get_post_meta($event->ID, '_venue_name', true);
    $registration_open = get_post_meta($event->ID, '_registration_open', true);
    
    ob_start();
    ?>
    <div class="lightningtalk-event" data-event-id="<?php echo esc_attr($event->ID); ?>" data-display-type="<?php echo esc_attr($atts['type']); ?>">
        <h3 class="event-title"><?php echo esc_html($event->post_title); ?></h3>
        
        <?php if ($atts['type'] === 'card'): ?>
            <div class="event-card">
                <?php if (has_post_thumbnail($event->ID)): ?>
                    <div class="event-thumbnail">
                        <?php echo get_the_post_thumbnail($event->ID, 'medium'); ?>
                    </div>
                <?php endif; ?>
                
                <div class="event-content">
                    <div class="event-meta">
                        <?php if ($event_date): ?>
                            <span class="event-date">
                                <i class="dashicons dashicons-calendar-alt"></i>
                                <?php echo esc_html(date_i18n(get_option('date_format'), strtotime($event_date))); ?>
                            </span>
                        <?php endif; ?>
                        
                        <?php if ($venue_name): ?>
                            <span class="event-venue">
                                <i class="dashicons dashicons-location"></i>
                                <?php echo esc_html($venue_name); ?>
                            </span>
                        <?php endif; ?>
                    </div>
                    
                    <div class="event-description">
                        <?php echo wp_kses_post($event->post_excerpt ?: wp_trim_words($event->post_content, 30)); ?>
                    </div>
                    
                    <?php if ($atts['show_registration'] === 'true' && $registration_open === 'yes'): ?>
                        <div class="event-registration">
                            <button class="btn btn-primary" onclick="openRegistrationModal(<?php echo esc_attr($event->ID); ?>)">
                                <?php _e('Register Now', 'lightningtalk-child'); ?>
                            </button>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        <?php else: ?>
            <div class="event-list-item">
                <span class="event-date"><?php echo esc_html($event_date); ?></span>
                <span class="event-title"><?php echo esc_html($event->post_title); ?></span>
                <span class="event-venue"><?php echo esc_html($venue_name); ?></span>
            </div>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('lightningtalk_event', 'lightningtalk_event_shortcode');

/**
 * Lightning Talk 登録フォームショートコード
 * Usage: [lightningtalk_registration event_id="123"]
 */
function lightningtalk_registration_shortcode($atts) {
    $atts = shortcode_atts([
        'event_id' => '',
        'type' => 'full'
    ], $atts);
    
    if (empty($atts['event_id'])) {
        return '<p>' . __('Event ID is required', 'lightningtalk-child') . '</p>';
    }
    
    $event = get_post($atts['event_id']);
    if (!$event || $event->post_type !== 'lightningtalk_event') {
        return '<p>' . __('Event not found', 'lightningtalk-child') . '</p>';
    }
    
    $registration_open = get_post_meta($event->ID, '_registration_open', true);
    if ($registration_open !== 'yes') {
        return '<p>' . __('Registration is currently closed', 'lightningtalk-child') . '</p>';
    }
    
    ob_start();
    ?>
    <div id="lightningtalk-registration" data-event-id="<?php echo esc_attr($atts['event_id']); ?>">
        <div class="registration-form-container">
            <h3><?php _e('Event Registration', 'lightningtalk-child'); ?></h3>
            
            <form id="lightningtalk-registration-form" class="lightningtalk-form">
                <input type="hidden" name="event_id" value="<?php echo esc_attr($atts['event_id']); ?>">
                
                <div class="form-group">
                    <label for="participant_name"><?php _e('Name', 'lightningtalk-child'); ?> *</label>
                    <input type="text" id="participant_name" name="name" required>
                </div>
                
                <div class="form-group">
                    <label for="participant_email"><?php _e('Email', 'lightningtalk-child'); ?> *</label>
                    <input type="email" id="participant_email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="participation_type"><?php _e('Participation Type', 'lightningtalk-child'); ?> *</label>
                    <select id="participation_type" name="participationType" required>
                        <option value=""><?php _e('Select participation type', 'lightningtalk-child'); ?></option>
                        <option value="onsite"><?php _e('On-site', 'lightningtalk-child'); ?></option>
                        <option value="online"><?php _e('Online', 'lightningtalk-child'); ?></option>
                        <option value="undecided"><?php _e('Undecided', 'lightningtalk-child'); ?></option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="emergency_contact"><?php _e('Emergency Contact', 'lightningtalk-child'); ?></label>
                    <input type="text" id="emergency_contact" name="emergencyContact">
                </div>
                
                <div class="form-group">
                    <label for="dietary_restrictions"><?php _e('Dietary Restrictions', 'lightningtalk-child'); ?></label>
                    <textarea id="dietary_restrictions" name="dietaryRestrictions" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="wants_to_speak" value="yes">
                        <?php _e('I would like to give a Lightning Talk', 'lightningtalk-child'); ?>
                    </label>
                </div>
                
                <div class="form-group talk-details" style="display: none;">
                    <h4><?php _e('Talk Details', 'lightningtalk-child'); ?></h4>
                    
                    <div class="form-group">
                        <label for="talk_title"><?php _e('Talk Title', 'lightningtalk-child'); ?></label>
                        <input type="text" id="talk_title" name="talkTitle">
                    </div>
                    
                    <div class="form-group">
                        <label for="talk_description"><?php _e('Talk Description', 'lightningtalk-child'); ?></label>
                        <textarea id="talk_description" name="talkDescription" rows="4"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="talk_category"><?php _e('Category', 'lightningtalk-child'); ?></label>
                        <select id="talk_category" name="talkCategory">
                            <option value=""><?php _e('Select category', 'lightningtalk-child'); ?></option>
                            <option value="tech"><?php _e('Technology', 'lightningtalk-child'); ?></option>
                            <option value="hobby"><?php _e('Hobby', 'lightningtalk-child'); ?></option>
                            <option value="learning"><?php _e('Learning', 'lightningtalk-child'); ?></option>
                            <option value="travel"><?php _e('Travel', 'lightningtalk-child'); ?></option>
                            <option value="food"><?php _e('Food', 'lightningtalk-child'); ?></option>
                            <option value="other"><?php _e('Other', 'lightningtalk-child'); ?></option>
                        </select>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        <?php _e('Register', 'lightningtalk-child'); ?>
                    </button>
                </div>
                
                <div class="form-messages"></div>
            </form>
        </div>
    </div>
    
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const wantsToSpeakCheckbox = document.querySelector('input[name="wants_to_speak"]');
        const talkDetails = document.querySelector('.talk-details');
        
        if (wantsToSpeakCheckbox && talkDetails) {
            wantsToSpeakCheckbox.addEventListener('change', function() {
                talkDetails.style.display = this.checked ? 'block' : 'none';
            });
        }
    });
    </script>
    <?php
    return ob_get_clean();
}
add_shortcode('lightningtalk_registration', 'lightningtalk_registration_shortcode');

/**
 * Lightning Talk 一覧表示ショートコード
 * Usage: [lightningtalk_events limit="5" category="tech"]
 */
function lightningtalk_events_shortcode($atts) {
    $atts = shortcode_atts([
        'limit' => 5,
        'category' => '',
        'status' => 'upcoming',
        'orderby' => 'meta_value',
        'meta_key' => '_event_date',
        'order' => 'ASC'
    ], $atts);
    
    $query_args = [
        'post_type' => 'lightningtalk_event',
        'post_status' => 'publish',
        'posts_per_page' => intval($atts['limit']),
        'orderby' => $atts['orderby'],
        'order' => $atts['order']
    ];
    
    if ($atts['meta_key']) {
        $query_args['meta_key'] = $atts['meta_key'];
    }
    
    if ($atts['status']) {
        $query_args['meta_query'] = [
            [
                'key' => '_event_status',
                'value' => $atts['status'],
                'compare' => '='
            ]
        ];
    }
    
    if ($atts['category']) {
        $query_args['tax_query'] = [
            [
                'taxonomy' => 'event_tag',
                'field' => 'slug',
                'terms' => $atts['category']
            ]
        ];
    }
    
    $events = new WP_Query($query_args);
    
    if (!$events->have_posts()) {
        return '<p>' . __('No events found', 'lightningtalk-child') . '</p>';
    }
    
    ob_start();
    ?>
    <div class="lightningtalk-events-list">
        <?php while ($events->have_posts()): $events->the_post(); ?>
            <?php echo lightningtalk_event_shortcode(['id' => get_the_ID(), 'type' => 'card']); ?>
        <?php endwhile; ?>
    </div>
    <?php
    wp_reset_postdata();
    return ob_get_clean();
}
add_shortcode('lightningtalk_events', 'lightningtalk_events_shortcode');

/**
 * Lightning Talk 統計表示ショートコード
 * Usage: [lightningtalk_stats event_id="123"]
 */
function lightningtalk_stats_shortcode($atts) {
    $atts = shortcode_atts([
        'event_id' => '',
        'type' => 'summary'
    ], $atts);
    
    if (empty($atts['event_id'])) {
        return '<p>' . __('Event ID is required', 'lightningtalk-child') . '</p>';
    }
    
    // 統計データは REST API から取得
    ob_start();
    ?>
    <div class="lightningtalk-stats" data-event-id="<?php echo esc_attr($atts['event_id']); ?>" data-type="<?php echo esc_attr($atts['type']); ?>">
        <div class="stats-loading"><?php _e('Loading statistics...', 'lightningtalk-child'); ?></div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('lightningtalk_stats', 'lightningtalk_stats_shortcode');