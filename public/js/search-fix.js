/**
 * 検索機能修正スクリプト
 * 複数のJavaScriptが検索ボタンに干渉する問題を解決
 */

class SearchManager {
  constructor() {
    this.init();
  }

  init() {
    // 既存のイベントリスナーをクリアして新しく設定
    this.setupSearchButton();
    console.log('[SearchManager] 検索機能を修正しました');
  }

  setupSearchButton() {
    // 少し遅延して既存のイベントリスナーの後に実行
    setTimeout(() => {
      const searchBtn = document.querySelector('.search-btn');
      const searchInput = document.getElementById('event-search');

      if (!searchBtn) {
        console.log('[SearchManager] 検索ボタンが見つかりません');
        return;
      }

      // 既存のイベントリスナーを削除するため、新しいボタンに置き換え
      const newSearchBtn = searchBtn.cloneNode(true);
      searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);

      // 新しいイベントリスナーを設定
      newSearchBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        console.log('[SearchManager] 検索ボタンがクリックされました');

        // 検索処理を実行
        this.performSearch();
      });

      // 検索入力でEnterキーを押した時の処理
      if (searchInput) {
        searchInput.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.performSearch();
          }
        });
      }
    }, 100);
  }

  performSearch() {
    const searchInput = document.getElementById('event-search');
    const searchTerm = searchInput ? searchInput.value.trim() : '';

    console.log('[SearchManager] 検索実行:', searchTerm);

    // 既存のイベント管理システムがある場合はそれを使用
    if (window.eventsManager && typeof window.eventsManager.setSearchFilter === 'function') {
      window.eventsManager.setSearchFilter(searchTerm);
      return;
    }

    // フォールバック: 単純な検索実装
    this.simpleSearch(searchTerm);
  }

  setSearchFilter(searchTerm) {
    // EventsManagerのフィルター機能を直接呼び出し
    if (window.eventsManager) {
      window.eventsManager.filters = window.eventsManager.filters || {};
      window.eventsManager.filters.search = searchTerm;

      if (typeof window.eventsManager.renderAllEvents === 'function') {
        window.eventsManager.renderAllEvents();
      }
    }
  }

  simpleSearch(searchTerm) {
    const eventCards = document.querySelectorAll('.event-card, .hero-event-card');
    let visibleCount = 0;

    eventCards.forEach(card => {
      const title = card.querySelector('.event-title, h3')?.textContent || '';
      const description =
        card.querySelector('.event-description, .event-excerpt, p')?.textContent || '';
      const content = (title + ' ' + description).toLowerCase();

      const isVisible = !searchTerm || content.includes(searchTerm.toLowerCase());

      if (isVisible) {
        card.style.display = '';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // 検索結果の表示
    this.showSearchResults(searchTerm, visibleCount);
  }

  showSearchResults(searchTerm, count) {
    // 既存の検索結果表示を削除
    const existingResult = document.querySelector('.search-results-info');
    if (existingResult) {
      existingResult.remove();
    }

    // 検索結果情報を表示
    const resultsContainer = document.querySelector('.events-container, .hero-events-section');
    if (resultsContainer && (searchTerm || count === 0)) {
      const resultInfo = document.createElement('div');
      resultInfo.className = 'search-results-info';
      resultInfo.style.cssText = `
        padding: 1rem;
        margin: 1rem 0;
        background: #f3f4f6;
        border-radius: 0.5rem;
        font-size: 0.9rem;
        color: #374151;
      `;

      if (searchTerm) {
        resultInfo.innerHTML = `
          <span>「${searchTerm}」の検索結果: ${count}件</span>
          <button onclick="window.searchManager.clearSearch()" style="
            margin-left: 1rem;
            padding: 0.25rem 0.5rem;
            background: #ea580c;
            color: white;
            border: none;
            border-radius: 0.25rem;
            font-size: 0.8rem;
            cursor: pointer;
          ">クリア</button>
        `;
      } else if (count === 0) {
        resultInfo.textContent = '検索結果が見つかりませんでした';
      }

      resultsContainer.insertBefore(resultInfo, resultsContainer.firstChild);
    }
  }

  clearSearch() {
    const searchInput = document.getElementById('event-search');
    if (searchInput) {
      searchInput.value = '';
    }

    this.performSearch();
  }

  // モーダルやオーバーレイの誤作動を防ぐ
  preventModalInterference() {
    // 検索ボタンクリック時にモーダルが開かないよう監視
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // モーダルバックドロップが追加された場合
            if (
              node.classList &&
              (node.classList.contains('modal-backdrop') ||
                node.classList.contains('admin-modal__backdrop'))
            ) {
              // 検索関連でない場合は削除
              const searchModal = node.closest('.search-modal');
              if (!searchModal) {
                console.log('[SearchManager] 不正なモーダルバックドロップを削除');
                node.remove();
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  // 少し遅延して他のスクリプトの後に実行
  setTimeout(() => {
    window.searchManager = new SearchManager();

    // モーダル干渉防止も有効化
    window.searchManager.preventModalInterference();
  }, 500);
});

// デバッグ用
window.debugSearch = () => {
  console.log('検索ボタン:', document.querySelector('.search-btn'));
  console.log('検索入力:', document.getElementById('event-search'));
  console.log('EventsManager:', window.eventsManager);
};
