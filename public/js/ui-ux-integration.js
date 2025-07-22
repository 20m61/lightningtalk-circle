/**
 * UI/UX Integration Module
 * 新しいUI/UX機能の統合とエンハンスメント
 */

document.addEventListener('DOMContentLoaded', () => {
  // Progressive Image Loading の初期化
  initProgressiveImages();

  // Micro Interactions の初期化
  initMicroInteractions();

  // Form Enhancements の初期化
  initFormEnhancements();

  // Smooth Scroll の強化
  enhanceSmoothScroll();

  // Mobile Navigation の改善
  enhanceMobileNavigation();

  // Event Cards の強化
  enhanceEventCards();

  // Dark Mode の自動切り替え
  initDarkModeToggle();
});

/**
 * Progressive Image Loading の初期化
 */
function initProgressiveImages() {
  // 既存の画像タグを progressive image 対応に変換
  const images = document.querySelectorAll('img[src]');

  images.forEach(img => {
    // すでに処理済みの画像はスキップ
    if (img.dataset.src) return;

    const src = img.src;
    const isLazyLoadable = !img.hasAttribute('loading') || img.loading === 'lazy';

    if (isLazyLoadable) {
      // プレースホルダーの設定
      const placeholder = generatePlaceholder(img.width || 100, img.height || 100);

      // データ属性の設定
      img.dataset.src = src;
      img.dataset.placeholder = placeholder;

      // srcset と sizes の保持
      if (img.srcset) {
        img.dataset.srcset = img.srcset;
        img.removeAttribute('srcset');
      }

      if (img.sizes) {
        img.dataset.sizes = img.sizes;
        img.removeAttribute('sizes');
      }

      // プレースホルダーの適用
      img.src = placeholder;
      img.classList.add('progressive-image');
    }
  });

  // イベントリスナーの設定
  document.addEventListener('progressive-image-loaded', e => {
    const img = e.target;

    // 読み込み完了時のアニメーション
    if (window.microInteractions) {
      window.microInteractions.addRipple(img.parentElement);
    }
  });
}

/**
 * プレースホルダー画像の生成
 */
function generatePlaceholder(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width / 10; // 低解像度
  canvas.height = height / 10;

  const ctx = canvas.getContext('2d');

  // グラデーション背景
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/jpeg', 0.3);
}

/**
 * Micro Interactions の初期化
 */
function initMicroInteractions() {
  // ボタンにリップルエフェクトを追加
  document.querySelectorAll('.btn, button').forEach(button => {
    button.setAttribute('data-ripple', '');

    // プライマリボタンにはサウンドフィードバック
    if (button.classList.contains('btn-primary')) {
      button.setAttribute('data-sound', 'click');
    }
  });

  // カードに3Dエフェクトを追加
  document.querySelectorAll('.event-card, .participation-card').forEach(card => {
    card.setAttribute('data-3d-card', '');

    // 光沢効果用の要素を追加
    if (!card.querySelector('.card-gloss')) {
      const gloss = document.createElement('div');
      gloss.className = 'card-gloss';
      card.appendChild(gloss);
    }
  });

  // ヒーローセクションのパララックス
  const heroElements = document.querySelectorAll('.floating-elements > div');
  heroElements.forEach((element, index) => {
    const speed = 0.2 + index * 0.1;
    element.setAttribute('data-parallax', speed);
  });

  // カウンターの設定
  document.querySelectorAll('.stats-value').forEach(counter => {
    const value = counter.textContent.replace(/[^0-9]/g, '');
    if (value) {
      counter.setAttribute('data-counter', value);
      counter.textContent = '0';
    }
  });

  // タイピングアニメーション
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    const originalText = heroTitle.textContent;
    heroTitle.setAttribute('data-typewriter', originalText);
    heroTitle.setAttribute('data-type-speed', '100');
    heroTitle.setAttribute('data-type-delay', '500');
  }
}

/**
 * Form Enhancements の初期化
 */
function initFormEnhancements() {
  // 登録フォームの強化
  const registrationForm = document.getElementById('registrationForm');
  if (registrationForm) {
    const formEnhancer = new FormEnhancements(registrationForm, {
      autoSave: true,
      inlineValidation: true,
      showProgress: true,
      passwordStrength: false,
      onSubmit: async data => {
        // フォーム送信処理
        try {
          const response = await fetch('/api/participants', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          });

          if (!response.ok) {
            throw new Error('Registration failed');
          }

          // 成功時の処理
          if (window.microInteractions) {
            window.microInteractions.playSuccessAnimation(registrationForm);
            window.microInteractions.triggerHapticFeedback('success');
          }

          // モーダルを閉じる
          setTimeout(() => {
            const modal = document.getElementById('registerModal');
            if (modal) {
              modal.style.display = 'none';
            }
          }, 2000);
        } catch (error) {
          console.error('Registration error:', error);

          if (window.microInteractions) {
            window.microInteractions.playErrorAnimation(registrationForm);
            window.microInteractions.triggerHapticFeedback('error');
          }

          throw error;
        }
      }
    });
  }

  // 投票フォームの強化
  const voteForm = document.getElementById('voteForm');
  if (voteForm) {
    const voteEnhancer = new FormEnhancements(voteForm, {
      autoSave: false,
      inlineValidation: true,
      showProgress: false
    });
  }
}

/**
 * Smooth Scroll の強化
 */
function enhanceSmoothScroll() {
  // 既存のスムーススクロールを強化
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);

      if (target) {
        // スクロール前のエフェクト
        if (window.microInteractions) {
          window.microInteractions.triggerHapticFeedback('light');
        }

        // カスタムスムーススクロール
        smoothScrollTo(target, 1000, 'easeInOutCubic');

        // URLの更新（履歴に追加しない）
        history.replaceState(null, null, `#${targetId}`);

        // ナビゲーションのアクティブ状態更新
        updateActiveNavLink(targetId);
      }
    });
  });
}

/**
 * カスタムスムーススクロール実装
 */
function smoothScrollTo(target, duration = 1000, easing = 'linear') {
  const startPosition = window.pageYOffset;
  const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
  const distance = targetPosition - startPosition;
  const startTime = performance.now();

  const easingFunctions = {
    linear: t => t,
    easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
    easeOutExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))
  };

  const easingFunction = easingFunctions[easing] || easingFunctions.linear;

  function animation(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFunction(progress);

    window.scrollTo(0, startPosition + distance * easedProgress);

    if (progress < 1) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

/**
 * ナビゲーションリンクのアクティブ状態更新
 */
function updateActiveNavLink(targetId) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');

    if (link.getAttribute('href') === `#${targetId}`) {
      link.classList.add('active');
    }
  });
}

/**
 * Mobile Navigation の改善
 */
function enhanceMobileNavigation() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuToggle && navLinks) {
    // スワイプジェスチャーでメニューを閉じる
    if (window.microInteractions) {
      const swipeHandler = new SwipeHandler(navLinks, {
        onSwipeLeft: () => {
          if (navLinks.classList.contains('nav-links--open')) {
            closeMobileMenu();
          }
        }
      });
    }

    // メニュー外クリックで閉じる
    document.addEventListener('click', e => {
      if (
        navLinks.classList.contains('nav-links--open') &&
        !navLinks.contains(e.target) &&
        !mobileMenuToggle.contains(e.target)
      ) {
        closeMobileMenu();
      }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && navLinks.classList.contains('nav-links--open')) {
        closeMobileMenu();
      }
    });
  }
}

function closeMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');

  navLinks.classList.remove('nav-links--open');
  mobileMenuToggle.classList.remove('mobile-menu-toggle--open');

  // アニメーション
  if (window.microInteractions) {
    window.microInteractions.triggerHapticFeedback('light');
  }
}

/**
 * Event Cards の強化
 */
function enhanceEventCards() {
  const eventCards = document.querySelectorAll('.event-card');

  eventCards.forEach(card => {
    // ホバーエフェクトの強化
    card.addEventListener('mouseenter', () => {
      // 隣接カードを押し下げる効果
      const siblings = Array.from(card.parentElement.children).filter(c => c !== card);
      siblings.forEach(sibling => {
        sibling.style.transform = 'scale(0.98)';
        sibling.style.opacity = '0.8';
      });
    });

    card.addEventListener('mouseleave', () => {
      const siblings = Array.from(card.parentElement.children);
      siblings.forEach(sibling => {
        sibling.style.transform = '';
        sibling.style.opacity = '';
      });
    });

    // クリック時のフィードバック
    card.addEventListener('click', () => {
      if (window.microInteractions) {
        window.microInteractions.triggerHapticFeedback('medium');
      }
    });
  });
}

/**
 * Dark Mode Toggle の初期化
 */
function initDarkModeToggle() {
  // ダークモードボタンの作成
  const darkModeToggle = document.createElement('button');
  darkModeToggle.className = 'dark-mode-toggle';
  darkModeToggle.innerHTML = `
    <svg class="icon-light" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
    </svg>
    <svg class="icon-dark" viewBox="0 0 20 20" fill="currentColor">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
    </svg>
  `;

  darkModeToggle.setAttribute('data-sound', 'click');
  darkModeToggle.setAttribute('data-ripple', '');

  // ボタンをヘッダーに追加
  const authHeader = document.getElementById('auth-header');
  if (authHeader) {
    authHeader.insertAdjacentElement('beforebegin', darkModeToggle);
  }

  // クリックイベント
  darkModeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // アニメーション
    document.documentElement.classList.add('theme-transition');
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  });

  // 初期テーマの設定
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', theme);
}

// CSS の挿入
if (!document.querySelector('#ui-ux-integration-style')) {
  const style = document.createElement('style');
  style.id = 'ui-ux-integration-style';
  style.textContent = `
    /* Progressive Images */
    .progressive-image {
      filter: blur(10px);
      transform: scale(1.05);
      transition: filter 0.3s ease-out, transform 0.3s ease-out;
    }
    
    .progressive-image.image-loaded {
      filter: none;
      transform: scale(1);
    }
    
    /* Card Gloss Effect */
    .card-gloss {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 70%
      );
      transform: rotate(45deg);
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    }
    
    /* Dark Mode Toggle */
    .dark-mode-toggle {
      position: relative;
      width: 40px;
      height: 40px;
      border: none;
      background: var(--color-surface);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    
    .dark-mode-toggle:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
    
    .dark-mode-toggle svg {
      width: 20px;
      height: 20px;
      transition: all 0.3s ease;
    }
    
    .dark-mode-toggle .icon-light {
      display: block;
      color: var(--color-primary);
    }
    
    .dark-mode-toggle .icon-dark {
      display: none;
      color: var(--color-secondary);
    }
    
    [data-theme="dark"] .dark-mode-toggle .icon-light {
      display: none;
    }
    
    [data-theme="dark"] .dark-mode-toggle .icon-dark {
      display: block;
    }
    
    /* Theme Transition */
    .theme-transition,
    .theme-transition *,
    .theme-transition *::before,
    .theme-transition *::after {
      transition: all 0.3s ease !important;
    }
    
    /* Enhanced Nav Active State */
    .nav-link {
      position: relative;
      transition: color 0.3s ease;
    }
    
    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--color-primary);
      transition: width 0.3s ease;
    }
    
    .nav-link.active::after,
    .nav-link:hover::after {
      width: 100%;
    }
    
    /* Enhanced Event Cards */
    .event-card,
    .participation-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Mobile Menu Enhancements */
    @media (max-width: 768px) {
      .nav-links {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .nav-links--open {
        transform: translateX(0) !important;
      }
    }
  `;
  document.head.appendChild(style);
}
