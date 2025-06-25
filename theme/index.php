<?php get_header(); ?>

<main class="lt-main">
    <!-- Lightning Hero Section -->
    <section class="lt-hero">
        <div class="lt-container">
            <h1>第1回 なんでもライトニングトーク ⚡</h1>
            <p class="lt-hero-tagline">5分間で世界を変える！</p>
            <p style="font-size: 1.125rem; margin-bottom: var(--lt-space-lg);">
                あなたの「なんでも」を聞かせてください！
            </p>
            <div style="display: flex; gap: var(--lt-space-md); justify-content: center; flex-wrap: wrap;">
                <a href="#registration" class="lt-button lt-button-primary lt-lightning-effect">
                    今すぐ参加登録！
                </a>
                <a href="#details" class="lt-button lt-button-secondary">
                    詳細を確認
                </a>
            </div>
        </div>
    </section>

    <!-- Event Details Section -->
    <section class="lt-section" id="details">
        <div class="lt-container">
            <div class="lt-event-card">
                <h2 class="lt-text-center">開催概要</h2>
                <div class="lt-event-details">
                    <div class="lt-detail-item">
                        <span class="lt-detail-icon">📅</span>
                        <div class="lt-detail-content">
                            <h4>開催日時</h4>
                            <p><?php echo get_theme_mod('event_date', '2025年6月25日(水) 19:00〜22:00'); ?></p>
                            <small>（受付開始 18:30）</small>
                        </div>
                    </div>
                    <div class="lt-detail-item">
                        <span class="lt-detail-icon">📍</span>
                        <div class="lt-detail-content">
                            <h4>会場</h4>
                            <p><?php echo get_theme_mod('venue_name', '新宿会場'); ?></p>
                            <small>西新宿8-14-19 小林第二ビル8階</small>
                            <a href="https://maps.app.goo.gl/51TFv825jmuBsjbq5?g_st=ic" target="_blank" style="font-size: 0.875rem; color: var(--lt-accent)">
                                🗺️ 地図を見る
                            </a>
                        </div>
                    </div>
                    <div class="lt-detail-item">
                        <span class="lt-detail-icon">👥</span>
                        <div class="lt-detail-content">
                            <h4>定員</h4>
                            <p>会場: 50名 / オンライン: 無制限</p>
                        </div>
                    </div>
                    <div class="lt-detail-item">
                        <span class="lt-detail-icon">💻</span>
                        <div class="lt-detail-content">
                            <h4>オンライン参加</h4>
                            <p>Google Meet</p>
                            <a href="<?php echo get_theme_mod('online_url', 'https://meet.google.com/ycp-sdec-xsr'); ?>" target="_blank" style="font-size: 0.875rem; color: var(--lt-accent)">
                                🔗 ミーティングリンク
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- What is Lightning Talk Section -->
    <section class="lt-section" style="background-color: #f9fafb">
        <div class="lt-container">
            <h2 class="lt-text-center">ライトニングトークとは？</h2>
            <div class="lt-event-card">
                <p style="font-size: 1.125rem; line-height: 1.8; text-align: center">
                    <strong style="color: var(--lt-accent)">5分間</strong>という短い時間で行うプレゼンテーション形式です。<br>
                    短時間だからこそ、<strong>要点を絞った濃密な内容</strong>をお届けできます！<br>
                    テーマは<strong style="color: var(--lt-secondary)">「なんでも」OK！</strong><br>
                    あなたの情熱、発見、アイデアを共有しましょう！
                </p>
            </div>
        </div>
    </section>

    <!-- Topics Section -->
    <section class="lt-section">
        <div class="lt-container">
            <h2 class="lt-text-center">こんなテーマが人気です！</h2>
            <p class="lt-text-center" style="color: #6b7280; margin-bottom: var(--lt-space-lg)">
                でも、これ以外のテーマも大歓迎！あなたの「推し」を語ってください！
            </p>
            <div class="lt-topics-grid">
                <div class="lt-topic-card">
                    <div class="lt-topic-icon">💻</div>
                    <div class="lt-topic-name">プログラミング・技術</div>
                </div>
                <div class="lt-topic-card">
                    <div class="lt-topic-icon">🎨</div>
                    <div class="lt-topic-name">趣味・アート・創作</div>
                </div>
                <div class="lt-topic-card">
                    <div class="lt-topic-icon">📚</div>
                    <div class="lt-topic-name">読書・学習体験</div>
                </div>
                <div class="lt-topic-card">
                    <div class="lt-topic-icon">🌍</div>
                    <div class="lt-topic-name">旅行・文化エピソード</div>
                </div>
                <div class="lt-topic-card">
                    <div class="lt-topic-icon">🍳</div>
                    <div class="lt-topic-name">料理・グルメ体験</div>
                </div>
                <div class="lt-topic-card">
                    <div class="lt-topic-icon">🎵</div>
                    <div class="lt-topic-name">音楽・エンタメ</div>
                </div>
                <div class="lt-topic-card">
                    <div class="lt-topic-icon">💼</div>
                    <div class="lt-topic-name">ビジネス・キャリア</div>
                </div>
                <div class="lt-topic-card">
                    <div class="lt-topic-icon">🌟</div>
                    <div class="lt-topic-name">その他なんでも！</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Schedule Section -->
    <section class="lt-section" style="background-color: #f9fafb">
        <div class="lt-container">
            <h2 class="lt-text-center">当日のスケジュール</h2>
            <div class="lt-schedule">
                <div class="lt-schedule-item">
                    <div class="lt-schedule-time">18:30</div>
                    <div class="lt-schedule-content">
                        <h4>受付開始 & ネットワーキング</h4>
                        <p>軽食・ドリンクをご用意しています</p>
                    </div>
                </div>
                <div class="lt-schedule-item">
                    <div class="lt-schedule-time">19:00</div>
                    <div class="lt-schedule-content">
                        <h4>開会・イベント説明</h4>
                        <p>Lightning Talkの楽しみ方をご紹介</p>
                    </div>
                </div>
                <div class="lt-schedule-item">
                    <div class="lt-schedule-time">19:15</div>
                    <div class="lt-schedule-content">
                        <h4>Lightning Talk セッション 1</h4>
                        <p>5分 × 6名の発表</p>
                    </div>
                </div>
                <div class="lt-schedule-item">
                    <div class="lt-schedule-time">20:00</div>
                    <div class="lt-schedule-content">
                        <h4>休憩・交流タイム</h4>
                        <p>発表者との質疑応答や交流</p>
                    </div>
                </div>
                <div class="lt-schedule-item">
                    <div class="lt-schedule-time">20:15</div>
                    <div class="lt-schedule-content">
                        <h4>Lightning Talk セッション 2</h4>
                        <p>5分 × 6名の発表</p>
                    </div>
                </div>
                <div class="lt-schedule-item">
                    <div class="lt-schedule-time">21:00</div>
                    <div class="lt-schedule-content">
                        <h4>総括・次回予告</h4>
                        <p>振り返りと今後の展望</p>
                    </div>
                </div>
                <div class="lt-schedule-item">
                    <div class="lt-schedule-time">21:15</div>
                    <div class="lt-schedule-content">
                        <h4>アフターパーティ（自由参加）</h4>
                        <p>近くの居酒屋で懇親会</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Registration Section -->
    <section class="lt-section" id="registration">
        <div class="lt-container">
            <h2 class="lt-text-center">参加登録</h2>
            <div class="lt-event-card">
                <p class="lt-text-center" style="font-size: 1.125rem; margin-bottom: var(--lt-space-lg);">
                    参加費は<strong style="color: var(--lt-accent)">無料</strong>です！<br>
                    発表者・聴講者どちらも大歓迎！
                </p>
                <div class="lt-text-center">
                    <a href="<?php echo get_permalink(get_page_by_title('Registration')); ?>" class="lt-button lt-button-primary lt-lightning-effect">
                        参加登録フォームへ
                    </a>
                </div>
            </div>
        </div>
    </section>

    <?php if (have_posts()) : ?>
        <section class="lt-section">
            <div class="lt-container">
                <h2 class="lt-text-center">最新情報</h2>
                <div class="lt-posts-grid">
                    <?php while (have_posts()) : the_post(); ?>
                        <article class="lt-post-card">
                            <h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
                            <div class="lt-post-meta">
                                <time datetime="<?php echo get_the_date('c'); ?>"><?php the_date(); ?></time>
                            </div>
                            <div class="lt-post-excerpt">
                                <?php the_excerpt(); ?>
                            </div>
                            <a href="<?php the_permalink(); ?>" class="lt-button lt-button-secondary">続きを読む</a>
                        </article>
                    <?php endwhile; ?>
                </div>
            </div>
        </section>
    <?php endif; ?>

</main>

<?php get_footer(); ?>