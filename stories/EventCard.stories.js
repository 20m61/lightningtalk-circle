/**
 * Event Card component stories for Lightning Talk events
 */

export default {
  title: 'Lightning Talk/Event Card',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Event card displaying event information, venue details, and registration options'
      }
    }
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Event title'
    },
    date: {
      control: 'text',
      description: 'Event date and time'
    },
    venue: {
      control: 'text',
      description: 'Venue name'
    },
    venueDetails: {
      control: 'text',
      description: 'Venue details'
    },
    onlineUrl: {
      control: 'text',
      description: 'Online meeting URL'
    },
    onlineTime: {
      control: 'text',
      description: 'Online participation time'
    },
    onRegister: { action: 'register-clicked' },
    onSurveyOnline: { action: 'survey-online-clicked' },
    onSurveyOffline: { action: 'survey-offline-clicked' }
  }
};

const Template = ({ 
  title, 
  date, 
  venue, 
  venueDetails, 
  onlineUrl, 
  onlineTime,
  onRegister,
  onSurveyOnline,
  onSurveyOffline 
}) => {
  const eventCard = document.createElement('div');
  eventCard.className = 'event-card fade-in visible';
  eventCard.style.maxWidth = '800px';
  
  eventCard.innerHTML = `
    <div class="date-highlight">
      📅 ${date}
    </div>
    <h3>${title}</h3>
    
    <div class="venue-status">
      <h4>📍 会場について</h4>
      <p><strong>${venue}</strong></p>
      <p>${venueDetails}</p>
      <p>当日参加・飛び入り発表も大歓迎です！🎤</p>
    </div>

    <div class="online-info">
      <h4>💻 オンライン参加も可能！</h4>
      <p><strong>時間:</strong> ${onlineTime}</p>
      <p><strong>Google Meet:</strong> <a href="${onlineUrl}" target="_blank">参加リンク</a></p>
    </div>

    <div class="action-buttons">
      <button class="btn register-btn">
        📝 当日参加申込み
      </button>
      <div class="survey-section">
        <h4>💭 当日参加アンケート</h4>
        <div class="survey-buttons">
          <button class="btn survey-btn online-btn">
            💻 オンライン参加 <span class="count">0</span>
          </button>
          <button class="btn survey-btn offline-btn">
            🏢 現地参加 <span class="count">0</span>
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Add event listeners
  eventCard.querySelector('.register-btn').addEventListener('click', onRegister);
  eventCard.querySelector('.online-btn').addEventListener('click', onSurveyOnline);
  eventCard.querySelector('.offline-btn').addEventListener('click', onSurveyOffline);
  
  return eventCard;
};

export const Default = Template.bind({});
Default.args = {
  title: '開催情報',
  date: '2025年6月25日（水） 19:00〜',
  venue: '新宿某所',
  venueDetails: '6月20日に詳細確定予定',
  onlineUrl: 'https://meet.google.com/ycp-sdec-xsr',
  onlineTime: '18:30〜22:00 (JST)'
};

export const WithSpecificVenue = Template.bind({});
WithSpecificVenue.args = {
  title: '開催情報',
  date: '2025年6月25日（水） 19:00〜',
  venue: '東京都新宿区西新宿 コワーキングスペース Lightning',
  venueDetails: '新宿駅西口より徒歩5分、地下鉄新宿駅A3出口より徒歩3分',
  onlineUrl: 'https://meet.google.com/ycp-sdec-xsr',
  onlineTime: '18:30〜22:00 (JST)'
};

export const OnlineOnly = Template.bind({});
OnlineOnly.args = {
  title: '開催情報',
  date: '2025年7月10日（木） 20:00〜',
  venue: 'オンライン開催',
  venueDetails: '今回はオンライン限定での開催となります',
  onlineUrl: 'https://meet.google.com/abc-defg-hij',
  onlineTime: '19:30〜22:30 (JST)'
};

export const SecondEvent = Template.bind({});
SecondEvent.args = {
  title: '開催情報',
  date: '2025年8月15日（金） 19:30〜',
  venue: '渋谷区某所',
  venueDetails: '8月10日に詳細確定予定（定員：60名）',
  onlineUrl: 'https://meet.google.com/xyz-uvwx-abc',
  onlineTime: '19:00〜23:00 (JST)'
};

// Event card styles
const eventCardCSS = `
  .event-card {
    background: #fff;
    border-radius: 20px;
    padding: 40px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    border: 4px solid #FFD700;
    margin-bottom: 30px;
    transition: all 0.6s ease;
  }

  .event-card h3 {
    color: #333;
    margin-bottom: 20px;
    font-size: 1.5rem;
  }

  .date-highlight {
    background: linear-gradient(45deg, #FF6B6B, #FFD93D);
    color: #fff;
    padding: 15px 30px;
    border-radius: 50px;
    display: inline-block;
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 20px;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }

  .venue-status {
    background: #e8f4fd;
    border: 2px dashed #4169E1;
    padding: 20px;
    border-radius: 15px;
    margin: 20px 0;
    text-align: center;
  }

  .venue-status h4,
  .online-info h4 {
    color: #333;
    margin-bottom: 10px;
    font-size: 1.1rem;
  }

  .venue-status p,
  .online-info p {
    margin-bottom: 8px;
    color: #555;
    line-height: 1.6;
  }

  .online-info {
    background: #e8f4fd;
    padding: 20px;
    border-radius: 15px;
    margin: 20px 0;
  }

  .online-info a {
    color: #4169E1;
    text-decoration: none;
    font-weight: bold;
  }

  .online-info a:hover {
    text-decoration: underline;
  }

  .action-buttons {
    text-align: center;
    margin-top: 30px;
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .survey-section {
    margin-top: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    text-align: center;
    flex: 1;
    min-width: 300px;
  }

  .survey-section h4 {
    margin-bottom: 15px;
    color: #333;
    font-size: 1rem;
  }

  .survey-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .survey-btn {
    position: relative;
    min-width: 160px;
    transition: all 0.3s ease;
  }

  .survey-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .count {
    display: inline-block;
    background: rgba(255,255,255,0.3);
    padding: 2px 8px;
    border-radius: 12px;
    margin-left: 8px;
    font-weight: bold;
    min-width: 20px;
  }

  .btn {
    display: inline-block;
    padding: 15px 30px;
    background: linear-gradient(45deg, #FF6B6B, #FFD93D);
    color: #fff;
    text-decoration: none;
    border-radius: 50px;
    font-weight: bold;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
    font-size: 1.1rem;
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  }

  .btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.3);
  }

  @media (max-width: 768px) {
    .event-card {
      padding: 20px;
    }
    
    .action-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .survey-buttons {
      flex-direction: column;
      align-items: center;
    }
    
    .survey-btn {
      width: 100%;
      max-width: 250px;
    }
    
    .survey-section {
      min-width: auto;
      width: 100%;
    }
  }
`;

// Inject event card styles
if (!document.getElementById('lightning-talk-event-card-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'lightning-talk-event-card-styles';
  styleSheet.textContent = eventCardCSS;
  document.head.appendChild(styleSheet);
}