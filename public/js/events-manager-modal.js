/**
 * Events Manager Modal Integration
 * イベント一覧とモーダル詳細表示の統合
 */

// Extend the existing EventsManager with modal functionality
if (typeof EventsManager !== 'undefined') {
  const originalInit = EventsManager.prototype.init;
  const originalRenderEventCard = EventsManager.prototype.renderEventCard;

  // Override init to add modal integration
  EventsManager.prototype.init = async function() {
    await originalInit.call(this);
    this.initModalIntegration();
  };

  // Add modal integration method
  EventsManager.prototype.initModalIntegration = function() {
    // Ensure modal is available
    if (!window.eventModal) {
      console.warn('EventModal not initialized');
      return;
    }

    // Add click handler delegation for event cards
    document.addEventListener('click', (e) => {
      const eventCard = e.target.closest('.event-card[data-event-id]');
      if (eventCard && !e.target.closest('.btn, button')) {
        e.preventDefault();
        const eventId = eventCard.dataset.eventId;
        this.openEventModal(eventId);
      }
    });

    // Add keyboard handler for event cards
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const eventCard = e.target.closest('.event-card[data-event-id]');
        if (eventCard && !e.target.closest('.btn, button')) {
          e.preventDefault();
          const eventId = eventCard.dataset.eventId;
          this.openEventModal(eventId);
        }
      }
    });
  };

  // Add method to open event modal
  EventsManager.prototype.openEventModal = function(eventId) {
    const event = this.events.find(e => e.id === eventId);
    if (event && window.eventModal) {
      // Prepare event data for modal
      const modalData = {
        ...event,
        participants: {
          total: event.registeredCount || 0,
          online: event.onlineParticipants || Math.floor((event.registeredCount || 0) * 0.6),
          onsite: event.onsiteParticipants || Math.floor((event.registeredCount || 0) * 0.4)
        },
        schedule: event.schedule || this.generateDefaultSchedule(event),
        notes: event.notes || this.getDefaultNotes(event.format),
        contact: event.contact || '<a href="mailto:info@lightningtalk.example.com">info@lightningtalk.example.com</a>'
      };

      window.eventModal.open(modalData);
    }
  };

  // Override renderEventCard to add modal attributes
  EventsManager.prototype.renderEventCard = function(event) {
    const card = originalRenderEventCard.call(this, event);
    
    // Add data attributes and accessibility
    const cardElement = document.createElement('div');
    cardElement.innerHTML = card;
    const eventCard = cardElement.firstElementChild;
    
    if (eventCard) {
      eventCard.setAttribute('data-event-id', event.id);
      eventCard.setAttribute('tabindex', '0');
      eventCard.setAttribute('role', 'button');
      eventCard.setAttribute('aria-label', `${event.title}の詳細を表示`);
      eventCard.style.cursor = 'pointer';
      
      // Add hover effect class
      eventCard.classList.add('event-card-interactive');
    }
    
    return cardElement.innerHTML;
  };

  // Helper methods
  EventsManager.prototype.generateDefaultSchedule = function(event) {
    const startTime = new Date(event.date);
    const schedule = [
      {
        time: this.formatTime(startTime),
        content: '開場・受付開始'
      },
      {
        time: this.formatTime(new Date(startTime.getTime() + 30 * 60000)),
        content: '開会の挨拶・趣旨説明'
      },
      {
        time: this.formatTime(new Date(startTime.getTime() + 45 * 60000)),
        content: 'ライトニングトーク（前半）'
      },
      {
        time: this.formatTime(new Date(startTime.getTime() + 90 * 60000)),
        content: '休憩・交流タイム'
      },
      {
        time: this.formatTime(new Date(startTime.getTime() + 105 * 60000)),
        content: 'ライトニングトーク（後半）'
      },
      {
        time: this.formatTime(new Date(startTime.getTime() + 150 * 60000)),
        content: '懇親会・ネットワーキング'
      }
    ];
    
    return schedule;
  };

  EventsManager.prototype.getDefaultNotes = function(format) {
    const notes = {
      hybrid: `
        <ul>
          <li>現地参加の方は開始15分前までにお越しください</li>
          <li>オンライン参加の方は開始5分前にGoogle Meetリンクからご参加ください</li>
          <li>飛び入り発表も歓迎します（持ち時間5分）</li>
          <li>録画・撮影は発表者の許可を得てから行ってください</li>
        </ul>
      `,
      online: `
        <ul>
          <li>開始5分前にGoogle Meetリンクからご参加ください</li>
          <li>マイクは発表時以外はミュートでお願いします</li>
          <li>質問はチャットで随時受け付けます</li>
          <li>録画は発表者の許可を得てから行ってください</li>
        </ul>
      `,
      onsite: `
        <ul>
          <li>開始15分前までに会場にお越しください</li>
          <li>飛び入り発表も歓迎します（持ち時間5分）</li>
          <li>会場内での飲食は可能です</li>
          <li>撮影は発表者の許可を得てから行ってください</li>
        </ul>
      `
    };
    
    return notes[format] || notes.hybrid;
  };

  EventsManager.prototype.formatTime = function(date) {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
}

// Add CSS for interactive event cards
if (!document.getElementById('event-card-interactive-styles')) {
  const style = document.createElement('style');
  style.id = 'event-card-interactive-styles';
  style.textContent = `
    .event-card-interactive {
      transition: all 0.3s ease;
    }
    
    .event-card-interactive:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }
    
    .event-card-interactive:focus {
      outline: 2px solid var(--color-primary, #22c55e);
      outline-offset: 2px;
    }
    
    .event-card-interactive:active {
      transform: translateY(-2px);
    }
    
    /* Indicate clickable state */
    .event-card-interactive::after {
      content: '詳細を見る →';
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      font-size: 0.875rem;
      color: var(--color-primary, #22c55e);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .event-card-interactive:hover::after {
      opacity: 1;
    }
    
    @media (max-width: 767px) {
      .event-card-interactive::after {
        display: none;
      }
    }
  `;
  document.head.appendChild(style);
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Re-initialize events manager if it exists
  if (window.eventsManager) {
    window.eventsManager.initModalIntegration();
  }
});