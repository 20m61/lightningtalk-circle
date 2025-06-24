<?php
/**
 * Lightning Talk Shortcodes
 * WordPressショートコード機能
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

/**
 * ショートコードの登録
 */
function lightningtalk_register_shortcodes() {
    add_shortcode('lightning_talk_event', 'lightningtalk_event_shortcode');
    add_shortcode('lightning_talk_button', 'lightningtalk_button_shortcode');
    add_shortcode('lightning_talk_registration', 'lightningtalk_registration_shortcode');
    add_shortcode('lightning_talk_talks', 'lightningtalk_talks_shortcode');
    add_shortcode('lightning_talk_participants', 'lightningtalk_participants_shortcode');
    add_shortcode('lightning_talk_survey', 'lightningtalk_survey_shortcode');
    add_shortcode('lightning_talk_chat', 'lightningtalk_chat_shortcode');
    add_shortcode('lightning_talk_contact', 'lightningtalk_contact_shortcode');
    add_shortcode('lightning_talk_map', 'lightningtalk_map_shortcode');
}
add_action('init', 'lightningtalk_register_shortcodes');

/**
 * イベント表示ショートコード
 * [lightning_talk_event id="1" show="all"]
 */
function lightningtalk_event_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
        'show' => 'all', // all, info, registration, talks
        'style' => 'default'
    ), $atts, 'lightning_talk_event');
    
    $event_id = intval($atts['id']);
    if (!$event_id) {
        $event_id = get_theme_mod('lightningtalk_default_event_id', 1);
    }
    
    $event = get_post($event_id);
    if (!$event || $event->post_type !== 'lt_event') {
        return '<div class="lt-error">イベントが見つかりません。</div>';
    }
    
    ob_start();
    
    echo '<div class="lightningtalk-container">';
    echo '<div class="lt-event-display" data-event-id="' . esc_attr($event_id) . '">';
    
    // イベント情報表示
    if ($atts['show'] === 'all' || $atts['show'] === 'info') {
        echo lightningtalk_render_event_info($event);
    }
    
    // 登録フォーム表示
    if ($atts['show'] === 'all' || $atts['show'] === 'registration') {
        echo lightningtalk_render_registration_section($event);
    }
    
    // 発表一覧表示
    if ($atts['show'] === 'all' || $atts['show'] === 'talks') {
        echo lightningtalk_render_talks_section($event);
    }
    
    echo '</div>';
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * ボタンショートコード
 * [lightning_talk_button type="register" text="参加登録" style="primary"]
 */
function lightningtalk_button_shortcode($atts) {
    $atts = shortcode_atts(array(
        'type' => 'register',
        'text' => '参加登録',
        'style' => 'primary',
        'size' => 'medium',
        'event_id' => ''
    ), $atts, 'lightning_talk_button');
    
    $button_class = 'lt-btn';
    if ($atts['style'] !== 'primary') {
        $button_class .= ' lt-btn-' . esc_attr($atts['style']);
    }
    if ($atts['size'] !== 'medium') {
        $button_class .= ' lt-btn-' . esc_attr($atts['size']);
    }
    
    $data_attrs = '';
    if ($atts['event_id']) {
        $data_attrs .= ' data-event-id="' . esc_attr($atts['event_id']) . '"';
    }
    
    return sprintf(
        '<div class="lightningtalk-container"><button class="%s" data-action="%s"%s>%s</button></div>',
        esc_attr($button_class),
        esc_attr($atts['type']),
        $data_attrs,
        esc_html($atts['text'])
    );
}

/**
 * 登録フォームショートコード
 * [lightning_talk_registration event_id="1" type="general"]
 */
function lightningtalk_registration_shortcode($atts) {
    $atts = shortcode_atts(array(
        'event_id' => '',
        'type' => 'general', // general, listener, speaker
        'inline' => 'false'
    ), $atts, 'lightning_talk_registration');
    
    $event_id = intval($atts['event_id']);
    if (!$event_id) {
        $event_id = get_theme_mod('lightningtalk_default_event_id', 1);
    }
    
    ob_start();
    
    echo '<div class="lightningtalk-container">';
    echo '<div class="lt-registration-form-container" data-event-id="' . esc_attr($event_id) . '" data-type="' . esc_attr($atts['type']) . '">';
    
    if ($atts['inline'] === 'true') {
        echo lightningtalk_render_inline_registration_form($atts['type'], $event_id);
    } else {
        echo '<button class="lt-btn" data-action="wp-register" data-type="' . esc_attr($atts['type']) . '">';
        echo esc_html(lightningtalk_get_registration_button_text($atts['type']));
        echo '</button>';
    }
    
    echo '</div>';
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * 発表一覧ショートコード
 * [lightning_talk_talks event_id="1" category="tech" limit="10"]
 */
function lightningtalk_talks_shortcode($atts) {
    $atts = shortcode_atts(array(
        'event_id' => '',
        'category' => '',
        'limit' => '10',
        'show_speaker' => 'true',
        'show_category' => 'true'
    ), $atts, 'lightning_talk_talks');
    
    $event_id = intval($atts['event_id']);
    if (!$event_id) {
        $event_id = get_theme_mod('lightningtalk_default_event_id', 1);
    }
    
    $args = array(
        'post_type' => 'lt_talk',
        'post_status' => 'publish',
        'posts_per_page' => intval($atts['limit']),
        'meta_query' => array(
            array(
                'key' => 'event_id',
                'value' => $event_id,
                'compare' => '='
            )
        )
    );
    
    if ($atts['category']) {
        $args['meta_query'][] = array(
            'key' => 'category',
            'value' => $atts['category'],
            'compare' => '='
        );
    }
    
    $talks = get_posts($args);
    
    ob_start();
    
    echo '<div class="lightningtalk-container">';
    echo '<div class="lt-talks-list">';
    
    if ($talks) {
        foreach ($talks as $talk) {
            echo lightningtalk_render_talk_item($talk, $atts);
        }
    } else {
        echo '<p class="lt-no-talks">まだ発表が登録されていません。</p>';
    }
    
    echo '</div>';
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * 参加者数表示ショートコード
 * [lightning_talk_participants event_id="1" show="count"]
 */
function lightningtalk_participants_shortcode($atts) {
    $atts = shortcode_atts(array(
        'event_id' => '',
        'show' => 'count', // count, types, chart
        'style' => 'default'
    ), $atts, 'lightning_talk_participants');
    
    $event_id = intval($atts['event_id']);
    if (!$event_id) {
        $event_id = get_theme_mod('lightningtalk_default_event_id', 1);
    }
    
    $participants = get_posts(array(
        'post_type' => 'lt_participant',
        'post_status' => 'publish',
        'numberposts' => -1,
        'meta_query' => array(
            array(
                'key' => 'event_id',
                'value' => $event_id,
                'compare' => '='
            )
        )
    ));
    
    ob_start();
    
    echo '<div class="lightningtalk-container">';
    echo '<div class="lt-participants-display">';
    
    switch ($atts['show']) {
        case 'count':
            echo '<div class="lt-participant-count">';
            echo '<span class="count">' . count($participants) . '</span>';
            echo '<span class="label">名参加予定</span>';
            echo '</div>';
            break;
            
        case 'types':
            echo lightningtalk_render_participation_types($participants);
            break;
            
        case 'chart':
            echo lightningtalk_render_participants_chart($participants);
            break;
    }
    
    echo '</div>';
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * アンケートショートコード
 * [lightning_talk_survey event_id="1"]
 */
function lightningtalk_survey_shortcode($atts) {
    $atts = shortcode_atts(array(
        'event_id' => '',
        'title' => '参加アンケート',
        'show_results' => 'true'
    ), $atts, 'lightning_talk_survey');
    
    ob_start();
    
    echo '<div class="lightningtalk-container">';
    echo '<div class="lt-survey-section">';
    echo '<h4>' . esc_html($atts['title']) . '</h4>';
    echo '<div class="survey-buttons">';
    echo '<button class="lt-btn survey-btn" data-action="survey-online">';
    echo '💻 オンライン参加 <span id="onlineCount" class="count">0</span>';
    echo '</button>';
    echo '<button class="lt-btn survey-btn" data-action="survey-offline">';
    echo '🏢 現地参加 <span id="offlineCount" class="count">0</span>';
    echo '</button>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * ヘルパー関数: イベント情報の表示
 */
function lightningtalk_render_event_info($event) {
    $event_date = get_post_meta($event->ID, 'event_date', true);
    $venue_name = get_post_meta($event->ID, 'venue_name', true);
    $venue_address = get_post_meta($event->ID, 'venue_address', true);
    $online_url = get_post_meta($event->ID, 'online_url', true);
    
    ob_start();
    
    echo '<div class="lt-event-card lt-enhanced">';
    
    if ($event_date) {
        echo '<div class="date-highlight">';
        echo '📅 ' . esc_html(lightningtalk_format_event_date($event_date));
        echo '</div>';
    }
    
    echo '<h3>' . esc_html($event->post_title) . '</h3>';
    
    if ($venue_name) {
        echo '<div class="venue-status">';
        echo '<h4>📍 会場について</h4>';
        echo '<p><strong>' . esc_html($venue_name) . '</strong></p>';
        if ($venue_address) {
            echo '<p>' . esc_html($venue_address) . '</p>';
        }
        
        // 地図リンクの表示
        $map_url = get_post_meta($event->ID, 'map_url', true);
        if ($map_url) {
            echo '<p><a href="' . esc_url($map_url) . '" target="_blank" class="map-link">🗺️ 地図を見る</a></p>';
        }
        
        echo '<p>当日参加・飛び入り発表も大歓迎です！🎤</p>';
        echo '</div>';
        
        // 緊急連絡先の表示
        $emergency_phone = get_post_meta($event->ID, 'emergency_phone', true);
        if ($emergency_phone) {
            echo '<div class="emergency-contact">';
            echo '<h4>📞 緊急連絡先</h4>';
            echo '<a href="tel:' . esc_attr($emergency_phone) . '" class="phone-link">';
            echo '<span class="phone-icon">☎️</span>';
            echo esc_html($emergency_phone);
            echo '</a>';
            echo '</div>';
        }
    }
    
    if ($online_url) {
        echo '<div class="online-info">';
        echo '<h4>💻 オンライン参加も可能！</h4>';
        echo '<p><strong>Google Meet:</strong> <a href="' . esc_url($online_url) . '" target="_blank">参加リンク</a></p>';
        echo '</div>';
    }
    
    if ($event->post_content) {
        echo '<div class="event-description">';
        echo wp_kses_post($event->post_content);
        echo '</div>';
    }
    
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * ヘルパー関数: 登録セクションの表示
 */
function lightningtalk_render_registration_section($event) {
    ob_start();
    
    echo '<div class="action-buttons">';
    echo '<button class="lt-btn" data-action="wp-register" data-type="general">';
    echo '📝 当日参加申込み';
    echo '</button>';
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * ヘルパー関数: 発表セクションの表示
 */
function lightningtalk_render_talks_section($event) {
    $talks = get_posts(array(
        'post_type' => 'lt_talk',
        'post_status' => 'publish',
        'numberposts' => -1,
        'meta_query' => array(
            array(
                'key' => 'event_id',
                'value' => $event->ID,
                'compare' => '='
            )
        )
    ));
    
    ob_start();
    
    echo '<div class="lt-talks-section">';
    echo '<h3>📋 発表一覧</h3>';
    
    if ($talks) {
        echo '<div class="lt-talks-grid">';
        foreach ($talks as $talk) {
            echo lightningtalk_render_talk_item($talk);
        }
        echo '</div>';
    } else {
        echo '<p>まだ発表が登録されていません。</p>';
    }
    
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * ヘルパー関数: 発表アイテムの表示
 */
function lightningtalk_render_talk_item($talk, $options = array()) {
    $speaker = get_post_meta($talk->ID, 'speaker_name', true);
    $category = get_post_meta($talk->ID, 'category', true);
    $duration = get_post_meta($talk->ID, 'duration', true) ?: '5';
    
    $show_speaker = !isset($options['show_speaker']) || $options['show_speaker'] === 'true';
    $show_category = !isset($options['show_category']) || $options['show_category'] === 'true';
    
    ob_start();
    
    echo '<div class="lt-talk-item">';
    echo '<h4>' . esc_html($talk->post_title) . '</h4>';
    
    if ($show_speaker && $speaker) {
        echo '<p class="talk-speaker">🎤 ' . esc_html($speaker) . '</p>';
    }
    
    if ($show_category && $category) {
        $category_icon = lightningtalk_get_category_icon($category);
        echo '<p class="talk-category">' . $category_icon . ' ' . esc_html(lightningtalk_get_category_name($category)) . '</p>';
    }
    
    echo '<p class="talk-duration">⏱️ ' . esc_html($duration) . '分</p>';
    
    if ($talk->post_content) {
        echo '<div class="talk-description">';
        echo wp_kses_post(wp_trim_words($talk->post_content, 20));
        echo '</div>';
    }
    
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * ヘルパー関数: 日付フォーマット
 */
function lightningtalk_format_event_date($date_string) {
    $date = new DateTime($date_string);
    return $date->format('Y年n月j日（l） H:i〜');
}

/**
 * ヘルパー関数: カテゴリーアイコン取得
 */
function lightningtalk_get_category_icon($category) {
    $icons = array(
        'tech' => '💻',
        'hobby' => '🎨',
        'learning' => '📚',
        'travel' => '🌍',
        'food' => '🍳',
        'game' => '🎮',
        'lifehack' => '💡',
        'pet' => '🐱',
        'garden' => '🌱',
        'money' => '📈',
        'sports' => '🏃‍♂️',
        'music' => '🎵',
        'other' => '🌟'
    );
    
    return $icons[$category] ?? '🌟';
}

/**
 * ヘルパー関数: カテゴリー名取得
 */
function lightningtalk_get_category_name($category) {
    $names = array(
        'tech' => 'プログラミング・技術',
        'hobby' => '趣味・アート・創作',
        'learning' => '読書・学習体験',
        'travel' => '旅行・文化体験',
        'food' => '料理・グルメ',
        'game' => 'ゲーム・エンタメ',
        'lifehack' => 'ライフハック・効率化',
        'pet' => 'ペット・動物',
        'garden' => 'ガーデニング・植物',
        'money' => '投資・副業',
        'sports' => 'スポーツ・健康',
        'music' => '音楽・演奏',
        'other' => 'その他'
    );
    
    return $names[$category] ?? 'その他';
}

/**
 * ヘルパー関数: 登録ボタンテキスト取得
 */
function lightningtalk_get_registration_button_text($type) {
    $texts = array(
        'general' => '📝 参加登録',
        'listener' => '👥 聴講参加登録',
        'speaker' => '🎤 発表申込み'
    );
    
    return $texts[$type] ?? '📝 参加登録';
}

/**
 * チャットウィジェットショートコード
 * [lightning_talk_chat event_id="1"]
 */
function lightningtalk_chat_shortcode($atts) {
    $atts = shortcode_atts(array(
        'event_id' => '',
        'title' => 'イベントチャット',
        'welcome_message' => 'ようこそ！質問や感想をお気軽にどうぞ 🌟'
    ), $atts, 'lightning_talk_chat');
    
    $event_id = intval($atts['event_id']);
    if (!$event_id) {
        $event_id = get_theme_mod('lightningtalk_default_event_id', 1);
    }
    
    ob_start();
    
    echo '<div class="lightningtalk-container">';
    echo '<div id="chatWidget" class="chat-widget" data-event-id="' . esc_attr($event_id) . '">';
    echo '<button id="chatToggle" class="chat-toggle">';
    echo '💬 <span class="chat-notification-badge" style="display: none;">●</span>';
    echo '</button>';
    echo '<div id="chatContainer" class="chat-container" style="display: none;">';
    echo '<div class="chat-header">';
    echo '<h4>💬 ' . esc_html($atts['title']) . '</h4>';
    echo '<button class="chat-close">&times;</button>';
    echo '</div>';
    echo '<div id="chatMessages" class="chat-messages">';
    echo '<div class="chat-welcome">';
    echo esc_html($atts['welcome_message']);
    echo '</div>';
    echo '</div>';
    echo '<div class="chat-input-container">';
    echo '<input type="text" id="chatInput" class="chat-input" placeholder="メッセージを入力..." maxlength="200">';
    echo '<button id="chatSend" class="chat-send">送信</button>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * 緊急連絡先ショートコード
 * [lightning_talk_contact phone="080-4540-7479" email="contact@example.com"]
 */
function lightningtalk_contact_shortcode($atts) {
    $atts = shortcode_atts(array(
        'phone' => '080-4540-7479',
        'email' => '',
        'title' => '緊急連絡先',
        'show_phone' => 'true',
        'show_email' => 'true'
    ), $atts, 'lightning_talk_contact');
    
    ob_start();
    
    echo '<div class="lightningtalk-container">';
    echo '<div class="emergency-contact">';
    echo '<h4>📞 ' . esc_html($atts['title']) . '</h4>';
    
    if ($atts['show_phone'] === 'true' && $atts['phone']) {
        echo '<a href="tel:' . esc_attr($atts['phone']) . '" class="phone-link">';
        echo '<span class="phone-icon">☎️</span>';
        echo esc_html($atts['phone']);
        echo '</a>';
    }
    
    if ($atts['show_email'] === 'true' && $atts['email']) {
        echo '<a href="mailto:' . esc_attr($atts['email']) . '" class="email-link">';
        echo '<span class="email-icon">✉️</span>';
        echo esc_html($atts['email']);
        echo '</a>';
    }
    
    echo '</div>';
    echo '</div>';
    
    return ob_get_clean();
}

/**
 * 地図リンクショートコード
 * [lightning_talk_map url="https://maps.app.goo.gl/51TFv825jmuBsjbq5?g_st=ic" text="地図を見る"]
 */
function lightningtalk_map_shortcode($atts) {
    $atts = shortcode_atts(array(
        'url' => 'https://maps.app.goo.gl/51TFv825jmuBsjbq5?g_st=ic',
        'text' => '地図を見る',
        'icon' => '🗺️',
        'target' => '_blank',
        'class' => 'map-link'
    ), $atts, 'lightning_talk_map');
    
    if (!$atts['url']) {
        return '<div class="lt-error">地図URLが設定されていません。</div>';
    }
    
    ob_start();
    
    echo '<div class="lightningtalk-container">';
    echo '<a href="' . esc_url($atts['url']) . '" target="' . esc_attr($atts['target']) . '" class="' . esc_attr($atts['class']) . '">';
    echo esc_html($atts['icon']) . ' ' . esc_html($atts['text']);
    echo '</a>';
    echo '</div>';
    
    return ob_get_clean();
}