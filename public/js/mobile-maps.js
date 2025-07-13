/**
 * Mobile Maps Optimization v1
 * Touch gestures and mobile-specific functionality for Maps and Emergency system
 */

class MobileMapsOptimizer {
  constructor(mapsSystem, emergencySystem) {
    this.mapsSystem = mapsSystem;
    this.emergencySystem = emergencySystem;
    this.isMobile = this.detectMobile();
    this.touchStarted = false;
    this.lastTouchTime = 0;
    this.touchGestures = {
      swipeThreshold: 50,
      doubleTapDelay: 300,
      longPressDelay: 500
    };

    if (this.isMobile) {
      this.init();
    }
  }

  /**
   * Initialize mobile optimizations
   */
  init() {
    this.setupTouchGestures();
    this.setupMobileUI();
    this.setupOrientationHandling();
    this.setupVibrationFeedback();
    this.optimizeForMobile();
    
    console.log('Mobile Maps Optimizer initialized');
  }

  /**
   * Detect if device is mobile
   */
  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  /**
   * Setup touch gestures for map interaction
   */
  setupTouchGestures() {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;

    let touchStart = null;
    let touchCurrent = null;
    let longPressTimer = null;

    // Touch start
    mapContainer.addEventListener('touchstart', (e) => {
      this.touchStarted = true;
      touchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };

      // Setup long press detection
      longPressTimer = setTimeout(() => {
        if (this.touchStarted) {
          this.handleLongPress(touchStart);
        }
      }, this.touchGestures.longPressDelay);
    });

    // Touch move
    mapContainer.addEventListener('touchmove', (e) => {
      touchCurrent = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };

      // Cancel long press if moving
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });

    // Touch end
    mapContainer.addEventListener('touchend', (e) => {
      this.touchStarted = false;
      
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }

      if (!touchStart || !touchCurrent) {
        // Handle tap
        this.handleTap(touchStart);
        return;
      }

      const deltaX = touchCurrent.x - touchStart.x;
      const deltaY = touchCurrent.y - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = Date.now() - touchStart.time;

      // Handle swipe gestures
      if (distance > this.touchGestures.swipeThreshold && duration < 300) {
        this.handleSwipe(deltaX, deltaY, distance);
      }

      touchStart = null;
      touchCurrent = null;
    });

    // Prevent default touch behaviors for map area
    mapContainer.addEventListener('touchstart', (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent zoom on multi-touch
      }
    }, { passive: false });
  }

  /**
   * Handle tap gesture
   */
  handleTap(touchPoint) {
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastTouchTime;

    if (timeDiff < this.touchGestures.doubleTapDelay) {
      // Double tap - center on venue
      this.handleDoubleTap();
    }

    this.lastTouchTime = currentTime;
  }

  /**
   * Handle double tap - center map on venue
   */
  handleDoubleTap() {
    if (this.mapsSystem && this.mapsSystem.centerOnVenue) {
      this.mapsSystem.centerOnVenue();
      this.vibrate([50]); // Short vibration feedback
    }
  }

  /**
   * Handle long press - show emergency menu
   */
  handleLongPress(touchPoint) {
    if (this.emergencySystem) {
      this.emergencySystem.showAllContacts();
      this.vibrate([100, 50, 100]); // Pattern vibration for emergency
    }
  }

  /**
   * Handle swipe gestures
   */
  handleSwipe(deltaX, deltaY, distance) {
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    // Vertical swipes
    if (Math.abs(angle) > 45 && Math.abs(angle) < 135) {
      if (deltaY < 0) {
        // Swipe up - show directions panel
        this.showDirectionsPanel();
      } else {
        // Swipe down - hide directions panel
        this.hideDirectionsPanel();
      }
    }

    // Horizontal swipes
    else {
      if (deltaX > 0) {
        // Swipe right - show nearby services
        this.toggleNearbyServices();
      } else {
        // Swipe left - toggle emergency panel
        this.toggleEmergencyPanel();
      }
    }

    this.vibrate([30]); // Light feedback for swipe
  }

  /**
   * Setup mobile-specific UI enhancements
   */
  setupMobileUI() {
    // Add mobile-specific CSS class
    document.body.classList.add('mobile-optimized');

    // Create mobile floating action button
    this.createMobileFAB();

    // Enhance touch targets
    this.enhanceTouchTargets();

    // Setup bottom sheet for mobile actions
    this.setupBottomSheet();
  }

  /**
   * Create mobile floating action button
   */
  createMobileFAB() {
    const fab = document.createElement('div');
    fab.className = 'mobile-fab';
    fab.innerHTML = `
      <div class="fab-main" onclick="mobileMapsOptimizer.toggleFABMenu()">
        <span class="fab-icon">🎯</span>
      </div>
      <div class="fab-menu" id="fab-menu">
        <button class="fab-action" onclick="mobileMapsOptimizer.quickAction('center')" title="会場を中心に">
          🏢
        </button>
        <button class="fab-action" onclick="mobileMapsOptimizer.quickAction('directions')" title="道順">
          🧭
        </button>
        <button class="fab-action" onclick="mobileMapsOptimizer.quickAction('emergency')" title="緊急連絡">
          🚨
        </button>
        <button class="fab-action" onclick="mobileMapsOptimizer.quickAction('share')" title="位置共有">
          📤
        </button>
      </div>
    `;

    // Add FAB styles
    const style = document.createElement('style');
    style.textContent = `
      .mobile-fab {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
      }

      .fab-main {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--color-primary-500);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      }

      .fab-main:active {
        transform: scale(0.95);
      }

      .fab-icon {
        font-size: 24px;
      }

      .fab-menu {
        position: absolute;
        bottom: 70px;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        opacity: 0;
        visibility: hidden;
        transform: translateY(20px);
        transition: all 0.3s ease;
      }

      .fab-menu.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .fab-action {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--color-neutral-0);
        border: 1px solid var(--color-neutral-300);
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
      }

      .fab-action:active {
        transform: scale(0.9);
      }

      .mobile-bottom-sheet {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-radius: 20px 20px 0 0;
        padding: 20px;
        transform: translateY(100%);
        transition: transform 0.3s ease;
        z-index: 999;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
      }

      .mobile-bottom-sheet.open {
        transform: translateY(0);
      }

      .bottom-sheet-handle {
        width: 40px;
        height: 4px;
        background: var(--color-neutral-300);
        border-radius: 2px;
        margin: 0 auto 16px;
      }

      @media (max-width: 768px) {
        .emergency-quick-access {
          display: none; /* Hide desktop emergency widget on mobile */
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(fab);
  }

  /**
   * Setup bottom sheet for mobile actions
   */
  setupBottomSheet() {
    const bottomSheet = document.createElement('div');
    bottomSheet.className = 'mobile-bottom-sheet';
    bottomSheet.id = 'mobile-bottom-sheet';
    bottomSheet.innerHTML = `
      <div class="bottom-sheet-handle"></div>
      <div class="bottom-sheet-content">
        <h3>クイックアクション</h3>
        <div class="quick-actions-grid">
          <button class="action-btn" onclick="mobileMapsOptimizer.quickAction('center')">
            🏢 会場を中心に
          </button>
          <button class="action-btn" onclick="mobileMapsOptimizer.quickAction('directions')">
            🧭 道順を表示
          </button>
          <button class="action-btn" onclick="mobileMapsOptimizer.quickAction('emergency')">
            🚨 緊急連絡先
          </button>
          <button class="action-btn" onclick="mobileMapsOptimizer.quickAction('share')">
            📤 位置を共有
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(bottomSheet);
  }

  /**
   * Enhance touch targets for better mobile interaction
   */
  enhanceTouchTargets() {
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 768px) {
        .map-btn,
        .contact-call-btn,
        .action-btn {
          min-height: 44px;
          min-width: 44px;
          padding: 12px 16px;
          font-size: 16px;
        }

        .emergency-toggle {
          width: 64px;
          height: 64px;
        }

        .contact-call-btn {
          padding: 8px 12px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Setup orientation change handling
   */
  setupOrientationHandling() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (this.mapsSystem && this.mapsSystem.map) {
          google.maps.event.trigger(this.mapsSystem.map, 'resize');
        }
      }, 500);
    });
  }

  /**
   * Setup vibration feedback for touch interactions
   */
  setupVibrationFeedback() {
    // Add vibration to emergency actions
    const emergencyButtons = document.querySelectorAll('.emergency, .contact-call-btn');
    emergencyButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.vibrate([50, 50, 50]);
      });
    });
  }

  /**
   * Optimize various elements for mobile
   */
  optimizeForMobile() {
    // Optimize map container for mobile
    const mapContainer = document.getElementById('map-container');
    if (mapContainer) {
      mapContainer.style.minHeight = '60vh';
    }

    // Hide complex controls on small screens
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 480px) {
        .service-filters {
          display: none;
        }
        
        .map-controls {
          position: relative;
          top: auto;
          left: auto;
          width: 100%;
          flex-direction: row;
          justify-content: center;
          margin-bottom: 16px;
        }

        .emergency-panel {
          width: calc(100vw - 32px);
          left: 16px;
          right: 16px;
          bottom: calc(100% + 16px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Toggle FAB menu
   */
  toggleFABMenu() {
    const menu = document.getElementById('fab-menu');
    menu.classList.toggle('open');
    this.vibrate([30]);
  }

  /**
   * Handle quick actions from mobile interface
   */
  quickAction(action) {
    this.vibrate([50]);

    switch (action) {
      case 'center':
        if (this.mapsSystem) {
          this.mapsSystem.centerOnVenue();
        }
        break;
      
      case 'directions':
        if (this.mapsSystem) {
          this.mapsSystem.getDirections();
        }
        break;
      
      case 'emergency':
        if (this.emergencySystem) {
          this.emergencySystem.showAllContacts();
        }
        break;
      
      case 'share':
        if (this.mapsSystem) {
          this.mapsSystem.shareLocation();
        }
        break;
    }

    // Close FAB menu
    const menu = document.getElementById('fab-menu');
    menu.classList.remove('open');
  }

  /**
   * Show directions panel (mobile optimized)
   */
  showDirectionsPanel() {
    const panel = document.getElementById('directions-panel');
    if (panel) {
      panel.style.display = 'block';
      panel.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /**
   * Hide directions panel
   */
  hideDirectionsPanel() {
    const panel = document.getElementById('directions-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }

  /**
   * Toggle nearby services visibility
   */
  toggleNearbyServices() {
    if (this.mapsSystem) {
      // Cycle through different service types
      const serviceTypes = ['restaurant', 'hospital', 'convenience_store', 'subway_station'];
      const currentType = this.currentServiceType || 0;
      const nextType = (currentType + 1) % serviceTypes.length;
      
      this.mapsSystem.toggleNearbyServices(serviceTypes[nextType]);
      this.currentServiceType = nextType;
    }
  }

  /**
   * Toggle emergency panel
   */
  toggleEmergencyPanel() {
    const bottomSheet = document.getElementById('mobile-bottom-sheet');
    if (bottomSheet) {
      bottomSheet.classList.toggle('open');
    }
  }

  /**
   * Vibrate device (if supported)
   */
  vibrate(pattern) {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Handle device wake lock for navigation
   */
  async requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        const wakeLock = await navigator.wakeLock.request('screen');
        console.log('Screen wake lock requested');
        return wakeLock;
      } catch (err) {
        console.warn('Failed to request wake lock:', err);
      }
    }
    return null;
  }

  /**
   * Setup swipe gesture recognition
   */
  setupSwipeGestures(element) {
    let startX, startY, endX, endY;

    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;

      const deltaX = endX - startX;
      const deltaY = endY - startY;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 50) {
          this.handleSwipeRight();
        } else if (deltaX < -50) {
          this.handleSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (deltaY > 50) {
          this.handleSwipeDown();
        } else if (deltaY < -50) {
          this.handleSwipeUp();
        }
      }
    });
  }

  /**
   * Handle swipe gestures
   */
  handleSwipeRight() {
    this.toggleNearbyServices();
  }

  handleSwipeLeft() {
    this.toggleEmergencyPanel();
  }

  handleSwipeUp() {
    this.showDirectionsPanel();
  }

  handleSwipeDown() {
    this.hideDirectionsPanel();
  }

  /**
   * Cleanup mobile optimizations
   */
  destroy() {
    const fab = document.querySelector('.mobile-fab');
    if (fab) {
      fab.remove();
    }

    const bottomSheet = document.getElementById('mobile-bottom-sheet');
    if (bottomSheet) {
      bottomSheet.remove();
    }

    document.body.classList.remove('mobile-optimized');
  }
}

// Global instance
let mobileMapsOptimizer = null;

// Initialize when both maps and emergency systems are ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for other systems to initialize
  setTimeout(() => {
    if (window.mapsSystem && window.emergencySystem) {
      mobileMapsOptimizer = new MobileMapsOptimizer(window.mapsSystem, window.emergencySystem);
      window.mobileMapsOptimizer = mobileMapsOptimizer;
    }
  }, 1000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileMapsOptimizer;
}