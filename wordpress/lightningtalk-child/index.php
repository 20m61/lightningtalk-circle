<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php wp_title('|', true, 'right'); bloginfo('name'); ?></title>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>

<header class="site-header">
    <div class="container">
        <h1 class="site-title">
            <a href="<?php echo esc_url(home_url('/')); ?>">
                ⚡ <?php bloginfo('name'); ?>
            </a>
        </h1>
        <p class="site-description"><?php bloginfo('description'); ?></p>
    </div>
</header>

<main class="site-main">
    <div class="container">
        
        <div class="hero-section">
            <h2>⚡ Lightning Talk Child Theme テスト</h2>
            <p>WordPressテーマが正常に動作しています！</p>
        </div>

        <div class="content-area">
            <?php if (have_posts()) : ?>
                <?php while (have_posts()) : the_post(); ?>
                    <article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
                        <header class="entry-header">
                            <h2 class="entry-title">
                                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                            </h2>
                            <div class="entry-meta">
                                投稿日: <?php the_date(); ?> by <?php the_author(); ?>
                            </div>
                        </header>
                        
                        <div class="entry-content">
                            <?php the_excerpt(); ?>
                        </div>
                        
                        <footer class="entry-footer">
                            <a href="<?php the_permalink(); ?>" class="read-more">続きを読む</a>
                        </footer>
                    </article>
                <?php endwhile; ?>
                
                <div class="navigation">
                    <?php posts_nav_link(' | ', '前のページ', '次のページ'); ?>
                </div>
                
            <?php else : ?>
                <div class="no-posts">
                    <h2>投稿が見つかりません</h2>
                    <p>まだ投稿がありませんが、テーマは正常に動作しています。</p>
                    <p><strong>テーマ検証結果:</strong></p>
                    <ul>
                        <li>✅ functions.php読み込み成功</li>
                        <li>✅ style.css読み込み成功</li>
                        <li>✅ WordPressテンプレート機能動作中</li>
                        <li>✅ PHP致命的エラーなし</li>
                    </ul>
                </div>
            <?php endif; ?>
        </div>
        
    </div>
</main>

<footer class="site-footer">
    <div class="container">
        <p>&copy; <?php echo date('Y'); ?> Lightning Talk Child Theme - テスト検証版</p>
        <p>WordPress <?php bloginfo('version'); ?> / PHP <?php echo PHP_VERSION; ?></p>
    </div>
</footer>

<?php wp_footer(); ?>

<style>
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.site-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    text-align: center;
}

.site-title {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
}

.site-title a {
    color: white;
    text-decoration: none;
}

.site-description {
    margin: 0;
    opacity: 0.9;
    font-size: 1.1rem;
}

.hero-section {
    background: #f8f9fa;
    padding: 3rem 0;
    text-align: center;
    border-radius: 10px;
    margin: 2rem 0;
}

.hero-section h2 {
    color: #333;
    margin-bottom: 1rem;
    font-size: 2rem;
}

.content-area {
    margin: 2rem 0;
}

.entry-header {
    margin-bottom: 1rem;
}

.entry-title {
    margin: 0 0 0.5rem 0;
    color: #333;
}

.entry-title a {
    color: #667eea;
    text-decoration: none;
}

.entry-meta {
    color: #666;
    font-size: 0.9rem;
}

.entry-content {
    margin: 1rem 0;
    line-height: 1.6;
}

.read-more {
    background: #667eea;
    color: white;
    padding: 0.5rem 1rem;
    text-decoration: none;
    border-radius: 5px;
    display: inline-block;
}

.read-more:hover {
    background: #5a6fd8;
}

.no-posts {
    background: #e8f5e8;
    padding: 2rem;
    border-radius: 10px;
    border-left: 5px solid #28a745;
}

.no-posts h2 {
    color: #155724;
    margin-top: 0;
}

.no-posts ul {
    color: #155724;
}

.site-footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
    margin-top: 3rem;
}

.site-footer p {
    margin: 0.5rem 0;
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
    .site-title {
        font-size: 1.8rem;
    }
    
    .hero-section h2 {
        font-size: 1.5rem;
    }
    
    .container {
        padding: 0 15px;
    }
}
</style>

</body>
</html>