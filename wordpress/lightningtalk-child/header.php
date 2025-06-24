<?php
/**
 * Lightning Talk Pro Theme - Header Template
 * Version: 1.1.0
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    
    <!-- Preconnect for performance -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    
    <!-- Theme color -->
    <meta name="theme-color" content="#667eea">
    
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div id="page" class="site">
    <a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e('Skip to content'); ?></a>

    <header id="masthead" class="site-header">
        <div class="header-container">
            <div class="site-branding">
                <?php
                if (has_custom_logo()) {
                    the_custom_logo();
                } else {
                    if (is_front_page() && is_home()) :
                ?>
                    <h1 class="site-title">
                        <a href="<?php echo esc_url(home_url('/')); ?>" rel="home">
                            <span class="site-logo-text">⚡</span>
                            <?php bloginfo('name'); ?>
                        </a>
                    </h1>
                <?php
                    else :
                ?>
                    <p class="site-title">
                        <a href="<?php echo esc_url(home_url('/')); ?>" rel="home">
                            <span class="site-logo-text">⚡</span>
                            <?php bloginfo('name'); ?>
                        </a>
                    </p>
                <?php
                    endif;
                    
                    $description = get_bloginfo('description', 'display');
                    if ($description || is_customize_preview()) :
                ?>
                    <p class="site-description"><?php echo $description; ?></p>
                <?php endif; ?>
                <?php } ?>
            </div><!-- .site-branding -->

            <nav id="site-navigation" class="main-navigation">
                <button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">
                    <span class="menu-toggle-icon">
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                    <span class="menu-toggle-text">Menu</span>
                </button>
                
                <?php
                wp_nav_menu(array(
                    'theme_location' => 'primary',
                    'menu_id'        => 'primary-menu',
                    'menu_class'     => 'nav-menu',
                    'container'      => false,
                    'fallback_cb'    => 'lightningtalk_fallback_menu'
                ));
                ?>
            </nav><!-- #site-navigation -->
            
            <?php if (is_front_page()) : ?>
            <!-- CTA Button for Landing Page -->
            <div class="header-cta">
                <a href="#events" class="header-cta-btn">
                    🎤 参加する
                </a>
            </div>
            <?php endif; ?>
        </div><!-- .header-container -->
    </header><!-- #masthead -->

    <div id="content" class="site-content">

<style>
/* ヘッダースタイル */
.site-header {
    position: relative;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.site-header.scrolled {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 70px;
}

.site-branding {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

.site-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1;
}

.site-title a {
    text-decoration: none;
    color: #333;
    display: flex;
    align-items: center;
    gap: 8px;
}

.site-logo-text {
    font-size: 1.8rem;
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.site-description {
    margin: 0;
    font-size: 0.8rem;
    color: #666;
    margin-left: 32px;
}

.custom-logo {
    max-height: 50px;
    width: auto;
}

/* ナビゲーション */
.main-navigation {
    display: flex;
    align-items: center;
}

.nav-menu {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 30px;
}

.nav-menu li {
    position: relative;
}

.nav-menu a {
    text-decoration: none;
    color: #333;
    font-weight: 500;
    padding: 10px 0;
    transition: color 0.3s ease;
    position: relative;
}

.nav-menu a::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(135deg, var(--lt-primary), var(--lt-secondary));
    transition: width 0.3s ease;
}

.nav-menu a:hover::after,
.nav-menu .current-menu-item a::after {
    width: 100%;
}

.nav-menu a:hover,
.nav-menu .current-menu-item a {
    color: var(--lt-primary);
}

/* ヘッダーCTA */
.header-cta {
    margin-left: 20px;
}

.header-cta-btn {
    background: linear-gradient(135deg, var(--lt-primary), var(--lt-secondary));
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.header-cta-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    color: white;
}

/* モバイルメニュー */
.menu-toggle {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 10px;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.menu-toggle-icon {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.menu-toggle-icon span {
    display: block;
    width: 20px;
    height: 2px;
    background: #333;
    transition: all 0.3s ease;
}

.menu-toggle-text {
    font-size: 0.8rem;
    color: #333;
    font-weight: 500;
}

/* スキップリンク */
.skip-link {
    position: absolute;
    left: -9999px;
    z-index: 999999;
    padding: 8px 16px;
    background: #000;
    color: #fff;
    text-decoration: none;
}

.skip-link:focus {
    left: 6px;
    top: 7px;
}

.screen-reader-text {
    border: 0;
    clip: rect(1px, 1px, 1px, 1px);
    clip-path: inset(50%);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0;
    position: absolute !important;
    width: 1px;
    word-wrap: normal !important;
}

/* レスポンシブ */
@media (max-width: 768px) {
    .header-container {
        padding: 0 15px;
        min-height: 60px;
    }
    
    .site-title {
        font-size: 1.3rem;
    }
    
    .site-description {
        display: none;
    }
    
    .menu-toggle {
        display: flex;
    }
    
    .main-navigation .nav-menu {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        flex-direction: column;
        gap: 0;
        padding: 20px;
        margin: 0;
        transform: translateY(-10px);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    
    .main-navigation.toggled .nav-menu {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
    }
    
    .nav-menu li {
        width: 100%;
        border-bottom: 1px solid #eee;
    }
    
    .nav-menu li:last-child {
        border-bottom: none;
    }
    
    .nav-menu a {
        display: block;
        padding: 15px 0;
        border-bottom: none;
    }
    
    .header-cta {
        display: none;
    }
}

@media (max-width: 480px) {
    .site-title {
        font-size: 1.2rem;
    }
    
    .site-logo-text {
        font-size: 1.5rem;
    }
}
</style>

<script>
// モバイルメニューのトグル
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.querySelector('.main-navigation');
    
    if (menuToggle && navigation) {
        menuToggle.addEventListener('click', function() {
            navigation.classList.toggle('toggled');
            const expanded = navigation.classList.contains('toggled');
            menuToggle.setAttribute('aria-expanded', expanded);
        });
    }
});
</script>

<?php
// フォールバックメニュー関数
function lightningtalk_fallback_menu() {
    echo '<ul class="nav-menu">';
    echo '<li><a href="' . esc_url(home_url('/')) . '">ホーム</a></li>';
    echo '<li><a href="' . esc_url(home_url('/about/')) . '">Lightning Talkとは？</a></li>';
    echo '<li><a href="' . esc_url(home_url('/events/')) . '">イベント一覧</a></li>';
    echo '<li><a href="' . esc_url(home_url('/faq/')) . '">よくある質問</a></li>';
    echo '</ul>';
}
?>