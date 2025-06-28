<?php
/*
Template Name: Registration Page Template
*/
?>

<?php get_header(); ?>

<main class="lt-main">
    <?php while (have_posts()) : the_post(); ?>
        <article class="lt-registration-page">
            <!-- Hero Section -->
            <section class="lt-hero">
                <div class="lt-container">
                    <h1><?php the_title(); ?></h1>
                    <p class="lt-hero-tagline">参加登録は簡単！今すぐお申し込みください</p>
                </div>
            </section>

            <!-- Registration Form -->
            <section class="lt-section">
                <div class="lt-container">
                    <div class="lt-event-card">
                        <?php the_content(); ?>
                        
                        <!-- Registration Form -->
                        <form class="lt-registration-form" method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                            <?php wp_nonce_field('lt_registration_nonce', 'lt_registration_nonce_field'); ?>
                            <input type="hidden" name="action" value="lt_registration_submit">
                            
                            <div class="lt-form-row">
                                <div class="lt-form-group">
                                    <label for="participant_name">お名前 <span class="required">*</span></label>
                                    <input type="text" id="participant_name" name="participant_name" required>
                                </div>
                                
                                <div class="lt-form-group">
                                    <label for="participant_email">メールアドレス <span class="required">*</span></label>
                                    <input type="email" id="participant_email" name="participant_email" required>
                                </div>
                            </div>
                            
                            <div class="lt-form-group">
                                <label for="participation_type">参加方法 <span class="required">*</span></label>
                                <select id="participation_type" name="participation_type" required>
                                    <option value="">選択してください</option>
                                    <option value="venue">会場参加</option>
                                    <option value="online">オンライン参加</option>
                                </select>
                            </div>
                            
                            <div class="lt-form-group">
                                <label for="presentation_type">発表について <span class="required">*</span></label>
                                <select id="presentation_type" name="presentation_type" required>
                                    <option value="">選択してください</option>
                                    <option value="presenter">発表者として参加（5分間のプレゼンテーション）</option>
                                    <option value="audience">聴講者として参加</option>
                                </select>
                            </div>
                            
                            <div class="lt-form-group" id="presentation_details" style="display: none;">
                                <label for="presentation_title">発表タイトル</label>
                                <input type="text" id="presentation_title" name="presentation_title">
                                
                                <label for="presentation_topic">発表テーマ・カテゴリ</label>
                                <select id="presentation_topic" name="presentation_topic">
                                    <option value="">選択してください</option>
                                    <option value="programming">プログラミング・技術</option>
                                    <option value="hobby">趣味・アート・創作</option>
                                    <option value="learning">読書・学習体験</option>
                                    <option value="travel">旅行・文化エピソード</option>
                                    <option value="cooking">料理・グルメ体験</option>
                                    <option value="music">音楽・エンタメ</option>
                                    <option value="business">ビジネス・キャリア</option>
                                    <option value="other">その他なんでも！</option>
                                </select>
                                
                                <label for="presentation_description">発表概要（簡単な説明）</label>
                                <textarea id="presentation_description" name="presentation_description" rows="4"></textarea>
                            </div>
                            
                            <div class="lt-form-group">
                                <label for="dietary_restrictions">食事制限・アレルギー</label>
                                <textarea id="dietary_restrictions" name="dietary_restrictions" rows="2" placeholder="特にない場合は空欄で結構です"></textarea>
                            </div>
                            
                            <div class="lt-form-group">
                                <label for="comments">その他ご質問・コメント</label>
                                <textarea id="comments" name="comments" rows="3"></textarea>
                            </div>
                            
                            <div class="lt-form-group">
                                <label class="lt-checkbox-label">
                                    <input type="checkbox" name="privacy_agreement" required>
                                    <span class="checkmark"></span>
                                    個人情報の取り扱いに同意します <span class="required">*</span>
                                </label>
                            </div>
                            
                            <div class="lt-form-group">
                                <label class="lt-checkbox-label">
                                    <input type="checkbox" name="photo_agreement">
                                    <span class="checkmark"></span>
                                    イベントの写真撮影・公開に同意します（任意）
                                </label>
                            </div>
                            
                            <div class="lt-form-submit">
                                <button type="submit" class="lt-button lt-button-primary lt-lightning-effect">
                                    参加登録を完了する
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </article>
    <?php endwhile; ?>
</main>

<script>
document.getElementById('presentation_type').addEventListener('change', function() {
    const presentationDetails = document.getElementById('presentation_details');
    const titleField = document.getElementById('presentation_title');
    const topicField = document.getElementById('presentation_topic');
    const descriptionField = document.getElementById('presentation_description');
    
    if (this.value === 'presenter') {
        presentationDetails.style.display = 'block';
        titleField.required = true;
        topicField.required = true;
        descriptionField.required = true;
    } else {
        presentationDetails.style.display = 'none';
        titleField.required = false;
        topicField.required = false;
        descriptionField.required = false;
    }
});
</script>

<?php get_footer(); ?>