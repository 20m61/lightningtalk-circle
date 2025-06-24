/**
 * Lightning Talk Pro Theme - Landing Page JavaScript
 * Version: 1.1.0
 * ランディングページ専用スクリプト
 */

/* global jQuery, AOS, LightningTalkLanding */

(function ($) {
  'use strict';

  // ランディングページオブジェクト
  window.LightningTalkLanding = {
    // 初期化
    init() {
      this.initScrollEffects();
      this.initCounterAnimation();
      this.initFAQAccordion();
      this.initFloatingCTA();
      this.initSmoothScroll();
      this.initParallax();
      this.initAOS();
    },

    // スクロールエフェクト
    initScrollEffects() {
      const $window = $(window);
      const $header = $('.site-header');

      $window.on('scroll', () => {
        const scrollTop = $window.scrollTop();

        // ヘッダーの背景変更
        if (scrollTop > 100) {
          $header.addClass('scrolled');
        } else {
          $header.removeClass('scrolled');
        }

        // パララックス効果
        this.updateParallax(scrollTop);
      });
    },

    // カウンターアニメーション
    initCounterAnimation() {
      const counters = document.querySelectorAll('.stat-number');
      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.animateCounter(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );

      counters.forEach(counter => {
        observer.observe(counter);
      });
    },

    // カウンター数値アニメーション
    animateCounter(element) {
      const target = parseInt(element.dataset.target);
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString();
      }, 16);
    },

    // FAQアコーディオン
    initFAQAccordion() {
      $('.faq-question').on('click', function () {
        const $item = $(this).parent();
        const $answer = $item.find('.faq-answer');

        // 他のFAQを閉じる
        $('.faq-item').not($item).removeClass('active');
        $('.faq-answer').not($answer).slideUp(300);

        // クリックされたFAQをトグル
        $item.toggleClass('active');
        $answer.slideToggle(300);
      });
    },

    // フローティングCTA
    initFloatingCTA() {
      const $floatingCTA = $('#floatingCta');
      const $window = $(window);

      $window.on('scroll', () => {
        const scrollTop = $window.scrollTop();
        const windowHeight = $window.height();

        // ヒーローセクションを過ぎたら表示
        if (scrollTop > windowHeight * 0.8) {
          $floatingCTA.addClass('visible');
        } else {
          $floatingCTA.removeClass('visible');
        }
      });
    },

    // スムーズスクロール
    initSmoothScroll() {
      $('a[href^="#"]').on('click', function (e) {
        e.preventDefault();

        const target = $(this.getAttribute('href'));
        if (target.length) {
          const offsetTop = target.offset().top - 80;

          $('html, body').animate(
            {
              scrollTop: offsetTop
            },
            800,
            'easeInOutQuart'
          );
        }
      });
    },

    // パララックス効果
    initParallax() {
      this.parallaxElements = [
        { selector: '.hero-particles', speed: 0.5 },
        { selector: '.about-item', speed: 0.8 },
        { selector: '.category-item', speed: 0.6 }
      ];
    },

    updateParallax(scrollTop) {
      this.parallaxElements.forEach(item => {
        const $elements = $(item.selector);
        const yPos = -(scrollTop * item.speed);

        $elements.css('transform', `translateY(${yPos}px)`);
      });
    },

    // AOS (Animate On Scroll) の初期化
    initAOS() {
      // AOS ライブラリが利用可能な場合のみ
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 800,
          easing: 'ease-out-cubic',
          once: true,
          offset: 100
        });
      } else {
        // AOS がない場合の代替アニメーション
        this.initScrollAnimation();
      }
    },

    // スクロールアニメーション（AOS代替）
    initScrollAnimation() {
      const animatedElements = document.querySelectorAll('[data-aos]');

      const observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('aos-animate');
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        }
      );

      animatedElements.forEach(element => {
        observer.observe(element);
      });
    },

    // パーティクル効果（ヒーローセクション）
    initParticles() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const $heroSection = $('.hero-section');

      if (!$heroSection.length) {
        return;
      }

      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1';
      canvas.style.pointerEvents = 'none';

      $heroSection.append(canvas);

      const resizeCanvas = () => {
        canvas.width = $heroSection.width();
        canvas.height = $heroSection.height();
      };

      const particles = [];
      const particleCount = 50;

      // パーティクル生成
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: Math.random() * 2 - 1,
          speedY: Math.random() * 2 - 1,
          opacity: Math.random() * 0.5 + 0.1
        });
      }

      // アニメーション
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(particle => {
          particle.x += particle.speedX;
          particle.y += particle.speedY;

          // 境界チェック
          if (particle.x < 0 || particle.x > canvas.width) {
            particle.speedX *= -1;
          }
          if (particle.y < 0 || particle.y > canvas.height) {
            particle.speedY *= -1;
          }

          // パーティクル描画
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
          ctx.fill();
        });

        requestAnimationFrame(animate);
      };

      resizeCanvas();
      animate();

      $(window).on('resize', resizeCanvas);
    },

    // タイピング効果
    initTypingEffect() {
      const $typingElement = $('.hero-description');
      if (!$typingElement.length) {
        return;
      }

      const text = $typingElement.text();
      $typingElement.text('');

      let i = 0;
      const typeWriter = () => {
        if (i < text.length) {
          $typingElement.text($typingElement.text() + text.charAt(i));
          i++;
          setTimeout(typeWriter, 50);
        }
      };

      // ページ読み込み後に開始
      setTimeout(typeWriter, 1000);
    },

    // イベント登録統計の更新
    updateEventStats() {
      $('.event-card-featured').each(function () {
        const $card = $(this);
        const eventId = $card.data('event-id');

        if (eventId && window.getLightningTalkParticipantCount) {
          window.getLightningTalkParticipantCount(eventId, response => {
            if (response.success) {
              const $metaInfo = $card.find('.event-meta-info');
              $metaInfo.html(`
                                <span>👥 ${response.data.total}名参加予定</span>
                                <span>🎤 ${response.data.speakers}名発表予定</span>
                            `);
            }
          });
        }
      });
    },

    // フォームの強化
    enhanceForms() {
      // 登録フォームにアニメーションを追加
      $('.lt-registration-form').on('submit', function () {
        const $btn = $(this).find('.lt-btn-submit');
        const originalText = $btn.text();

        $btn.html('<span class="spinner"></span> 登録中...');
        $btn.prop('disabled', true);

        // 元のAJAX処理完了後にボタンを復元
        const originalComplete = window.LightningTalk.handleRegistration;
        if (originalComplete) {
          // 一時的にボタンの状態をリセットする処理を追加
          setTimeout(() => {
            $btn.text(originalText);
            $btn.prop('disabled', false);
          }, 2000);
        }
      });
    },

    // パフォーマンス最適化
    optimizePerformance() {
      // 画像の遅延読み込み
      const images = document.querySelectorAll('img[data-src]');
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));

      // CSSアニメーションの最適化
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (prefersReducedMotion.matches) {
        document.body.classList.add('reduce-motion');
      }
    }
  };

  // jQuery easing の追加
  $.extend($.easing, {
    easeInOutQuart(x, t, b, c, d) {
      if ((t /= d / 2) < 1) {
        return (c / 2) * t * t * t * t + b;
      }
      return (-c / 2) * ((t -= 2) * t * t * t - 2) + b;
    }
  });

  // ドキュメント準備完了時に初期化
  $(document).ready(() => {
    LightningTalkLanding.init();

    // 少し遅れて実行する処理
    setTimeout(() => {
      LightningTalkLanding.updateEventStats();
      LightningTalkLanding.enhanceForms();
      LightningTalkLanding.optimizePerformance();
    }, 1000);
  });

  // ウィンドウ読み込み完了時
  $(window).on('load', () => {
    // パーティクル効果は重いのでオプション
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      LightningTalkLanding.initParticles();
    }
  });
})(jQuery);

// スピナー用CSS（動的に追加）
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .reduce-motion * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
        
        .site-header.scrolled {
            background: rgba(255, 255, 255, 0.95) !important;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        
        .site-header.scrolled .site-title a,
        .site-header.scrolled .main-navigation a {
            color: #333 !important;
        }
    `;
  document.head.appendChild(style);
});
