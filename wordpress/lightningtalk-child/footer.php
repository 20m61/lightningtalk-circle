<?php
/**
 * Lightning Talk Pro Theme - Footer Template
 * Version: 1.1.0
 */
?>

    </div><!-- #content -->

    <footer id="colophon" class="site-footer">
        <div class="footer-container">
            
            <!-- フッターメイン -->
            <div class="footer-main">
                <div class="footer-widgets">
                    
                    <!-- Lightning Talk 情報 -->
                    <div class="footer-widget">
                        <h3 class="widget-title">⚡ Lightning Talk Circle</h3>
                        <p class="footer-description">
                            5分間で世界を変える。<br>
                            あなたのアイデア、知識、体験を共有し、新しい出会いと学びを生み出すコミュニティです。
                        </p>
                        
                        <div class="footer-stats">
                            <?php echo do_shortcode('[lightning_talk_stats type="simple"]'); ?>
                        </div>
                    </div>
                    
                    <!-- クイックリンク -->
                    <div class="footer-widget">
                        <h3 class="widget-title">クイックリンク</h3>
                        <ul class="footer-menu">
                            <li><a href="<?php echo esc_url(home_url('/about/')); ?>">Lightning Talk とは？</a></li>
                            <li><a href="<?php echo esc_url(home_url('/events/')); ?>">イベント一覧</a></li>
                            <li><a href="<?php echo esc_url(home_url('/faq/')); ?>">よくある質問</a></li>
                            <li><a href="<?php echo esc_url(home_url('/news/')); ?>">お知らせ</a></li>
                            <li><a href="<?php echo esc_url(home_url('/community-guidelines/')); ?>">コミュニティガイドライン</a></li>
                        </ul>
                    </div>
                    
                    <!-- 参加方法 -->
                    <div class="footer-widget">
                        <h3 class="widget-title">参加方法</h3>
                        <div class="participation-links">
                            <a href="#events" class="footer-cta-btn primary">
                                🎤 スピーカーで参加
                            </a>
                            <a href="#events" class="footer-cta-btn secondary">
                                🎧 リスナーで参加
                            </a>
                        </div>
                        
                        <div class="contact-info">
                            <p><strong>お問い合わせ</strong></p>
                            <p>
                                <a href="mailto:info@lightningtalk.example.com">
                                    📧 info@lightningtalk.example.com
                                </a>
                            </p>
                        </div>
                    </div>
                    
                    <!-- 最新イベント -->
                    <div class="footer-widget">
                        <h3 class="widget-title">次回イベント</h3>
                        <?php
                        // 開催予定の次回イベントを取得
                        $next_event = get_posts(array(
                            'post_type' => 'lt_event',
                            'meta_key' => 'event_date',
                            'meta_value' => date('Y-m-d'),
                            'meta_compare' => '>=',
                            'orderby' => 'meta_value',
                            'order' => 'ASC',
                            'posts_per_page' => 1
                        ));
                        
                        if ($next_event) :
                            $event = $next_event[0];
                            $event_date = get_post_meta($event->ID, 'event_date', true);
                            $event_time = get_post_meta($event->ID, 'event_time', true);
                        ?>
                        <div class="footer-next-event">
                            <h4 class="event-title">
                                <a href="<?php echo get_permalink($event->ID); ?>">
                                    <?php echo esc_html($event->post_title); ?>
                                </a>
                            </h4>
                            <p class="event-meta">
                                📅 <?php echo date('Y年n月j日', strtotime($event_date)); ?><br>
                                ⏰ <?php echo esc_html($event_time); ?>
                            </p>
                            <a href="<?php echo get_permalink($event->ID); ?>" class="footer-event-link">
                                詳細を見る →
                            </a>
                        </div>
                        <?php else : ?>
                        <p class="no-events">
                            🚧 新しいイベントを準備中です。<br>
                            <a href="<?php echo esc_url(home_url('/news/')); ?>">お知らせ</a>をチェックしてください。
                        </p>
                        <?php endif; ?>
                    </div>
                    
                </div><!-- .footer-widgets -->
            </div><!-- .footer-main -->
            
            <!-- フッターボトム -->
            <div class="footer-bottom">
                <div class="footer-bottom-content">
                    <div class="footer-copyright">
                        <p>&copy; <?php echo date('Y'); ?> Lightning Talk Circle. All rights reserved.</p>
                        <p class="powered-by">
                            Powered by <a href="https://wordpress.org" target="_blank" rel="noopener">WordPress</a> & 
                            <strong>Lightning Talk Pro Theme v<?php echo LIGHTNINGTALK_VERSION; ?></strong>
                        </p>
                    </div>
                    
                    <div class="footer-social">
                        <a href="#" class="social-link twitter" aria-label="Twitter">
                            <span>🐦</span>
                        </a>
                        <a href="#" class="social-link discord" aria-label="Discord">
                            <span>💬</span>
                        </a>
                        <a href="https://github.com/20m61/lightningtalk-circle" class="social-link github" aria-label="GitHub" target="_blank" rel="noopener">
                            <span>🐙</span>
                        </a>
                    </div>
                    
                    <div class="footer-legal">
                        <a href="<?php echo esc_url(home_url('/privacy-policy/')); ?>">プライバシーポリシー</a>
                        <span class="separator">|</span>
                        <a href="<?php echo esc_url(home_url('/community-guidelines/')); ?>">ガイドライン</a>
                    </div>
                </div>
            </div><!-- .footer-bottom -->
            
        </div><!-- .footer-container -->
    </footer><!-- #colophon -->

</div><!-- #page -->

<!-- Back to Top Button -->
<button id="back-to-top" class="back-to-top" aria-label="ページトップへ戻る">
    <span>↑</span>
</button>

<?php wp_footer(); ?>

<style>
/* フッタースタイル */
.site-footer {
    background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    color: white;
    margin-top: 80px;
}

.footer-container {
    max-width: 1200px;
    margin: 0 auto;
}

.footer-main {
    padding: 60px 20px 40px;
}

.footer-widgets {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 40px;
}

.footer-widget {
    min-height: 100px;
}

.widget-title {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 20px;
    color: white;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 10px;
}

.footer-description {
    line-height: 1.6;
    margin-bottom: 20px;
    opacity: 0.9;
}

.footer-stats {
    margin-top: 20px;
}

.footer-menu {
    list-style: none;
    padding: 0;
    margin: 0;
}

.footer-menu li {
    margin-bottom: 8px;
}

.footer-menu a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    transition: color 0.3s ease;
    font-size: 0.9rem;
}

.footer-menu a:hover {
    color: #ffd700;
}

.participation-links {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 25px;
}

.footer-cta-btn {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    text-align: center;
    transition: all 0.3s ease;
}

.footer-cta-btn.primary {
    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    color: white;
}

.footer-cta-btn.secondary {
    background: transparent;
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.footer-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    color: white;
}

.contact-info {
    font-size: 0.9rem;
}

.contact-info a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
}

.contact-info a:hover {
    color: #ffd700;
}

.footer-next-event {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
}

.footer-next-event .event-title {
    margin: 0 0 10px 0;
    font-size: 1rem;
}

.footer-next-event .event-title a {
    color: white;
    text-decoration: none;
}

.footer-next-event .event-title a:hover {
    color: #ffd700;
}

.footer-next-event .event-meta {
    margin: 0 0 15px 0;
    font-size: 0.9rem;
    opacity: 0.8;
    line-height: 1.4;
}

.footer-event-link {
    color: #ffd700;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
}

.footer-event-link:hover {
    color: white;
}

.no-events {
    background: rgba(255, 255, 255, 0.1);
    padding: 20px;
    border-radius: 10px;
    font-size: 0.9rem;
    line-height: 1.5;
}

.no-events a {
    color: #ffd700;
    text-decoration: none;
}

/* フッターボトム */
.footer-bottom {
    background: rgba(0, 0, 0, 0.2);
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.footer-bottom-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
}

.footer-copyright {
    flex: 1;
}

.footer-copyright p {
    margin: 0;
    font-size: 0.8rem;
    opacity: 0.7;
    line-height: 1.4;
}

.powered-by {
    margin-top: 5px !important;
}

.powered-by a {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
}

.powered-by a:hover {
    color: white;
}

.footer-social {
    display: flex;
    gap: 15px;
}

.social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    text-decoration: none;
    transition: all 0.3s ease;
    font-size: 1.2rem;
}

.social-link:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}

.footer-legal {
    display: flex;
    gap: 15px;
    align-items: center;
    font-size: 0.8rem;
}

.footer-legal a {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
}

.footer-legal a:hover {
    color: white;
}

.separator {
    opacity: 0.5;
}

/* Back to Top ボタン */
.back-to-top {
    position: fixed;
    bottom: 30px;
    left: 30px;
    width: 50px;
    height: 50px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    font-weight: bold;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 999;
    backdrop-filter: blur(10px);
}

.back-to-top.visible {
    opacity: 1;
    visibility: visible;
}

.back-to-top:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: translateY(-3px);
}

/* レスポンシブ */
@media (max-width: 768px) {
    .footer-main {
        padding: 40px 15px 30px;
    }
    
    .footer-widgets {
        grid-template-columns: 1fr;
        gap: 30px;
    }
    
    .footer-bottom-content {
        flex-direction: column;
        text-align: center;
        gap: 15px;
    }
    
    .footer-legal {
        justify-content: center;
    }
    
    .participation-links {
        flex-direction: column;
        gap: 8px;
    }
    
    .back-to-top {
        bottom: 20px;
        left: 20px;
        width: 45px;
        height: 45px;
        font-size: 1.1rem;
    }
}

@media (max-width: 480px) {
    .footer-main {
        padding: 30px 15px 20px;
    }
    
    .widget-title {
        font-size: 1.1rem;
    }
    
    .footer-social {
        gap: 10px;
    }
    
    .social-link {
        width: 35px;
        height: 35px;
        font-size: 1rem;
    }
}
</style>

<script>
// Back to Top ボタンの制御
document.addEventListener('DOMContentLoaded', function() {
    const backToTopBtn = document.getElementById('back-to-top');
    
    if (backToTopBtn) {
        // スクロール時の表示/非表示
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        // クリック時のスムーズスクロール
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
});
</script>

</body>
</html>