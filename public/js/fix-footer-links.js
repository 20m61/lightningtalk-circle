// フッターリンクの修正スクリプト
document.addEventListener('DOMContentLoaded', () => {
  // フッターリンクを明示的に処理
  const footerLinks = document.querySelectorAll('.footer-links a');

  footerLinks.forEach(link => {
    // 既存のイベントリスナーを削除
    const newLink = link.cloneNode(true);
    link.parentNode.replaceChild(newLink, link);

    // 新しいクリックハンドラーを追加
    newLink.addEventListener('click', e => {
      // 外部リンクでない場合は通常の動作を許可
      if (!newLink.hostname || newLink.hostname === window.location.hostname) {
        // デフォルト動作を許可（preventDefault()を呼ばない）
        console.log('Navigating to:', newLink.href);
      }
    });
  });

  console.log('✅ Footer links fixed');
});
