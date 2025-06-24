<?php
/**
 * Lightning Talk Pro Theme - Front Page Template
 * ランディングページテンプレート
 * 
 * @package Lightning_Talk_Pro_Theme
 * @version 1.1.0
 */

get_header(); ?>

<div class="lightning-talk-landing-page">
    
    <!-- ヒーローセクション -->
    <section class="hero-section">
        <div class="hero-background">
            <div class="hero-overlay"></div>
            <div class="hero-particles"></div>
        </div>
        
        <div class="hero-content">
            <div class="container">
                <div class="hero-text">
                    <h1 class="hero-title">
                        <span class="hero-emoji">⚡</span>
                        <span class="hero-main">Lightning Talk</span>
                        <span class="hero-sub">Circle</span>
                    </h1>
                    <p class="hero-subtitle">5分間で世界を変える</p>
                    <p class="hero-description">
                        あなたのアイデア、知識、体験を短時間で共有し、<br>
                        新しい出会いと学びを生み出すコミュニティ
                    </p>
                    
                    <div class="hero-cta">
                        <a href="#events" class="btn btn-primary btn-lg hero-btn-primary">
                            🎤 今すぐ参加する
                        </a>
                        <a href="#about" class="btn btn-outline btn-lg hero-btn-secondary">
                            📖 詳しく知る
                        </a>
                    </div>
                    
                    <div class="hero-stats">
                        <?php echo do_shortcode('[lightning_talk_stats type="hero"]'); ?>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="hero-scroll-indicator">
            <span>Scroll Down</span>
            <div class="scroll-arrow"></div>
        </div>
    </section>

    <!-- Lightning Talkとは -->
    <section id="about" class="about-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">Lightning Talk とは？</h2>
                <p class="section-subtitle">短時間で最大のインパクトを</p>
            </div>
            
            <div class="about-grid">
                <div class="about-item" data-aos="fade-up" data-aos-delay="100">
                    <div class="about-icon">
                        <span>⏱️</span>
                    </div>
                    <h3>5分間</h3>
                    <p>短時間だからこそ、要点を絞った濃密な内容をお届け。聞き手も発表者も集中できます。</p>
                </div>
                
                <div class="about-item" data-aos="fade-up" data-aos-delay="200">
                    <div class="about-icon">
                        <span>🌟</span>
                    </div>
                    <h3>多様なテーマ</h3>
                    <p>技術、ビジネス、趣味、体験談など、どんなテーマでもOK。多様性こそが学びを生みます。</p>
                </div>
                
                <div class="about-item" data-aos="fade-up" data-aos-delay="300">
                    <div class="about-icon">
                        <span>👥</span>
                    </div>
                    <h3>コミュニティ</h3>
                    <p>発表者も参加者も対等な立場で学び合い、新しいつながりを築いていきます。</p>
                </div>
                
                <div class="about-item" data-aos="fade-up" data-aos-delay="400">
                    <div class="about-icon">
                        <span>🚀</span>
                    </div>
                    <h3>成長の場</h3>
                    <p>プレゼンスキルの向上、フィードバックの獲得、自信の構築につながります。</p>
                </div>
            </div>
        </div>
    </section>

    <!-- 参加方法 -->
    <section class="participation-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">参加方法</h2>
                <p class="section-subtitle">あなたに合った参加スタイルを選択</p>
            </div>
            
            <div class="participation-grid">
                <div class="participation-card" data-aos="flip-left" data-aos-delay="100">
                    <div class="card-icon">
                        <span>🎧</span>
                    </div>
                    <h3>リスナー参加</h3>
                    <p class="card-description">気軽に聞くだけの参加もOK。新しい知識や視点を得られます。</p>
                    <ul class="card-features">
                        <li>✅ 事前登録推奨</li>
                        <li>✅ 質疑応答に参加可能</li>
                        <li>✅ ネットワーキング</li>
                        <li>✅ 無料参加</li>
                    </ul>
                    <div class="card-cta">
                        <a href="#events" class="btn btn-outline">リスナーで参加</a>
                    </div>
                </div>
                
                <div class="participation-card featured" data-aos="flip-right" data-aos-delay="200">
                    <div class="featured-badge">おすすめ</div>
                    <div class="card-icon">
                        <span>🎤</span>
                    </div>
                    <h3>スピーカー参加</h3>
                    <p class="card-description">あなたの知識や体験を5分間で共有してください。</p>
                    <ul class="card-features">
                        <li>✅ 発表テーマ自由</li>
                        <li>✅ フィードバック獲得</li>
                        <li>✅ スキルアップ</li>
                        <li>✅ 認知度向上</li>
                    </ul>
                    <div class="card-cta">
                        <a href="#events" class="btn btn-primary">スピーカーで参加</a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- 開催予定イベント -->
    <section id="events" class="events-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">開催予定のイベント</h2>
                <p class="section-subtitle">次回開催予定のLightning Talkイベント</p>
            </div>
            
            <div class="events-showcase">
                <?php
                // 開催予定イベントを取得
                $upcoming_events = get_posts(array(
                    'post_type' => 'lt_event',
                    'meta_key' => 'event_date',
                    'meta_value' => date('Y-m-d'),
                    'meta_compare' => '>=',
                    'orderby' => 'meta_value',
                    'order' => 'ASC',
                    'posts_per_page' => 3
                ));
                
                if ($upcoming_events) :
                    foreach ($upcoming_events as $index => $event) :
                        $event_id = $event->ID;
                        $delay = ($index + 1) * 100;
                ?>
                <div class="event-card-featured" data-aos="zoom-in" data-aos-delay="<?php echo $delay; ?>">
                    <?php echo do_shortcode('[lightning_talk_event id="' . $event_id . '" template="landing"]'); ?>
                    
                    <div class="event-actions">
                        <?php echo do_shortcode('[lightning_talk_register event_id="' . $event_id . '" style="featured"]'); ?>
                        <a href="<?php echo get_permalink($event_id); ?>" class="btn btn-outline">詳細を見る</a>
                    </div>
                    
                    <div class="event-meta-info">
                        <?php echo do_shortcode('[lightning_talk_participants event_id="' . $event_id . '" type="count" format="compact"]'); ?>
                    </div>
                </div>
                <?php 
                    endforeach;
                else :
                ?>
                <div class="no-events-message">
                    <h3>🚧 新しいイベントを準備中</h3>
                    <p>次回イベントの詳細は近日公開予定です。最新情報をお待ちください。</p>
                    <a href="/news/" class="btn btn-primary">お知らせを見る</a>
                </div>
                <?php endif; ?>
            </div>
            
            <div class="events-cta">
                <a href="/events/" class="btn btn-lg btn-outline">
                    📅 全てのイベントを見る
                </a>
            </div>
        </div>
    </section>

    <!-- 統計・実績 -->
    <section class="stats-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">コミュニティの実績</h2>
                <p class="section-subtitle">多くの方に参加いただいています</p>
            </div>
            
            <div class="stats-grid">
                <?php
                // 統計データを取得
                $total_events = wp_count_posts('lt_event')->publish;
                $total_participants = wp_count_posts('lt_participant')->publish;
                $total_talks = wp_count_posts('lt_talk')->publish;
                $total_categories = wp_count_terms('talk_category');
                ?>
                
                <div class="stat-item" data-aos="fade-up" data-aos-delay="100">
                    <div class="stat-icon">📅</div>
                    <div class="stat-number" data-target="<?php echo $total_events; ?>">0</div>
                    <div class="stat-label">開催イベント数</div>
                </div>
                
                <div class="stat-item" data-aos="fade-up" data-aos-delay="200">
                    <div class="stat-icon">👥</div>
                    <div class="stat-number" data-target="<?php echo $total_participants; ?>">0</div>
                    <div class="stat-label">延べ参加者数</div>
                </div>
                
                <div class="stat-item" data-aos="fade-up" data-aos-delay="300">
                    <div class="stat-icon">💡</div>
                    <div class="stat-number" data-target="<?php echo $total_talks; ?>">0</div>
                    <div class="stat-label">発表総数</div>
                </div>
                
                <div class="stat-item" data-aos="fade-up" data-aos-delay="400">
                    <div class="stat-icon">🏷️</div>
                    <div class="stat-number" data-target="<?php echo $total_categories; ?>">0</div>
                    <div class="stat-label">カテゴリ数</div>
                </div>
            </div>
        </div>
    </section>

    <!-- テーマ・カテゴリ -->
    <section class="categories-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">発表テーマ</h2>
                <p class="section-subtitle">多様なカテゴリの発表を歓迎</p>
            </div>
            
            <div class="categories-grid">
                <?php
                $categories = get_terms(array(
                    'taxonomy' => 'talk_category',
                    'hide_empty' => false,
                    'number' => 8
                ));
                
                $category_icons = array(
                    'tech' => '💻',
                    'business' => '💼',
                    'design' => '🎨',
                    'startup' => '🚀',
                    'learning' => '📚',
                    'hobby' => '🎯',
                    'travel' => '✈️',
                    'food' => '🍕',
                    'game' => '🎮',
                    'movie' => '🎬'
                );
                
                if ($categories) :
                    foreach ($categories as $index => $category) :
                        $icon = isset($category_icons[$category->slug]) ? $category_icons[$category->slug] : '📝';
                        $delay = ($index + 1) * 50;
                ?>
                <div class="category-item" data-aos="fade-up" data-aos-delay="<?php echo $delay; ?>">
                    <div class="category-icon"><?php echo $icon; ?></div>
                    <h3><?php echo esc_html($category->name); ?></h3>
                    <p><?php echo esc_html($category->description ?: $category->name . 'に関する発表'); ?></p>
                    <span class="category-count"><?php echo $category->count; ?>件の発表</span>
                </div>
                <?php endforeach; endif; ?>
            </div>
        </div>
    </section>

    <!-- 参加者の声 -->
    <section class="testimonials-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">参加者の声</h2>
                <p class="section-subtitle">実際に参加された方からの感想</p>
            </div>
            
            <div class="testimonials-slider">
                <div class="testimonial-item" data-aos="fade-right">
                    <div class="testimonial-content">
                        <p>"5分という短時間だからこそ、要点が明確で学びが多い。毎回新しい発見があります。"</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">👩‍💻</div>
                        <div class="author-info">
                            <h4>田中 美咲さん</h4>
                            <span>フロントエンドエンジニア</span>
                        </div>
                    </div>
                </div>
                
                <div class="testimonial-item" data-aos="fade-up">
                    <div class="testimonial-content">
                        <p>"初めての発表でしたが、温かい雰囲気で緊張せずに話せました。フィードバックも貴重でした。"</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">👨‍🎨</div>
                        <div class="author-info">
                            <h4>佐藤 健太さん</h4>
                            <span>UIデザイナー</span>
                        </div>
                    </div>
                </div>
                
                <div class="testimonial-item" data-aos="fade-left">
                    <div class="testimonial-content">
                        <p>"技術だけでなく、ビジネスや趣味の話も聞けて、視野が広がりました。ネットワーキングも最高！"</p>
                    </div>
                    <div class="testimonial-author">
                        <div class="author-avatar">👨‍💼</div>
                        <div class="author-info">
                            <h4>山田 悠一さん</h4>
                            <span>プロダクトマネージャー</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- FAQ -->
    <section class="faq-section">
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">よくある質問</h2>
                <p class="section-subtitle">参加前の疑問を解決</p>
            </div>
            
            <div class="faq-accordion">
                <div class="faq-item" data-aos="fade-up" data-aos-delay="100">
                    <div class="faq-question">
                        <h3>初心者でも発表できますか？</h3>
                        <span class="faq-toggle">+</span>
                    </div>
                    <div class="faq-answer">
                        <p>もちろんです！Lightning Talk は経験レベルを問いません。「今日学んだこと」「失敗から学んだこと」など、どんな内容でも歓迎です。初心者の視点は非常に貴重です。</p>
                    </div>
                </div>
                
                <div class="faq-item" data-aos="fade-up" data-aos-delay="200">
                    <div class="faq-question">
                        <h3>参加費はかかりますか？</h3>
                        <span class="faq-toggle">+</span>
                    </div>
                    <div class="faq-answer">
                        <p>基本的に無料です。会場によっては軽食・ドリンク代として少額の実費をお願いする場合がありますが、事前にお知らせします。</p>
                    </div>
                </div>
                
                <div class="faq-item" data-aos="fade-up" data-aos-delay="300">
                    <div class="faq-question">
                        <h3>オンライン参加はできますか？</h3>
                        <span class="faq-toggle">+</span>
                    </div>
                    <div class="faq-answer">
                        <p>イベントによってはオンライン配信も行っています。参加登録時に「オンライン参加」「会場参加」を選択できます。</p>
                    </div>
                </div>
                
                <div class="faq-item" data-aos="fade-up" data-aos-delay="400">
                    <div class="faq-question">
                        <h3>発表資料は必要ですか？</h3>
                        <span class="faq-toggle">+</span>
                    </div>
                    <div class="faq-answer">
                        <p>必須ではありません。スライド、デモ、口頭のみ、どの形式でもOKです。5分という短い時間なので、シンプルで分かりやすい構成を心がけてください。</p>
                    </div>
                </div>
            </div>
            
            <div class="faq-cta">
                <p>他にご質問がありますか？</p>
                <a href="/faq/" class="btn btn-outline">FAQ一覧を見る</a>
            </div>
        </div>
    </section>

    <!-- CTA セクション -->
    <section class="cta-section">
        <div class="container">
            <div class="cta-content" data-aos="zoom-in">
                <h2>あなたも Lightning Talk に参加しませんか？</h2>
                <p>新しい学びと出会いが、ここから始まります。<br>今すぐ参加登録して、コミュニティの一員になりましょう。</p>
                
                <div class="cta-buttons">
                    <a href="#events" class="btn btn-primary btn-lg">
                        🎤 今すぐ参加登録
                    </a>
                    <a href="/about/" class="btn btn-outline btn-lg">
                        📖 もっと詳しく
                    </a>
                </div>
                
                <div class="cta-note">
                    <small>登録は無料です。いつでもキャンセルできます。</small>
                </div>
            </div>
        </div>
    </section>

    <!-- フローティングCTA -->
    <div class="floating-cta" id="floatingCta">
        <a href="#events" class="floating-btn">
            <span class="floating-icon">⚡</span>
            <span class="floating-text">参加する</span>
        </a>
    </div>

</div>

<?php get_footer(); ?>