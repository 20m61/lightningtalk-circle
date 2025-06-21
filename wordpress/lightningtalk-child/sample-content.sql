-- Lightning Talk WordPress Sample Content
-- WordPressデータベースにサンプルコンテンツを挿入するSQLファイル

-- 注意: このファイルはWordPress管理画面から手動でコンテンツを作成する際の参考用です
-- 実際の本番環境では、WordPressの管理画面から作成することを推奨します

-- サンプルイベント作成用データ（参考）
/*
イベント名: 第1回 なんでもライトニングトーク
開催日時: 2025-06-25 19:00:00
会場: 新宿某所（6月20日に詳細確定予定）
オンラインURL: https://meet.google.com/ycp-sdec-xsr
定員: 50名
ステータス: upcoming

カスタムフィールド:
- event_date: 2025-06-25 19:00:00
- event_end_date: 2025-06-25 22:00:00
- venue_name: 新宿某所
- venue_address: 6月20日に詳細確定予定
- venue_capacity: 50
- online_url: https://meet.google.com/ycp-sdec-xsr
- online_time: 18:30〜22:00 (JST)
- event_status: upcoming
- registration_open: yes
- talk_submission_open: yes
- max_talks: 20
- talk_duration: 5
*/

-- サンプル発表データ（参考）
/*
発表1:
- タイトル: 猫の写真で学ぶマシンラーニング
- 発表者: 田中太郎
- カテゴリー: tech
- 時間: 5分
- 概要: AIが猫を認識する仕組みを、実際の猫写真を使って楽しく解説します。

発表2:
- タイトル: 手作りパンで始まる朝の幸せ
- 発表者: 佐藤花子
- カテゴリー: food
- 時間: 5分
- 概要: 毎朝のパン作りから学んだ、小さな幸せを見つけるコツをお話しします。

発表3:
- タイトル: 週末ガーデニングで癒やされる方法
- 発表者: 山田次郎
- カテゴリー: garden
- 時間: 5分
- 概要: ベランダ菜園歴3年の経験から、都市部でも楽しめるガーデニングを紹介。
*/

-- WordPressページ作成用テンプレート
/*
ページタイトル: Lightning Talk イベント
スラッグ: lightning-talk
テンプレート: Lightning Talk Event Page (page-lightning-talk.php)

ページ内容:
<div class="lt-intro">
<h2>⚡ なんでもライトニングトークへようこそ！</h2>
<p>5分間で世界を変える！あなたの「なんでも」を聞かせてください。</p>
<p>技術、趣味、日常の発見、面白い話題... すべてが歓迎です！</p>
</div>

[lightning_talk_event show="all"]

<div class="lt-about">
<h2>📚 ライトニングトークとは？</h2>
<p>ライトニングトークは、<strong>5分間</strong>という短い時間で行うプレゼンテーションです。</p>
<ul>
<li>⏰ 短時間だから気軽に参加できる</li>
<li>🎤 完璧でなくても大丈夫</li>
<li>🌟 多様な話題が聞ける</li>
<li>🤝 新しい出会いとつながり</li>
</ul>
</div>

[lightning_talk_survey]
</div>
*/

-- WordPress投稿作成用テンプレート
/*
投稿タイトル: Lightning Talk 参加のススメ
カテゴリー: イベント情報

投稿内容:
Lightning Talkイベントへの参加を迷っているあなたへ。

## 🎯 こんな人におすすめ

- 人前で話すのは苦手だけど、何か伝えたいことがある
- 新しい技術や趣味について学びたい
- 同じ興味を持つ人とつながりたい
- 短時間なら話せるかも、と思っている

## 💡 発表のコツ

1. **結論から話す** - 5分は意外と短いです
2. **体験談を入れる** - 聞く人が親しみやすくなります
3. **完璧を目指さない** - 気軽に、楽しく話しましょう
4. **質問を歓迎** - 対話形式でも面白いです

[lightning_talk_button type="register" text="今すぐ参加登録"]
*/

-- ウィジェット設定（参考）
/*
サイドバーウィジェット:
1. Lightning Talk参加者数表示
   [lightning_talk_participants show="count"]

2. 次回イベント案内
   [lightning_talk_event show="info"]

3. 発表申込みボタン
   [lightning_talk_button type="register-speaker" text="発表申込み"]
*/

-- メニュー設定（参考）
/*
メインメニュー:
- ホーム
- Lightning Talk (lightning-talk ページへのリンク)
- イベント一覧 (lt_event アーカイブへのリンク)
- 発表申込み (カスタムリンク: #register-speaker)
- お問い合わせ

フッターメニュー:
- プライバシーポリシー
- 利用規約
- お問い合わせ
- サイトマップ
*/

-- カスタマイザー設定（参考）
/*
Lightning Talk設定:
- API URL: /wp-json/lightningtalk/v1/
- デフォルトイベントID: 1
- 自動確認メール: 有効
- 参加者承認: 不要
- 発表申込み期限: イベント開始3日前

サイト基本情報:
- サイトタイトル: Lightning Talk Community
- キャッチフレーズ: 5分間で世界を変える
- サイトアイコン: ⚡ アイコン
*/

-- .htaccess 設定（参考）
/*
# Lightning Talk REST API用の設定
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^wp-json/lightningtalk/(.*)$ /wp-json/lightningtalk/$1 [QSA,L]

# キャッシュ設定
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType text/css "access plus 1 year"
ExpiresByType application/javascript "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/jpg "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
</IfModule>
*/