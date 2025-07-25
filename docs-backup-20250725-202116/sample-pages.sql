-- Lightning Talk Pro Theme - サンプルWordPressページデータ
-- Version: 1.1.0
-- このファイルをWordPressデータベースにインポートすることで、サンプルページを作成できます

-- WordPress設定の変更（パーマリンク等）
UPDATE wp_options SET option_value = '/%postname%/' WHERE option_name = 'permalink_structure';
UPDATE wp_options SET option_value = 'Lightning Talk Circle' WHERE option_name = 'blogname';
UPDATE wp_options SET option_value = 'Lightning Talk イベント管理・開催のプラットフォーム' WHERE option_name = 'blogdescription';

-- サンプルページ1: イベント一覧ページ
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_name,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt,
    menu_order
) VALUES (
    'Lightning Talk イベント一覧',
    '<div class="events-listing-page">
    
    <!-- ページヘッダー -->
    <section class="page-header" style="background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; padding: 60px 20px; text-align: center; margin-bottom: 50px;">
        <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 2.5rem; margin-bottom: 20px;">⚡ Lightning Talk Events</h1>
            <p style="font-size: 1.2rem; margin-bottom: 0;">技術、ビジネス、クリエイティブなアイデアを5分で共有しよう</p>
        </div>
    </section>

    <!-- 開催予定のイベント -->
    <section class="upcoming-events" style="margin-bottom: 60px;">
        <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
            <h2 style="text-align: center; margin-bottom: 40px; color: #333; position: relative;">
                📅 開催予定のイベント
                <span style="display: block; width: 50px; height: 3px; background: #74b9ff; margin: 10px auto 0;"></span>
            </h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px;">
                
                <!-- イベントカード（実際のイベントIDに置き換えてください） -->
                <div class="event-card" style="background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); overflow: hidden;">
                    <div style="padding: 30px;">
                        [lightning_talk_event id="123" template="compact"]
                        
                        <div style="margin-top: 20px; display: flex; gap: 10px;">
                            [lightning_talk_register event_id="123" button_text="参加登録" style="compact"]
                            <a href="/events/tech-lightning-talk-1/" style="padding: 10px 20px; border: 2px solid #74b9ff; color: #74b9ff; text-decoration: none; border-radius: 5px; font-size: 0.9rem;">詳細を見る</a>
                        </div>
                        
                        <div style="margin-top: 15px; font-size: 0.9rem; color: #666;">
                            [lightning_talk_participants event_id="123" type="count" format="simple"]
                        </div>
                    </div>
                </div>
                
            </div>
        </div>
    </section>

    <!-- CTAセクション -->
    <section class="cta-section" style="padding: 60px 20px; text-align: center;">
        <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="margin-bottom: 20px; color: #333;">🎤 あなたも発表してみませんか？</h2>
            <p style="margin-bottom: 30px; color: #666; font-size: 1.1rem;">
                あなたの知識、経験、アイデアを5分間で共有しましょう。<br>
                技術的な内容から趣味の話まで、どんなテーマでも大歓迎です。
            </p>
            <a href="#upcoming-events" style="display: inline-block; background: #74b9ff; color: white; padding: 15px 30px; border-radius: 25px; text-decoration: none; font-size: 1.1rem;">今すぐ参加登録</a>
        </div>
    </section>

</div>',
    'Lightning Talk イベントの一覧ページです。開催予定・過去のイベントをご覧いただけます。',
    'publish',
    'page',
    'events',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    0
);

-- サンプルページ2: Lightning Talk とは？ページ
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_name,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt,
    menu_order
) VALUES (
    'Lightning Talk とは？',
    '<div class="lightning-talk-landing">
    
    <!-- ヒーローセクション -->
    <section class="hero" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center;">
        <div style="max-width: 800px; margin: 0 auto;">
            <h1 style="font-size: 3rem; margin-bottom: 20px; line-height: 1.2;">⚡ Lightning Talk</h1>
            <p style="font-size: 1.5rem; margin-bottom: 10px;">5分間で世界を変える</p>
            <p style="font-size: 1.2rem; margin-bottom: 40px; opacity: 0.9;">
                あなたのアイデア、知識、体験を短時間で共有し、<br>
                新しい出会いと学びを生み出すコミュニティ
            </p>
            <a href="/events/" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1.1rem; margin: 10px;">🎤 今すぐ参加</a>
            <a href="#about" style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: bold; font-size: 1.1rem; margin: 10px;">📖 詳しく知る</a>
        </div>
    </section>

    <!-- Lightning Talkとは -->
    <section id="about" style="padding: 80px 20px; background: white;">
        <div style="max-width: 1000px; margin: 0 auto;">
            <h2 style="text-align: center; margin-bottom: 50px; font-size: 2.5rem; color: #333;">Lightning Talk とは？</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 60px;">
                
                <div style="text-align: center;">
                    <div style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem;">⏱️</div>
                    <h3 style="margin-bottom: 15px; color: #333;">5分間</h3>
                    <p style="color: #666;">短時間だからこそ、要点を絞った濃密な内容をお届け。聞き手も発表者も集中できます。</p>
                </div>
                
                <div style="text-align: center;">
                    <div style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem;">🌟</div>
                    <h3 style="margin-bottom: 15px; color: #333;">多様なテーマ</h3>
                    <p style="color: #666;">技術、ビジネス、趣味、体験談など、どんなテーマでもOK。多様性こそが学びを生みます。</p>
                </div>
                
                <div style="text-align: center;">
                    <div style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem;">👥</div>
                    <h3 style="margin-bottom: 15px; color: #333;">コミュニティ</h3>
                    <p style="color: #666;">発表者も参加者も対等な立場で学び合い、新しいつながりを築いていきます。</p>
                </div>
                
                <div style="text-align: center;">
                    <div style="background: #667eea; color: white; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2rem;">🚀</div>
                    <h3 style="margin-bottom: 15px; color: #333;">成長の場</h3>
                    <p style="color: #666;">プレゼンスキルの向上、フィードバックの獲得、自信の構築につながります。</p>
                </div>
                
            </div>
        </div>
    </section>

    <!-- 参加方法 -->
    <section style="padding: 80px 20px; background: #f8f9fa;">
        <div style="max-width: 800px; margin: 0 auto; text-align: center;">
            <h2 style="margin-bottom: 50px; font-size: 2.5rem; color: #333;">参加方法</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px;">
                
                <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
                    <div style="background: #e3f2fd; color: #1976d2; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.5rem;">🎧</div>
                    <h3 style="margin-bottom: 20px; color: #333;">リスナー参加</h3>
                    <p style="color: #666; margin-bottom: 20px;">気軽に聞くだけの参加もOK。新しい知識や視点を得られます。</p>
                    <ul style="text-align: left; color: #666; font-size: 0.9rem;">
                        <li>✅ 事前登録推奨</li>
                        <li>✅ 質疑応答に参加可能</li>
                        <li>✅ ネットワーキング</li>
                    </ul>
                </div>
                
                <div style="background: white; padding: 40px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
                    <div style="background: #e8f5e8; color: #388e3c; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 1.5rem;">🎤</div>
                    <h3 style="margin-bottom: 20px; color: #333;">スピーカー参加</h3>
                    <p style="color: #666; margin-bottom: 20px;">あなたの知識や体験を5分間で共有してください。</p>
                    <ul style="text-align: left; color: #666; font-size: 0.9rem;">
                        <li>✅ 発表テーマ自由</li>
                        <li>✅ フィードバック獲得</li>
                        <li>✅ スキルアップ</li>
                    </ul>
                </div>
                
            </div>
        </div>
    </section>

</div>',
    'Lightning Talk とは何か、参加方法について詳しく説明しています。',
    'publish',
    'page',
    'about',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    0
);

-- サンプルページ3: よくある質問ページ
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_name,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt,
    menu_order
) VALUES (
    'よくある質問',
    '<div class="faq-page" style="max-width: 800px; margin: 0 auto; padding: 20px;">
    
    <!-- ページヘッダー -->
    <section class="page-header" style="text-align: center; margin-bottom: 50px;">
        <h1 style="color: #333; margin-bottom: 20px;">❓ よくある質問</h1>
        <p style="color: #666; font-size: 1.1rem;">Lightning Talk イベントについてよくお寄せいただく質問をまとめました。</p>
    </section>

    <!-- FAQ一覧 -->
    <section class="faq-content">
        
        <!-- 一般的な質問 -->
        <div style="margin-bottom: 40px;">
            <h2 style="color: #333; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #1976d2;">🏠 一般的な質問</h2>
            
            <div class="faq-item" style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;">
                <div style="padding: 20px; border-bottom: 1px solid #eee; background: #f8f9fa;">
                    <h3 style="margin: 0; color: #333;">Lightning Talk とは何ですか？</h3>
                </div>
                <div style="padding: 20px; color: #666;">
                    <p>Lightning Talk（ライトニングトーク）は、5分間で行う短いプレゼンテーションです。技術、ビジネス、趣味など、どんなテーマでも扱えます。短時間だからこそ要点を絞った濃密な内容となり、聞き手も発表者も集中できるのが特徴です。</p>
                </div>
            </div>
            
            <div class="faq-item" style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;">
                <div style="padding: 20px; border-bottom: 1px solid #eee; background: #f8f9fa;">
                    <h3 style="margin: 0; color: #333;">参加費はかかりますか？</h3>
                </div>
                <div style="padding: 20px; color: #666;">
                    <p>基本的に無料です。ただし、会場によっては軽食・ドリンク代として少額の実費（500円程度）をお願いする場合があります。詳細は各イベントの詳細ページでご確認ください。</p>
                </div>
            </div>
            
            <div class="faq-item" style="background: white; border: 1px solid #eee; border-radius: 10px; margin-bottom: 15px; overflow: hidden;">
                <div style="padding: 20px; border-bottom: 1px solid #eee; background: #f8f9fa;">
                    <h3 style="margin: 0; color: #333;">初心者でも発表できますか？</h3>
                </div>
                <div style="padding: 20px; color: #666;">
                    <p>もちろんです！Lightning Talk は経験レベルを問いません。「今日学んだこと」「失敗から学んだこと」「趣味の話」など、どんな内容でも歓迎です。むしろ初心者の視点は非常に貴重で、多くの学びを提供してくれます。</p>
                </div>
            </div>
            
        </div>

    </section>

    <!-- お問い合わせ -->
    <section class="contact-section" style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
        <h3 style="margin-bottom: 15px; color: #333;">解決しませんでしたか？</h3>
        <p style="margin-bottom: 25px; color: #666;">ここに掲載されていない質問がございましたら、お気軽にお問い合わせください。</p>
        <a href="mailto:info@lightningtalk.example.com" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none;">✉️ お問い合わせ</a>
    </section>

</div>',
    'Lightning Talk イベントについてよくお寄せいただく質問をまとめました。',
    'publish',
    'page',
    'faq',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    0
);

-- サンプルページ4: お知らせページ
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_name,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt,
    menu_order
) VALUES (
    'お知らせ・新着情報',
    '<div class="news-page" style="max-width: 800px; margin: 0 auto; padding: 20px;">
    
    <!-- ページヘッダー -->
    <section class="page-header" style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #333; margin-bottom: 15px;">📢 お知らせ・新着情報</h1>
        <p style="color: #666; font-size: 1.1rem;">Lightning Talk コミュニティの最新情報をお届けします</p>
    </section>

    <!-- お知らせ一覧 -->
    <section class="news-list">
        
        <!-- 重要なお知らせ -->
        <article class="news-item important" style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 10px; padding: 25px; margin-bottom: 25px; border-left: 5px solid #f39c12;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="background: #f39c12; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-right: 15px;">重要</span>
                <span style="color: #666; font-size: 0.9rem;">2025年6月20日</span>
            </div>
            <h2 style="margin-bottom: 15px; color: #333;">🎉 Lightning Talk Pro Theme v1.1.0 リリース</h2>
            <p style="color: #666; margin-bottom: 15px;">
                Lightning Talk Pro Theme の最新版がリリースされました。今回のアップデートでは、以下の新機能が追加されています：
            </p>
            <ul style="color: #666; margin-bottom: 15px; padding-left: 20px;">
                <li>リアルタイム参加者数表示機能</li>
                <li>参加意向調査システム</li>
                <li>モバイル対応の改善</li>
                <li>セキュリティの強化</li>
            </ul>
        </article>

        <!-- 通常のお知らせ -->
        <article class="news-item" style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <span style="background: #667eea; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; margin-right: 15px;">イベント</span>
                <span style="color: #666; font-size: 0.9rem;">2025年6月15日</span>
            </div>
            <h2 style="margin-bottom: 15px; color: #333;">🚀 7月のイベント情報を公開しました</h2>
            <p style="color: #666; margin-bottom: 15px;">
                7月開催予定のLightning Talkイベント3件の詳細情報を公開いたしました。今月は技術系、スタートアップ、デザイン思考と多様なテーマでお送りします。
            </p>
            <a href="/events/" style="color: #667eea; text-decoration: none; font-weight: bold;">イベント一覧を見る →</a>
        </article>

    </section>

</div>',
    'Lightning Talk コミュニティの最新情報をお届けします。',
    'publish',
    'page',
    'news',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    0
);

-- サンプルページ5: コミュニティガイドライン
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_name,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt,
    menu_order
) VALUES (
    'コミュニティガイドライン',
    '<div class="guidelines-page" style="max-width: 800px; margin: 0 auto; padding: 20px;">
    
    <!-- ページヘッダー -->
    <section class="page-header" style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #333; margin-bottom: 15px;">📋 コミュニティガイドライン</h1>
        <p style="color: #666; font-size: 1.1rem;">皆で良いコミュニティを作るためのお約束です</p>
    </section>

    <!-- ガイドライン内容 -->
    <section class="guidelines-content">
        
        <!-- 基本理念 -->
        <div style="background: #e3f2fd; padding: 30px; border-radius: 10px; margin-bottom: 40px; text-align: center;">
            <h2 style="color: #1976d2; margin-bottom: 20px;">🌟 基本理念</h2>
            <p style="color: #333; font-size: 1.1rem; margin-bottom: 15px;">
                Lightning Talk コミュニティは、<strong>学び</strong>、<strong>共有</strong>、<strong>成長</strong>を大切にする場所です。
            </p>
            <p style="color: #666;">
                多様な背景を持つ参加者が互いを尊重し、建設的な議論を通じて共に成長できる環境を目指しています。
            </p>
        </div>

        <!-- 参加者の心構え -->
        <div style="margin-bottom: 40px;">
            <h2 style="color: #333; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">👥 参加者の心構え</h2>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">🤝 相互尊重</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>他の参加者の意見や経験を尊重しましょう</li>
                    <li>建設的なフィードバックを心がけましょう</li>
                    <li>批判よりも改善提案を重視しましょう</li>
                </ul>
            </div>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">📖 学習意欲</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>新しいことを学ぶ姿勢を大切にしましょう</li>
                    <li>分からないことは遠慮なく質問しましょう</li>
                    <li>自分の知識や経験も積極的に共有しましょう</li>
                </ul>
            </div>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">💡 多様性の受容</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>異なる技術レベルや背景を持つ人を歓迎しましょう</li>
                    <li>初心者の視点を大切にしましょう</li>
                    <li>文化や価値観の違いを受け入れましょう</li>
                </ul>
            </div>
            
        </div>

        <!-- 発表に関するガイドライン -->
        <div style="margin-bottom: 40px;">
            <h2 style="color: #333; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">🎤 発表に関するガイドライン</h2>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">⏰ 時間の管理</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>発表時間は5分厳守でお願いします</li>
                    <li>質疑応答は別途2-3分設けます</li>
                    <li>時間を意識した構成を心がけましょう</li>
                </ul>
            </div>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 10px; padding: 25px; margin-bottom: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">📝 内容について</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>テーマは自由ですが、他者への配慮をお願いします</li>
                    <li>宗教、政治、差別的な内容は避けてください</li>
                    <li>商用利用・営業活動は事前にご相談ください</li>
                    <li>著作権・肖像権に配慮してください</li>
                </ul>
            </div>
            
        </div>

        <!-- 禁止事項 -->
        <div style="margin-bottom: 40px;">
            <h2 style="color: #333; margin-bottom: 25px; padding-bottom: 10px; border-bottom: 2px solid #f44336;">🚫 禁止事項</h2>
            
            <div style="background: #ffebee; border: 1px solid #ffcdd2; border-radius: 10px; padding: 25px;">
                <ul style="color: #d32f2f; padding-left: 20px;">
                    <li>ハラスメント行為（セクハラ、パワハラ、アカハラ等）</li>
                    <li>差別的発言・行動</li>
                    <li>他人のプライバシーの侵害</li>
                    <li>無断での録音・録画・撮影</li>
                    <li>過度な営業活動・勧誘行為</li>
                    <li>会場でのアルコール摂取（懇親会を除く）</li>
                    <li>運営の指示に従わない行為</li>
                </ul>
            </div>
        </div>

        <!-- お問い合わせ・報告 -->
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
            <h3 style="margin-bottom: 15px; color: #333;">📞 お問い合わせ・報告</h3>
            <p style="color: #666; margin-bottom: 20px;">
                ガイドライン違反や不適切な行為を見かけた場合は、<br>
                遠慮なく運営チームまでご報告ください。
            </p>
            <a href="mailto:info@lightningtalk.example.com" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin: 5px;">✉️ メールで報告</a>
            <a href="#" style="display: inline-block; background: #2196f3; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; margin: 5px;">📱 Discordで相談</a>
        </div>

    </section>

</div>',
    'Lightning Talk コミュニティで皆で良い環境を作るためのガイドラインです。',
    'publish',
    'page',
    'community-guidelines',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    0
);

-- サンプルページ6: プライバシーポリシー
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_name,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt,
    menu_order
) VALUES (
    'プライバシーポリシー',
    '<div class="privacy-page" style="max-width: 800px; margin: 0 auto; padding: 20px;">
    
    <!-- ページヘッダー -->
    <section class="page-header" style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #333; margin-bottom: 15px;">🔒 プライバシーポリシー</h1>
        <p style="color: #666; font-size: 1.1rem;">個人情報の取り扱いについて</p>
        <p style="color: #999; font-size: 0.9rem;">最終更新: 2025年6月24日</p>
    </section>

    <!-- プライバシーポリシー内容 -->
    <section class="privacy-content">
        
        <!-- 基本方針 -->
        <div style="background: #e8f5e8; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #2e7d32; margin-bottom: 15px;">🛡️ 基本方針</h2>
            <p style="color: #333;">
                Lightning Talk Circle（以下「当サービス」）は、利用者の皆様の個人情報を適切に保護することを重要な責務と考え、
                個人情報保護法及び関連法令を遵守し、個人情報の適正な取扱いに努めます。
            </p>
        </div>

        <!-- 収集する情報 -->
        <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">📋 収集する個人情報</h2>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <h3 style="color: #333; margin-bottom: 10px;">🎫 イベント参加登録時</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>氏名（ニックネーム可）</li>
                    <li>メールアドレス</li>
                    <li>緊急連絡先（任意）</li>
                    <li>食事制限情報（任意）</li>
                    <li>アクセシビリティ要件（任意）</li>
                </ul>
            </div>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <h3 style="color: #333; margin-bottom: 10px;">🎤 発表申込み時</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>発表タイトル・内容</li>
                    <li>スピーカー情報</li>
                    <li>連絡先情報</li>
                </ul>
            </div>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <h3 style="color: #333; margin-bottom: 10px;">🌐 アクセス情報</h3>
                <ul style="color: #666; padding-left: 20px;">
                    <li>IPアドレス</li>
                    <li>ブラウザ情報</li>
                    <li>アクセス日時</li>
                    <li>クッキー情報</li>
                </ul>
            </div>
        </div>

        <!-- 利用目的 -->
        <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">🎯 個人情報の利用目的</h2>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <ul style="color: #666; padding-left: 20px;">
                    <li>イベント参加の受付・管理</li>
                    <li>参加者への連絡・通知</li>
                    <li>イベント運営の改善</li>
                    <li>統計情報の作成（個人を特定しない形式）</li>
                    <li>お問い合わせへの対応</li>
                    <li>法令に基づく開示要求への対応</li>
                </ul>
            </div>
        </div>

        <!-- 第三者提供 -->
        <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">🤝 第三者への提供</h2>
            
            <div style="background: #fff3e0; border: 1px solid #ffcc02; border-radius: 8px; padding: 20px;">
                <p style="color: #333; margin-bottom: 15px;">
                    <strong>当サービスは、以下の場合を除き、個人情報を第三者に提供いたしません：</strong>
                </p>
                <ul style="color: #666; padding-left: 20px;">
                    <li>本人の同意がある場合</li>
                    <li>法令に基づく場合</li>
                    <li>人の生命、身体または財産の保護のために必要がある場合</li>
                    <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                </ul>
            </div>
        </div>

        <!-- データ保護 -->
        <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">🔐 セキュリティ対策</h2>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <ul style="color: #666; padding-left: 20px;">
                    <li>SSL暗号化通信による情報保護</li>
                    <li>適切なアクセス制御</li>
                    <li>定期的なセキュリティ更新</li>
                    <li>不正アクセス防止対策</li>
                    <li>データベースの暗号化</li>
                </ul>
            </div>
        </div>

        <!-- 利用者の権利 -->
        <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">👤 利用者の権利</h2>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <p style="color: #666; margin-bottom: 15px;">利用者は以下の権利を有します：</p>
                <ul style="color: #666; padding-left: 20px;">
                    <li>個人情報の開示請求</li>
                    <li>個人情報の訂正・削除請求</li>
                    <li>個人情報の利用停止請求</li>
                    <li>サービス利用の停止・退会</li>
                </ul>
                <p style="color: #999; font-size: 0.9rem; margin-top: 15px;">
                    これらの請求については、下記お問い合わせ先までご連絡ください。
                </p>
            </div>
        </div>

        <!-- クッキーについて -->
        <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #667eea;">🍪 クッキー（Cookie）について</h2>
            
            <div style="background: white; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
                <p style="color: #666; margin-bottom: 15px;">
                    当サービスでは、サービス向上のためクッキーを使用しています：
                </p>
                <ul style="color: #666; padding-left: 20px; margin-bottom: 15px;">
                    <li>ログイン状態の維持</li>
                    <li>アンケート投票状況の記録</li>
                    <li>チャット履歴の保存</li>
                    <li>アクセス解析</li>
                </ul>
                <p style="color: #999; font-size: 0.9rem;">
                    クッキーの無効化はブラウザ設定で可能ですが、一部機能が制限される場合があります。
                </p>
            </div>
        </div>

        <!-- お問い合わせ -->
        <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; text-align: center;">
            <h3 style="margin-bottom: 15px; color: #333;">📞 お問い合わせ窓口</h3>
            <p style="color: #666; margin-bottom: 15px;">
                個人情報の取扱いに関するお問い合わせは下記までご連絡ください：
            </p>
            <div style="color: #333; margin-bottom: 15px;">
                <p><strong>Lightning Talk Circle 運営事務局</strong></p>
                <p>メール: privacy@lightningtalk.example.com</p>
            </div>
            <a href="mailto:privacy@lightningtalk.example.com" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none;">✉️ お問い合わせ</a>
        </div>

    </section>

</div>',
    '個人情報の取り扱いについて詳しく説明しています。',
    'publish',
    'page',
    'privacy-policy',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00',
    0
);

-- メニューの作成
INSERT INTO wp_terms (name, slug, term_group) VALUES ('メインメニュー', 'main-menu', 0);
INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) 
SELECT term_id, 'nav_menu', 'サイトのメインナビゲーション', 0, 0 
FROM wp_terms WHERE slug = 'main-menu';

-- メニューアイテムの追加
-- ホーム
INSERT INTO wp_posts (
    post_title, post_excerpt, post_status, post_type, post_date, post_date_gmt, menu_order
) VALUES (
    'ホーム', '', 'publish', 'nav_menu_item', NOW(), UTC_TIMESTAMP(), 1
);

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
((SELECT ID FROM wp_posts WHERE post_title = 'ホーム' AND post_type = 'nav_menu_item'), '_menu_item_type', 'custom'),
((SELECT ID FROM wp_posts WHERE post_title = 'ホーム' AND post_type = 'nav_menu_item'), '_menu_item_menu_item_parent', '0'),
((SELECT ID FROM wp_posts WHERE post_title = 'ホーム' AND post_type = 'nav_menu_item'), '_menu_item_object_id', '0'),
((SELECT ID FROM wp_posts WHERE post_title = 'ホーム' AND post_type = 'nav_menu_item'), '_menu_item_object', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'ホーム' AND post_type = 'nav_menu_item'), '_menu_item_target', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'ホーム' AND post_type = 'nav_menu_item'), '_menu_item_classes', 'a:1:{i:0;s:0:"";}'),
((SELECT ID FROM wp_posts WHERE post_title = 'ホーム' AND post_type = 'nav_menu_item'), '_menu_item_xfn', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'ホーム' AND post_type = 'nav_menu_item'), '_menu_item_url', '/');

-- Lightning Talk とは？
INSERT INTO wp_posts (
    post_title, post_excerpt, post_status, post_type, post_date, post_date_gmt, menu_order
) VALUES (
    'Lightning Talk とは？', '', 'publish', 'nav_menu_item', NOW(), UTC_TIMESTAMP(), 2
);

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
((SELECT ID FROM wp_posts WHERE post_title = 'Lightning Talk とは？' AND post_type = 'nav_menu_item'), '_menu_item_type', 'post_type'),
((SELECT ID FROM wp_posts WHERE post_title = 'Lightning Talk とは？' AND post_type = 'nav_menu_item'), '_menu_item_menu_item_parent', '0'),
((SELECT ID FROM wp_posts WHERE post_title = 'Lightning Talk とは？' AND post_type = 'nav_menu_item'), '_menu_item_object_id', (SELECT ID FROM wp_posts WHERE post_name = 'about' AND post_type = 'page')),
((SELECT ID FROM wp_posts WHERE post_title = 'Lightning Talk とは？' AND post_type = 'nav_menu_item'), '_menu_item_object', 'page'),
((SELECT ID FROM wp_posts WHERE post_title = 'Lightning Talk とは？' AND post_type = 'nav_menu_item'), '_menu_item_target', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'Lightning Talk とは？' AND post_type = 'nav_menu_item'), '_menu_item_classes', 'a:1:{i:0;s:0:"";}'),
((SELECT ID FROM wp_posts WHERE post_title = 'Lightning Talk とは？' AND post_type = 'nav_menu_item'), '_menu_item_xfn', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'Lightning Talk とは？' AND post_type = 'nav_menu_item'), '_menu_item_url', '');

-- イベント一覧
INSERT INTO wp_posts (
    post_title, post_excerpt, post_status, post_type, post_date, post_date_gmt, menu_order
) VALUES (
    'イベント一覧', '', 'publish', 'nav_menu_item', NOW(), UTC_TIMESTAMP(), 3
);

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
((SELECT ID FROM wp_posts WHERE post_title = 'イベント一覧' AND post_type = 'nav_menu_item'), '_menu_item_type', 'post_type'),
((SELECT ID FROM wp_posts WHERE post_title = 'イベント一覧' AND post_type = 'nav_menu_item'), '_menu_item_menu_item_parent', '0'),
((SELECT ID FROM wp_posts WHERE post_title = 'イベント一覧' AND post_type = 'nav_menu_item'), '_menu_item_object_id', (SELECT ID FROM wp_posts WHERE post_name = 'events' AND post_type = 'page')),
((SELECT ID FROM wp_posts WHERE post_title = 'イベント一覧' AND post_type = 'nav_menu_item'), '_menu_item_object', 'page'),
((SELECT ID FROM wp_posts WHERE post_title = 'イベント一覧' AND post_type = 'nav_menu_item'), '_menu_item_target', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'イベント一覧' AND post_type = 'nav_menu_item'), '_menu_item_classes', 'a:1:{i:0;s:0:"";}'),
((SELECT ID FROM wp_posts WHERE post_title = 'イベント一覧' AND post_type = 'nav_menu_item'), '_menu_item_xfn', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'イベント一覧' AND post_type = 'nav_menu_item'), '_menu_item_url', '');

-- よくある質問
INSERT INTO wp_posts (
    post_title, post_excerpt, post_status, post_type, post_date, post_date_gmt, menu_order
) VALUES (
    'よくある質問', '', 'publish', 'nav_menu_item', NOW(), UTC_TIMESTAMP(), 4
);

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
((SELECT ID FROM wp_posts WHERE post_title = 'よくある質問' AND post_type = 'nav_menu_item'), '_menu_item_type', 'post_type'),
((SELECT ID FROM wp_posts WHERE post_title = 'よくある質問' AND post_type = 'nav_menu_item'), '_menu_item_menu_item_parent', '0'),
((SELECT ID FROM wp_posts WHERE post_title = 'よくある質問' AND post_type = 'nav_menu_item'), '_menu_item_object_id', (SELECT ID FROM wp_posts WHERE post_name = 'faq' AND post_type = 'page')),
((SELECT ID FROM wp_posts WHERE post_title = 'よくある質問' AND post_type = 'nav_menu_item'), '_menu_item_object', 'page'),
((SELECT ID FROM wp_posts WHERE post_title = 'よくある質問' AND post_type = 'nav_menu_item'), '_menu_item_target', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'よくある質問' AND post_type = 'nav_menu_item'), '_menu_item_classes', 'a:1:{i:0;s:0:"";}'),
((SELECT ID FROM wp_posts WHERE post_title = 'よくある質問' AND post_type = 'nav_menu_item'), '_menu_item_xfn', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'よくある質問' AND post_type = 'nav_menu_item'), '_menu_item_url', '');

-- お知らせ
INSERT INTO wp_posts (
    post_title, post_excerpt, post_status, post_type, post_date, post_date_gmt, menu_order
) VALUES (
    'お知らせ', '', 'publish', 'nav_menu_item', NOW(), UTC_TIMESTAMP(), 5
);

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
((SELECT ID FROM wp_posts WHERE post_title = 'お知らせ' AND post_type = 'nav_menu_item'), '_menu_item_type', 'post_type'),
((SELECT ID FROM wp_posts WHERE post_title = 'お知らせ' AND post_type = 'nav_menu_item'), '_menu_item_menu_item_parent', '0'),
((SELECT ID FROM wp_posts WHERE post_title = 'お知らせ' AND post_type = 'nav_menu_item'), '_menu_item_object_id', (SELECT ID FROM wp_posts WHERE post_name = 'news' AND post_type = 'page')),
((SELECT ID FROM wp_posts WHERE post_title = 'お知らせ' AND post_type = 'nav_menu_item'), '_menu_item_object', 'page'),
((SELECT ID FROM wp_posts WHERE post_title = 'お知らせ' AND post_type = 'nav_menu_item'), '_menu_item_target', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'お知らせ' AND post_type = 'nav_menu_item'), '_menu_item_classes', 'a:1:{i:0;s:0:"";}'),
((SELECT ID FROM wp_posts WHERE post_title = 'お知らせ' AND post_type = 'nav_menu_item'), '_menu_item_xfn', ''),
((SELECT ID FROM wp_posts WHERE post_title = 'お知らせ' AND post_type = 'nav_menu_item'), '_menu_item_url', '');

-- メニューアイテムをメニューに関連付け
INSERT INTO wp_term_relationships (object_id, term_taxonomy_id, term_order)
SELECT p.ID, tt.term_taxonomy_id, p.menu_order
FROM wp_posts p, wp_term_taxonomy tt, wp_terms t
WHERE p.post_type = 'nav_menu_item'
  AND p.post_title IN ('ホーム', 'Lightning Talk とは？', 'イベント一覧', 'よくある質問', 'お知らせ')
  AND tt.term_id = t.term_id 
  AND tt.taxonomy = 'nav_menu'
  AND t.slug = 'main-menu';

-- メニューのカウント更新
UPDATE wp_term_taxonomy SET count = (
    SELECT COUNT(*) FROM wp_term_relationships 
    WHERE term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id
) WHERE taxonomy = 'nav_menu';

-- テーマ設定（メニューの位置）
INSERT INTO wp_options (option_name, option_value, autoload) VALUES 
('theme_mods_lightning-talk-pro', 'a:1:{s:18:"nav_menu_locations";a:1:{s:7:"primary";i:' || (SELECT term_id FROM wp_terms WHERE slug = 'main-menu') || ';}}', 'yes')
ON CONFLICT (option_name) DO UPDATE SET option_value = EXCLUDED.option_value;

-- フロントページの設定
UPDATE wp_options SET option_value = 'page' WHERE option_name = 'show_on_front';
UPDATE wp_options SET option_value = (SELECT ID FROM wp_posts WHERE post_name = 'about' AND post_type = 'page') WHERE option_name = 'page_on_front';

-- コメント
-- このSQLファイルをインポート後、以下の設定を行ってください：
-- 1. 外観 > メニュー で「メインメニュー」をヘッダーメニューに設定
-- 2. 外観 > カスタマイザー > ホームページ設定 で固定ページを選択
-- 3. 各ページのショートコード内のイベントIDを実際のIDに置き換え
-- 4. Google Maps APIキーの設定（Lightning Talk > 設定）