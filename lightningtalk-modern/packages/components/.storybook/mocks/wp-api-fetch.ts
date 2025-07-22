/**
 * WordPress API Fetch Mock for Storybook
 */

// Mock data - wordpress-globalsから分離

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface RequestOptions {
  path?: string;
  url?: string;
  method?: string;
  data?: any;
  body?: string;
  headers?: Record<string, string>;
}

// Mock API データベース
const mockEvents = [
  {
    id: 1,
    title: 'Lightning Talk Circle #42',
    description: '技術から趣味まで、様々なテーマのライトニングトークイベント',
    date: '2025-08-15T19:00:00',
    location: 'オンライン（Zoom）',
    maxParticipants: 20,
    participantCount: 12,
    status: 'published'
  }
];

const mockTalks = [
  {
    id: 1,
    eventId: 1,
    title: '5分で理解するReactフック',
    description: 'React Hooksの基本的な使い方を分かりやすく解説',
    speaker: '田中 雷太',
    duration: 5,
    status: 'approved'
  }
];

const mockParticipants = [
  {
    id: 1,
    eventId: 1,
    name: 'テスト参加者',
    email: 'test@example.com',
    registrationDate: '2025-08-01T10:00:00',
    attendance: 'registered'
  }
];

const mockDatabase = {
  events: [...mockEvents],
  talks: [...mockTalks],
  participants: [...mockParticipants],
};

// Mock API Fetch関数
const mockApiFetch = async (options: RequestOptions | string): Promise<any> => {
  // 文字列の場合はパスとして扱う
  if (typeof options === 'string') {
    options = { path: options };
  }
  
  const { path = '', method = 'GET', data } = options;
  
  console.log(`[Mock API] ${method} ${path}`, data ? { data } : '');
  
  // 遅延シミュレーション
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    return handleApiRequest(path, method, data);
  } catch (error) {
    console.error('[Mock API Error]', error);
    throw new Error(`API Error: ${error}`);
  }
};

function handleApiRequest(path: string, method: string, data?: any): any {
  // Lightning Talk Events API
  if (path.includes('/lightningtalk/v1/events')) {
    return handleEventsApi(path, method, data);
  }
  
  // Lightning Talk Talks API
  if (path.includes('/lightningtalk/v1/talks')) {
    return handleTalksApi(path, method, data);
  }
  
  // Lightning Talk Participants API
  if (path.includes('/lightningtalk/v1/participants') || path.includes('/lightningtalk/v1/register')) {
    return handleParticipantsApi(path, method, data);
  }
  
  // WordPress Core API
  if (path.includes('/wp/v2/')) {
    return handleWordPressCoreApi(path, method, data);
  }
  
  // デフォルトレスポンス
  return { success: true, data: null };
}

function handleEventsApi(path: string, method: string, data?: any): any {
  const eventIdMatch = path.match(/\/events\/(\d+)/);
  const eventId = eventIdMatch ? parseInt(eventIdMatch[1]) : null;
  
  switch (method) {
    case 'GET':
      if (eventId) {
        const event = mockDatabase.events.find(e => e.id === eventId);
        return event || { error: 'Event not found' };
      }
      return mockDatabase.events;
      
    case 'POST':
      const newEvent = {
        id: Math.max(...mockDatabase.events.map(e => e.id)) + 1,
        ...data,
        participantCount: 0,
        status: 'draft',
      };
      mockDatabase.events.push(newEvent);
      return newEvent;
      
    case 'PUT':
      if (eventId) {
        const index = mockDatabase.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
          mockDatabase.events[index] = { ...mockDatabase.events[index], ...data };
          return mockDatabase.events[index];
        }
      }
      throw new Error('Event not found');
      
    case 'DELETE':
      if (eventId) {
        const index = mockDatabase.events.findIndex(e => e.id === eventId);
        if (index !== -1) {
          mockDatabase.events.splice(index, 1);
          return { success: true };
        }
      }
      throw new Error('Event not found');
      
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

function handleTalksApi(path: string, method: string, data?: any): any {
  const talkIdMatch = path.match(/\/talks\/(\d+)/);
  const talkId = talkIdMatch ? parseInt(talkIdMatch[1]) : null;
  
  switch (method) {
    case 'GET':
      if (talkId) {
        const talk = mockDatabase.talks.find(t => t.id === talkId);
        return talk || { error: 'Talk not found' };
      }
      
      // イベントIDでフィルタ
      const eventIdParam = new URLSearchParams(path.split('?')[1]).get('event_id');
      if (eventIdParam) {
        return mockDatabase.talks.filter(t => t.eventId === parseInt(eventIdParam));
      }
      
      return mockDatabase.talks;
      
    case 'POST':
      const newTalk = {
        id: Math.max(...mockDatabase.talks.map(t => t.id)) + 1,
        ...data,
        status: 'pending',
      };
      mockDatabase.talks.push(newTalk);
      return newTalk;
      
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

function handleParticipantsApi(path: string, method: string, data?: any): any {
  if (path.includes('/register')) {
    // 参加登録
    const newParticipant = {
      id: Math.max(...mockDatabase.participants.map(p => p.id)) + 1,
      ...data,
      registrationDate: new Date().toISOString(),
      attendance: 'registered',
    };
    mockDatabase.participants.push(newParticipant);
    
    // イベントの参加者数を更新
    const event = mockDatabase.events.find(e => e.id === data.eventId);
    if (event) {
      event.participantCount++;
    }
    
    return {
      success: true,
      participantId: newParticipant.id,
      message: '参加登録が完了しました！',
    };
  }
  
  // 参加者一覧・詳細
  const participantIdMatch = path.match(/\/participants\/(\d+)/);
  const participantId = participantIdMatch ? parseInt(participantIdMatch[1]) : null;
  
  switch (method) {
    case 'GET':
      if (participantId) {
        const participant = mockDatabase.participants.find(p => p.id === participantId);
        return participant || { error: 'Participant not found' };
      }
      
      // イベントIDでフィルタ
      const eventIdParam = new URLSearchParams(path.split('?')[1]).get('event_id');
      if (eventIdParam) {
        return mockDatabase.participants.filter(p => p.eventId === parseInt(eventIdParam));
      }
      
      return mockDatabase.participants;
      
    default:
      throw new Error(`Unsupported method: ${method}`);
  }
}

function handleWordPressCoreApi(path: string, method: string, data?: any): any {
  // WordPress標準API のMock
  if (path.includes('/users/me')) {
    return {
      id: 1,
      name: 'Storybook User',
      email: 'storybook@lightningtalk.local',
      roles: ['administrator'],
    };
  }
  
  return { success: true, data: [] };
}

// WordPress API Fetch のメイン関数をエクスポート
export default mockApiFetch;