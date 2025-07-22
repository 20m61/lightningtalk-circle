/**
 * Emergency Contact System v1
 * Safety and emergency communication system for Lightning Talk Circle events
 */

class EmergencyContactSystem {
  constructor(options = {}) {
    this.options = {
      apiEndpoint: '/api/emergency-contacts',
      autoVerify: true,
      quickAccessEnabled: true,
      emergencyTypes: [
        { id: 'medical', name: '医療緊急事態', icon: '🏥', priority: 1 },
        { id: 'security', name: 'セキュリティ', icon: '👮', priority: 2 },
        { id: 'fire', name: '火災', icon: '🚒', priority: 1 },
        { id: 'general', name: '一般的な緊急事態', icon: '🚨', priority: 3 },
        { id: 'venue', name: '会場関連', icon: '🏢', priority: 2 }
      ],
      ...options
    };

    this.contacts = new Map();
    this.eventContacts = [];
    this.quickAccessWidget = null;
    this.authToken = this.getAuthToken();
    this.isInitialized = false;

    this.init();
  }

  /**
   * Initialize the Emergency Contact System
   */
  async init() {
    try {
      await this.loadSystemContacts();
      this.setupQuickAccess();
      this.attachEventListeners();

      this.isInitialized = true;
      console.log('Emergency Contact System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Emergency Contact System:', error);
      this.showError('緊急連絡システムの初期化に失敗しました');
    }
  }

  /**
   * Load default system emergency contacts
   */
  async loadSystemContacts() {
    // Default emergency contacts for Japan
    const systemContacts = [
      {
        id: 'police',
        name: '警察',
        phone: '110',
        type: 'security',
        priority: 1,
        description: '事件・事故の通報',
        isSystem: true,
        verified: true
      },
      {
        id: 'fire-ambulance',
        name: '消防・救急',
        phone: '119',
        type: 'medical',
        priority: 1,
        description: '火災・救急医療',
        isSystem: true,
        verified: true
      },
      {
        id: 'disaster-info',
        name: '災害用伝言ダイヤル',
        phone: '171',
        type: 'general',
        priority: 2,
        description: '災害時の安否確認',
        isSystem: true,
        verified: true
      }
    ];

    systemContacts.forEach(contact => {
      this.contacts.set(contact.id, contact);
    });
  }

  /**
   * Load event-specific emergency contacts
   */
  async loadEventContacts(eventId) {
    if (!eventId) {
      return;
    }

    try {
      const response = await fetch(`${this.options.apiEndpoint}/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        this.eventContacts = result.data || [];

        // Add event contacts to the main contacts map
        this.eventContacts.forEach(contact => {
          this.contacts.set(contact.id, { ...contact, isEvent: true });
        });

        this.updateQuickAccess();
      }
    } catch (error) {
      console.error('Error loading event contacts:', error);
    }
  }

  /**
   * Setup quick access emergency widget
   */
  setupQuickAccess() {
    if (!this.options.quickAccessEnabled) {
      return;
    }

    // Create quick access widget
    this.quickAccessWidget = document.createElement('div');
    this.quickAccessWidget.className = 'emergency-quick-access';
    this.quickAccessWidget.innerHTML = this.createQuickAccessHTML();

    // Add to page
    document.body.appendChild(this.quickAccessWidget);

    // Setup toggle functionality
    const toggleBtn = this.quickAccessWidget.querySelector('.emergency-toggle');
    const panel = this.quickAccessWidget.querySelector('.emergency-panel');

    toggleBtn.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      panel.classList.toggle('open', !isOpen);
      toggleBtn.classList.toggle('active', !isOpen);
    });

    // Close when clicking outside
    document.addEventListener('click', e => {
      if (!this.quickAccessWidget.contains(e.target)) {
        panel.classList.remove('open');
        toggleBtn.classList.remove('active');
      }
    });
  }

  /**
   * Create quick access HTML
   */
  createQuickAccessHTML() {
    const priorityContacts = Array.from(this.contacts.values())
      .filter(contact => contact.priority <= 2)
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 4);

    return `
      <button class="emergency-toggle" title="緊急連絡先">
        <span class="emergency-icon">🚨</span>
        <span class="emergency-text">緊急</span>
      </button>
      
      <div class="emergency-panel">
        <div class="emergency-header">
          <h3>🚨 緊急連絡先</h3>
          <button class="emergency-all-btn" onclick="emergencySystem.showAllContacts()">
            すべて表示
          </button>
        </div>
        
        <div class="emergency-quick-contacts">
          ${priorityContacts
    .map(
      contact => `
            <div class="emergency-contact-item" data-type="${contact.type}">
              <div class="contact-info">
                <span class="contact-icon">${this.getTypeIcon(contact.type)}</span>
                <div class="contact-details">
                  <div class="contact-name">${contact.name}</div>
                  <div class="contact-description">${contact.description}</div>
                </div>
              </div>
              <button class="contact-call-btn" onclick="emergencySystem.makeCall('${contact.phone}', '${contact.name}')" 
                      title="電話をかける">
                <span class="call-icon">📞</span>
                <span class="phone-number">${contact.phone}</span>
              </button>
            </div>
          `
    )
    .join('')}
        </div>
        
        <div class="emergency-actions">
          <button class="emergency-action-btn" onclick="emergencySystem.shareLocation()">
            📍 位置情報を共有
          </button>
          <button class="emergency-action-btn" onclick="emergencySystem.sendAlert()">
            🚨 緊急アラート送信
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Update quick access widget
   */
  updateQuickAccess() {
    if (!this.quickAccessWidget) {
      return;
    }

    const quickContacts = this.quickAccessWidget.querySelector('.emergency-quick-contacts');
    if (quickContacts) {
      const priorityContacts = Array.from(this.contacts.values())
        .filter(contact => contact.priority <= 2)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 4);

      quickContacts.innerHTML = priorityContacts
        .map(
          contact => `
        <div class="emergency-contact-item" data-type="${contact.type}">
          <div class="contact-info">
            <span class="contact-icon">${this.getTypeIcon(contact.type)}</span>
            <div class="contact-details">
              <div class="contact-name">${contact.name}</div>
              <div class="contact-description">${contact.description}</div>
            </div>
          </div>
          <button class="contact-call-btn" onclick="emergencySystem.makeCall('${contact.phone}', '${contact.name}')" 
                  title="電話をかける">
            <span class="call-icon">📞</span>
            <span class="phone-number">${contact.phone}</span>
          </button>
        </div>
      `
        )
        .join('');
    }
  }

  /**
   * Show all emergency contacts modal
   */
  showAllContacts() {
    const modal = document.createElement('div');
    modal.className = 'emergency-modal-overlay';
    modal.innerHTML = this.createAllContactsModalHTML();

    document.body.appendChild(modal);

    // Close modal functionality
    const closeModal = () => {
      document.body.removeChild(modal);
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        closeModal();
      }
    });

    // ESC key support
    const handleEscape = e => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Create all contacts modal HTML
   */
  createAllContactsModalHTML() {
    const contactsByType = this.groupContactsByType();

    return `
      <div class="modal-overlay">
        <div class="emergency-modal">
          <div class="modal-header">
            <h2>🚨 緊急連絡先一覧</h2>
            <button class="modal-close">✕</button>
          </div>
          
          <div class="modal-content">
            ${Object.entries(contactsByType)
    .map(
      ([type, contacts]) => `
              <div class="contact-type-section">
                <h3>${this.getTypeIcon(type)} ${this.getTypeName(type)}</h3>
                <div class="contact-list">
                  ${contacts
    .map(
      contact => `
                    <div class="contact-item ${contact.isSystem ? 'system' : contact.isEvent ? 'event' : ''}">
                      <div class="contact-main-info">
                        <div class="contact-name-phone">
                          <span class="contact-name">${contact.name}</span>
                          <span class="contact-phone-display">${contact.phone}</span>
                        </div>
                        ${
  contact.description
    ? `
                          <div class="contact-description">${contact.description}</div>
                        `
    : ''
}
                      </div>
                      
                      <div class="contact-actions">
                        <button class="contact-action-btn call" 
                                onclick="emergencySystem.makeCall('${contact.phone}', '${contact.name}')"
                                title="電話をかける">
                          📞 電話
                        </button>
                        ${
  contact.isEvent
    ? `
                          <button class="contact-action-btn edit" 
                                  onclick="emergencySystem.editContact('${contact.id}')"
                                  title="編集">
                            ✏️ 編集
                          </button>
                        `
    : ''
}
                      </div>
                      
                      <div class="contact-meta">
                        ${contact.verified ? '<span class="verified-badge">✅ 確認済み</span>' : ''}
                        ${contact.isSystem ? '<span class="system-badge">システム</span>' : ''}
                        ${contact.isEvent ? '<span class="event-badge">イベント</span>' : ''}
                      </div>
                    </div>
                  `
    )
    .join('')}
                </div>
              </div>
            `
    )
    .join('')}
          </div>
          
          <div class="modal-footer">
            <button class="modal-action-btn" onclick="emergencySystem.addContact()">
              ➕ 緊急連絡先を追加
            </button>
            <button class="modal-action-btn secondary" onclick="emergencySystem.exportContacts()">
              📤 連絡先をエクスポート
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Group contacts by type
   */
  groupContactsByType() {
    const grouped = {};

    for (const contact of this.contacts.values()) {
      if (!grouped[contact.type]) {
        grouped[contact.type] = [];
      }
      grouped[contact.type].push(contact);
    }

    // Sort each group by priority
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => a.priority - b.priority);
    });

    return grouped;
  }

  /**
   * Make emergency call
   */
  makeCall(phoneNumber, contactName) {
    // Log the emergency call attempt
    this.logEmergencyAction('call', { phone: phoneNumber, contact: contactName });

    // Show confirmation dialog
    const confirmed = confirm(
      `${contactName} (${phoneNumber}) に電話をかけますか？\n\n緊急時以外の使用は控えてください。`
    );

    if (confirmed) {
      // Open phone dialer
      window.location.href = `tel:${phoneNumber}`;

      // Show call confirmation
      this.showCallConfirmation(contactName, phoneNumber);
    }
  }

  /**
   * Show call confirmation
   */
  showCallConfirmation(contactName, phoneNumber) {
    const notification = document.createElement('div');
    notification.className = 'emergency-call-notification';
    notification.innerHTML = `
      <div class="call-notification-content">
        <div class="call-icon">📞</div>
        <div class="call-info">
          <div class="call-contact">${contactName}</div>
          <div class="call-number">${phoneNumber}</div>
          <div class="call-status">電話をかけています...</div>
        </div>
        <button class="call-close" onclick="this.parentElement.parentElement.remove()">✕</button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Share current location
   */
  async shareLocation() {
    try {
      const position = await this.getCurrentPosition();
      const locationText = `緊急時位置情報: https://maps.google.com/?q=${position.lat},${position.lng}`;

      if (navigator.share) {
        await navigator.share({
          title: '緊急時位置情報',
          text: locationText
        });
      } else {
        await navigator.clipboard.writeText(locationText);
        this.showSuccess('位置情報をクリップボードにコピーしました');
      }

      this.logEmergencyAction('location_share', { lat: position.lat, lng: position.lng });
    } catch (error) {
      console.error('Error sharing location:', error);
      this.showError('位置情報の共有に失敗しました');
    }
  }

  /**
   * Send emergency alert
   */
  async sendAlert() {
    const alertType = await this.selectAlertType();
    if (!alertType) {
      return;
    }

    try {
      const position = await this.getCurrentPosition();

      const alertData = {
        type: alertType,
        timestamp: new Date().toISOString(),
        location: position,
        userAgent: navigator.userAgent,
        eventId: this.getCurrentEventId()
      };

      const response = await fetch(`${this.options.apiEndpoint}/alert`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alertData)
      });

      if (response.ok) {
        this.showSuccess('緊急アラートを送信しました');
        this.logEmergencyAction('alert_sent', alertData);
      } else {
        throw new Error('Alert sending failed');
      }
    } catch (error) {
      console.error('Error sending alert:', error);
      this.showError('緊急アラートの送信に失敗しました');
    }
  }

  /**
   * Select alert type dialog
   */
  async selectAlertType() {
    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.className = 'alert-type-modal';
      modal.innerHTML = `
        <div class="alert-type-content">
          <h3>緊急事態の種類を選択してください</h3>
          <div class="alert-types">
            ${this.options.emergencyTypes
    .map(
      type => `
              <button class="alert-type-btn" data-type="${type.id}">
                <span class="alert-type-icon">${type.icon}</span>
                <span class="alert-type-name">${type.name}</span>
              </button>
            `
    )
    .join('')}
          </div>
          <button class="alert-cancel-btn">キャンセル</button>
        </div>
      `;

      document.body.appendChild(modal);

      modal.addEventListener('click', e => {
        if (e.target.matches('.alert-type-btn')) {
          const { type } = e.target.dataset;
          document.body.removeChild(modal);
          resolve(type);
        } else if (e.target.matches('.alert-cancel-btn')) {
          document.body.removeChild(modal);
          resolve(null);
        }
      });
    });
  }

  /**
   * Get current position
   */
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        error => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Get type icon
   */
  getTypeIcon(type) {
    const typeConfig = this.options.emergencyTypes.find(t => t.id === type);
    return typeConfig ? typeConfig.icon : '🚨';
  }

  /**
   * Get type name
   */
  getTypeName(type) {
    const typeConfig = this.options.emergencyTypes.find(t => t.id === type);
    return typeConfig ? typeConfig.name : '緊急事態';
  }

  /**
   * Log emergency action
   */
  logEmergencyAction(action, data) {
    const logEntry = {
      action,
      data,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      eventId: this.getCurrentEventId()
    };

    // Send to server for logging
    fetch('/api/emergency-contacts/log', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(logEntry)
    }).catch(error => {
      console.error('Error logging emergency action:', error);
    });

    // Store locally as backup
    const logs = JSON.parse(localStorage.getItem('emergencyLogs') || '[]');
    logs.push(logEntry);
    logs.splice(-50); // Keep only last 50 logs
    localStorage.setItem('emergencyLogs', JSON.stringify(logs));
  }

  /**
   * Setup event listeners
   */
  attachEventListeners() {
    // Keyboard shortcuts for quick access
    document.addEventListener('keydown', e => {
      // Ctrl/Cmd + Shift + E for emergency
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        this.showAllContacts();
      }
    });

    // Listen for visibility changes to update contacts
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isInitialized) {
        this.refreshContacts();
      }
    });
  }

  /**
   * Refresh contacts from server
   */
  async refreshContacts() {
    const eventId = this.getCurrentEventId();
    if (eventId) {
      await this.loadEventContacts(eventId);
    }
  }

  /**
   * Get current event ID
   */
  getCurrentEventId() {
    // Try to get from various sources
    const params = new URLSearchParams(window.location.search);
    return (
      params.get('eventId') ||
      document.querySelector('meta[name="event-id"]')?.content ||
      localStorage.getItem('currentEventId') ||
      null
    );
  }

  /**
   * Get auth token
   */
  getAuthToken() {
    return localStorage.getItem('authToken') || null;
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showNotification(message, 'error');
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `emergency-notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(
      () => {
        if (notification.parentNode) {
          notification.remove();
        }
      },
      type === 'error' ? 5000 : 3000
    );
  }

  /**
   * Destroy the emergency contact system
   */
  destroy() {
    if (this.quickAccessWidget) {
      this.quickAccessWidget.remove();
      this.quickAccessWidget = null;
    }

    this.contacts.clear();
    this.eventContacts = [];
    this.isInitialized = false;
  }
}

// Global instance
let emergencySystem = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  emergencySystem = new EmergencyContactSystem();

  // Make globally accessible
  window.emergencySystem = emergencySystem;
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmergencyContactSystem;
}
