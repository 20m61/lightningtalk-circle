<footer class="lt-footer">
    <div class="lt-container">
        <div class="lt-footer-content">
            <div class="lt-footer-section">
                <h3>Lightning Talk Circle</h3>
                <p>5分間で世界を変える、あなたの話を聞かせてください。</p>
            </div>
            
            <div class="lt-footer-section">
                <h4>お問い合わせ</h4>
                <p>Email: info@lightning-talk-event.jp</p>
                <p>Twitter: @lightningtalk_jp</p>
            </div>
            
            <div class="lt-footer-section">
                <h4>次回開催</h4>
                <p>準備中です。お楽しみに！</p>
            </div>
        </div>
        
        <div class="lt-footer-bottom">
            <p>&copy; <?php echo date('Y'); ?> Lightning Talk Circle. All rights reserved.</p>
            <?php if (has_nav_menu('footer')) : ?>
                <?php wp_nav_menu(array(
                    'theme_location' => 'footer',
                    'menu_class' => 'lt-footer-menu',
                    'container' => 'nav',
                    'container_class' => 'lt-footer-nav'
                )); ?>
            <?php endif; ?>
        </div>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>