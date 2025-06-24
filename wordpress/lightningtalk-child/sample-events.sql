-- Lightning Talk Pro Theme - サンプルイベントデータ
-- Version: 1.1.0
-- このファイルをWordPressデータベースにインポートすることで、サンプルイベントを作成できます

-- サンプルイベント1: 技術系Lightning Talk
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt
) VALUES (
    'Tech Lightning Talk #1 - 最新技術トレンド',
    '技術者向けのLightning Talkイベントです。最新の技術トレンドや開発手法について5分間で熱く語りましょう！\n\n初心者から上級者まで、どなたでも参加歓迎です。発表内容は技術に関することであれば何でもOK。新しい発見や学びを共有しましょう。\n\n**開催内容**\n- 各発表者5分間のプレゼンテーション\n- 質疑応答タイム\n- ネットワーキングタイム\n- 軽食・ドリンク提供\n\n**発表テーマ例**\n- 新しいフレームワーク・ライブラリの紹介\n- 開発効率化のTips\n- チーム開発での工夫\n- 技術選定の経験談\n- 失敗から学んだこと',
    '最新技術について5分間で熱く語るLightning Talkイベント。技術者同士の交流と学びの場です。',
    'publish',
    'lt_event',
    '2025-07-15 10:00:00',
    '2025-07-15 01:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00'
);

-- サンプルイベント2: スタートアップピッチ
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt
) VALUES (
    'Startup Pitch Night - アイデアを形にしよう',
    'スタートアップのアイデアやビジネスプランを発表するピッチイベントです。将来起業を考えている方、新しいサービスを企画中の方、ぜひご参加ください！\n\n**イベントの特徴**\n- 3分間のピッチタイム\n- 投資家・起業家からのフィードバック\n- ネットワーキング機会\n- ビジネスマッチング\n\n**参加対象**\n- 起業家・起業志望者\n- エンジニア・デザイナー\n- 投資家・VCファンド\n- 新規事業担当者\n\n**ピッチ内容**\n- 解決したい課題\n- ソリューション概要\n- ビジネスモデル\n- 市場規模・競合分析\n- チーム紹介\n- 今後の展望',
    'スタートアップのアイデアを3分で発表するピッチイベント。起業家同士の交流とビジネスマッチングの機会です。',
    'publish',
    'lt_event',
    '2025-08-20 19:00:00',
    '2025-08-20 10:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00'
);

-- サンプルイベント3: デザイン思考ワークショップ
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_date,
    post_date_gmt,
    post_modified,
    post_modified_gmt
) VALUES (
    'Design Thinking Workshop - ユーザー中心の発想法',
    'デザイン思考を活用した問題解決のワークショップです。実際の課題を題材に、チームでアイデア創出から プロトタイプ作成まで体験していただきます。\n\n**ワークショップ内容**\n1. **共感(Empathize)** - ユーザーインタビュー\n2. **定義(Define)** - 問題の明確化\n3. **発想(Ideate)** - ブレインストーミング\n4. **プロトタイプ(Prototype)** - アイデアの具現化\n5. **テスト(Test)** - ユーザーフィードバック\n\n**参加メリット**\n- 創造的思考法の習得\n- チームワークスキル向上\n- 実践的な問題解決経験\n- 多様な参加者との交流\n\n**持参物**\n- ノートパソコン(推奨)\n- 筆記用具\n- 付箋・マーカー(会場でも提供)',
    'デザイン思考を学び実践するワークショップ。チームで課題解決に取り組みます。',
    'publish',
    'lt_event',
    '2025-09-10 13:00:00',
    '2025-09-10 04:00:00',
    '2025-06-24 08:00:00',
    '2025-06-23 23:00:00'
);

-- イベント1のメタデータ
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'event_date', '2025-07-15'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'event_time', '19:00'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'venue_name', '渋谷テックカフェ'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'venue_address', '東京都渋谷区渋谷2-24-12 渋谷スクランブルスクエア15F'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'venue_lat', '35.659518'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'venue_lng', '139.703047'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'capacity', '50'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'max_talks', '10'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'registration_deadline', '2025-07-13'),
((SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event'), 'event_status', 'upcoming');

-- イベント2のメタデータ
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'event_date', '2025-08-20'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'event_time', '19:00'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'venue_name', '六本木ヒルズ スカイラウンジ'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'venue_address', '東京都港区六本木6-10-1 六本木ヒルズ森タワー52F'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'venue_lat', '35.660719'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'venue_lng', '139.729057'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'capacity', '80'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'max_talks', '15'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'registration_deadline', '2025-08-18'),
((SELECT ID FROM wp_posts WHERE post_title = 'Startup Pitch Night - アイデアを形にしよう' AND post_type = 'lt_event'), 'event_status', 'upcoming');

-- イベント3のメタデータ
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) VALUES
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'event_date', '2025-09-10'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'event_time', '13:00'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'venue_name', '表参道デザインスタジオ'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'venue_address', '東京都渋谷区神宮前4-26-28 原宿V2ビル3F'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'venue_lat', '35.669220'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'venue_lng', '139.707106'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'capacity', '30'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'max_talks', '8'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'registration_deadline', '2025-09-08'),
((SELECT ID FROM wp_posts WHERE post_title = 'Design Thinking Workshop - ユーザー中心の発想法' AND post_type = 'lt_event'), 'event_status', 'upcoming');

-- サンプル参加者データ
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_status,
    post_type,
    post_date,
    post_date_gmt
) VALUES 
('田中太郎', '', 'publish', 'lt_participant', NOW(), UTC_TIMESTAMP()),
('佐藤花子', '', 'publish', 'lt_participant', NOW(), UTC_TIMESTAMP()),
('山田次郎', '', 'publish', 'lt_participant', NOW(), UTC_TIMESTAMP()),
('鈴木美咲', '', 'publish', 'lt_participant', NOW(), UTC_TIMESTAMP()),
('高橋健一', '', 'publish', 'lt_participant', NOW(), UTC_TIMESTAMP());

-- サンプル参加者のメタデータ
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'event_id', (SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event')
FROM wp_posts p WHERE p.post_title IN ('田中太郎', '佐藤花子') AND p.post_type = 'lt_participant';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'participant_type', 'listener'
FROM wp_posts p WHERE p.post_title = '田中太郎' AND p.post_type = 'lt_participant';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'participant_type', 'speaker'
FROM wp_posts p WHERE p.post_title = '佐藤花子' AND p.post_type = 'lt_participant';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'email', 'tanaka@example.com'
FROM wp_posts p WHERE p.post_title = '田中太郎' AND p.post_type = 'lt_participant';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'email', 'sato@example.com'
FROM wp_posts p WHERE p.post_title = '佐藤花子' AND p.post_type = 'lt_participant';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'registration_date', NOW()
FROM wp_posts p WHERE p.post_title IN ('田中太郎', '佐藤花子') AND p.post_type = 'lt_participant';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'status', 'confirmed'
FROM wp_posts p WHERE p.post_title IN ('田中太郎', '佐藤花子') AND p.post_type = 'lt_participant';

-- サンプルトークデータ
INSERT INTO wp_posts (
    post_title,
    post_content,
    post_excerpt,
    post_status,
    post_type,
    post_date,
    post_date_gmt
) VALUES 
(
    'React 18の新機能とパフォーマンス最適化',
    'React 18で導入された新機能について実例を交えて紹介します。特にConcurrent Featuresによるパフォーマンス向上と、Automatic Batchingの効果について詳しく解説します。',
    'React 18の新機能とパフォーマンス最適化について5分で解説',
    'publish',
    'lt_talk',
    NOW(),
    UTC_TIMESTAMP()
),
(
    'TypeScriptでDDDを実践する方法',
    'Domain Driven Design（DDD）をTypeScriptで実装する際のベストプラクティスと、実際のプロジェクトでの導入事例を紹介します。',
    'TypeScriptを使ったDDD実装のベストプラクティス',
    'publish',
    'lt_talk',
    NOW(),
    UTC_TIMESTAMP()
);

-- サンプルトークのメタデータ
INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'event_id', (SELECT ID FROM wp_posts WHERE post_title = 'Tech Lightning Talk #1 - 最新技術トレンド' AND post_type = 'lt_event')
FROM wp_posts p WHERE p.post_title IN ('React 18の新機能とパフォーマンス最適化', 'TypeScriptでDDDを実践する方法') AND p.post_type = 'lt_talk';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'speaker_name', '佐藤花子'
FROM wp_posts p WHERE p.post_title = 'React 18の新機能とパフォーマンス最適化' AND p.post_type = 'lt_talk';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'speaker_email', 'sato@example.com'
FROM wp_posts p WHERE p.post_title = 'React 18の新機能とパフォーマンス最適化' AND p.post_type = 'lt_talk';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'duration', '5'
FROM wp_posts p WHERE p.post_title IN ('React 18の新機能とパフォーマンス最適化', 'TypeScriptでDDDを実践する方法') AND p.post_type = 'lt_talk';

INSERT INTO wp_postmeta (post_id, meta_key, meta_value) 
SELECT p.ID, 'talk_status', 'confirmed'
FROM wp_posts p WHERE p.post_title IN ('React 18の新機能とパフォーマンス最適化', 'TypeScriptでDDDを実践する方法') AND p.post_type = 'lt_talk';

-- トークカテゴリの設定
INSERT INTO wp_terms (name, slug, term_group) VALUES 
('技術', 'tech', 0),
('スタートアップ', 'startup', 0),
('デザイン', 'design', 0),
('ビジネス', 'business', 0),
('学習', 'learning', 0);

INSERT INTO wp_term_taxonomy (term_id, taxonomy, description, parent, count) 
SELECT t.term_id, 'talk_category', '', 0, 0 
FROM wp_terms t WHERE t.name IN ('技術', 'スタートアップ', 'デザイン', 'ビジネス', '学習');

-- カテゴリとトークの関連付け
INSERT INTO wp_term_relationships (object_id, term_taxonomy_id, term_order) 
SELECT p.ID, tt.term_taxonomy_id, 0
FROM wp_posts p, wp_term_taxonomy tt, wp_terms t
WHERE p.post_title IN ('React 18の新機能とパフォーマンス最適化', 'TypeScriptでDDDを実践する方法') 
  AND p.post_type = 'lt_talk'
  AND tt.term_id = t.term_id 
  AND tt.taxonomy = 'talk_category'
  AND t.name = '技術';

-- カウントの更新
UPDATE wp_term_taxonomy SET count = (
    SELECT COUNT(*) FROM wp_term_relationships 
    WHERE term_taxonomy_id = wp_term_taxonomy.term_taxonomy_id
) WHERE taxonomy = 'talk_category';