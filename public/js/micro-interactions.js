/**
 * Micro Interactions Library
 * ユーザー体験を向上させるマイクロインタラクション
 */

class MicroInteractions {
  constructor() {
    this.rippleElements = new Set();
    this.magneticElements = new Set();
    this.parallaxElements = new Set();
    this.init();
  }

  init() {
    // Use requestIdleCallback for performance optimization
    if (window.requestIdleCallback) {
      // High priority interactions first
      this.initRippleEffect();
      this.initMagneticEffect();

      // Lower priority animations during idle time
      requestIdleCallback(() => {
        this.initParallaxEffect();
        this.init3DCardEffect();
        this.initSmoothCounters();
      });

      requestIdleCallback(() => {
        this.initTypewriterEffect();
        this.initParticleEffect();
        this.initSoundFeedback();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      this.initRippleEffect();
      this.initMagneticEffect();
      this.initParallaxEffect();
      this.init3DCardEffect();
      this.initSmoothCounters();
      this.initTypewriterEffect();
      this.initParticleEffect();
      this.initSoundFeedback();
    }
  }

  // リップルエフェクト
  initRippleEffect() {
    document.addEventListener('click', e => {
      const target = e.target.closest('[data-ripple]');
      if (!target) return;

      const ripple = document.createElement('span');
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: currentColor;
        opacity: 0.3;
        transform: translate(${x}px, ${y}px) scale(0);
        pointer-events: none;
        animation: ripple-animation 0.6s ease-out;
      `;

      target.style.position = 'relative';
      target.style.overflow = 'hidden';
      target.appendChild(ripple);

      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    });

    // リップルアニメーションのCSS
    if (!document.querySelector('#ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `
        @keyframes ripple-animation {
          to {
            transform: translate(var(--x, 0), var(--y, 0)) scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // マグネティックエフェクト
  initMagneticEffect() {
    const magneticElements = document.querySelectorAll('[data-magnetic]');

    magneticElements.forEach(element => {
      const strength = parseFloat(element.dataset.magnetic) || 0.5;

      element.addEventListener('mousemove', e => {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distanceX = (e.clientX - centerX) * strength;
        const distanceY = (e.clientY - centerY) * strength;

        element.style.transform = `translate(${distanceX}px, ${distanceY}px)`;
      });

      element.addEventListener('mouseleave', () => {
        element.style.transform = 'translate(0, 0)';
      });

      // トランジション設定
      element.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      this.magneticElements.add(element);
    });
  }

  // パララックススクロール効果
  initParallaxEffect() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');

    const handleParallax = () => {
      const scrolled = window.pageYOffset;

      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const yPos = -(scrolled * speed);

        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    // スクロールイベントの最適化
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleParallax();
          ticking = false;
        });
        ticking = true;
      }
    });

    parallaxElements.forEach(el => this.parallaxElements.add(el));
  }

  // 3Dカードエフェクト
  init3DCardEffect() {
    const cards = document.querySelectorAll('[data-3d-card]');

    cards.forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `
          perspective(1000px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          scale3d(1.05, 1.05, 1.05)
        `;

        // 光沢効果
        const gloss = card.querySelector('.card-gloss');
        if (gloss) {
          gloss.style.transform = `
            translateX(${(x - centerX) * 0.3}px)
            translateY(${(y - centerY) * 0.3}px)
          `;
          gloss.style.opacity = '0.4';
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';

        const gloss = card.querySelector('.card-gloss');
        if (gloss) {
          gloss.style.transform = 'translateX(0) translateY(0)';
          gloss.style.opacity = '0';
        }
      });

      // トランジション設定
      card.style.transition = 'transform 0.3s ease-out';
      card.style.transformStyle = 'preserve-3d';
    });
  }

  // スムーズカウンター
  initSmoothCounters() {
    const counters = document.querySelectorAll('[data-counter]');

    const animateCounter = counter => {
      const target = parseInt(counter.dataset.counter);
      const duration = parseInt(counter.dataset.duration) || 2000;
      const start = 0;
      const startTime = performance.now();

      const updateCounter = currentTime => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // イージング関数（ease-out-expo）
        const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(start + (target - start) * easeOutExpo);

        counter.textContent = current.toLocaleString();

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        }
      };

      requestAnimationFrame(updateCounter);
    };

    // Intersection Observer で表示時にアニメーション開始
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            animateCounter(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(counter => observer.observe(counter));
  }

  // タイピングアニメーション
  initTypewriterEffect() {
    const typewriters = document.querySelectorAll('[data-typewriter]');

    typewriters.forEach(element => {
      const text = element.dataset.typewriter;
      const speed = parseInt(element.dataset.typeSpeed) || 100;
      const delay = parseInt(element.dataset.typeDelay) || 0;

      element.textContent = '';
      element.style.borderRight = '2px solid currentColor';
      element.style.animation = 'blink 1s step-end infinite';

      setTimeout(() => {
        let index = 0;
        const type = () => {
          if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            setTimeout(type, speed);
          } else {
            element.style.animation = 'none';
            element.style.borderRight = 'none';
          }
        };
        type();
      }, delay);
    });

    // カーソル点滅アニメーション
    if (!document.querySelector('#typewriter-style')) {
      const style = document.createElement('style');
      style.id = 'typewriter-style';
      style.textContent = `
        @keyframes blink {
          0%, 50% { border-color: currentColor; }
          51%, 100% { border-color: transparent; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // パーティクルエフェクト
  initParticleEffect() {
    const particleContainers = document.querySelectorAll('[data-particles]');

    particleContainers.forEach(container => {
      const particleCount = parseInt(container.dataset.particles) || 50;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
          position: absolute;
          width: ${Math.random() * 6 + 2}px;
          height: ${Math.random() * 6 + 2}px;
          background: ${container.dataset.particleColor || '#ff6b35'};
          border-radius: 50%;
          opacity: ${Math.random() * 0.5 + 0.5};
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation: float ${Math.random() * 10 + 20}s linear infinite;
        `;

        container.appendChild(particle);
      }
    });

    // パーティクル浮遊アニメーション
    if (!document.querySelector('#particle-style')) {
      const style = document.createElement('style');
      style.id = 'particle-style';
      style.textContent = `
        @keyframes float {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
          100% { transform: translate(0, 0) rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // サウンドフィードバック
  initSoundFeedback() {
    // Web Audio API を使用した軽量なサウンドフィードバック
    if (!window.AudioContext && !window.webkitAudioContext) return;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const playSound = (frequency = 440, duration = 0.1, type = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    };

    // クリック音
    document.addEventListener('click', e => {
      if (e.target.matches('[data-sound="click"]')) {
        playSound(600, 0.05);
      }
    });

    // ホバー音
    document.addEventListener(
      'mouseenter',
      e => {
        if (e.target.matches('[data-sound="hover"]')) {
          playSound(800, 0.03, 'square');
        }
      },
      true
    );

    // 成功音
    window.addEventListener('micro-interaction:success', () => {
      playSound(800, 0.1);
      setTimeout(() => playSound(1000, 0.1), 100);
    });

    // エラー音
    window.addEventListener('micro-interaction:error', () => {
      playSound(200, 0.2, 'sawtooth');
    });
  }

  // ユーティリティメソッド
  triggerHapticFeedback(style = 'light') {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 20, 10],
        warning: [20, 10, 20],
        error: [50, 10, 50]
      };

      navigator.vibrate(patterns[style] || patterns.light);
    }
  }

  // Public API
  addRipple(element) {
    element.setAttribute('data-ripple', '');
  }

  addMagnetic(element, strength = 0.5) {
    element.setAttribute('data-magnetic', strength);
    this.initMagneticEffect();
  }

  addParallax(element, speed = 0.5) {
    element.setAttribute('data-parallax', speed);
    this.initParallaxEffect();
  }

  add3DCard(element) {
    element.setAttribute('data-3d-card', '');
    this.init3DCardEffect();
  }

  playSuccessAnimation(element) {
    element.classList.add('success-animation');
    window.dispatchEvent(new CustomEvent('micro-interaction:success'));

    setTimeout(() => {
      element.classList.remove('success-animation');
    }, 1000);
  }

  playErrorAnimation(element) {
    element.classList.add('error-shake');
    window.dispatchEvent(new CustomEvent('micro-interaction:error'));

    setTimeout(() => {
      element.classList.remove('error-shake');
    }, 500);
  }
}

// 成功・エラーアニメーションのスタイル
if (!document.querySelector('#micro-interactions-style')) {
  const style = document.createElement('style');
  style.id = 'micro-interactions-style';
  style.textContent = `
    .success-animation {
      animation: success-pulse 0.5s ease-out;
    }
    
    @keyframes success-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .error-shake {
      animation: error-shake 0.5s ease-out;
    }
    
    @keyframes error-shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `;
  document.head.appendChild(style);
}

// 自動初期化
document.addEventListener('DOMContentLoaded', () => {
  window.microInteractions = new MicroInteractions();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MicroInteractions;
}
