/**
 * WordPress グローバル変数とAPI のMock
 */

export const createWordPressMocks = () => ({
  // WordPress APIエンドポイント
  wp: {
    api: {
      url: 'http://localhost:6006/mock-api',
      nonce: 'mock-nonce-12345',
    },
    data: {
      currentUser: {
        id: 1,
        name: 'Storybook User',
        email: 'storybook@lightningtalk.local',
        roles: ['administrator'],
        capabilities: {
          manage_options: true,
          edit_posts: true,
          publish_posts: true,
        },
      },
      siteInfo: {
        name: 'Lightning Talk Storybook',
        description: 'Component development environment',
        url: 'http://localhost:6006',
        admin_email: 'admin@lightningtalk.local',
      },
    },
    element: {
      createElement: (type: any, props: any, ...children: any[]) => {
        // React.createElement のエイリアス
        return { type, props: { ...props, children } };
      },
      Fragment: 'Fragment',
    },
  },
  
  // WordPress AJAX
  ajaxurl: '/mock-ajax',
  
  // WordPress翻訳関数
  __: (text: string, domain?: string) => text,
  _n: (single: string, plural: string, number: number, domain?: string) => 
    number === 1 ? single : plural,
  _x: (text: string, context: string, domain?: string) => text,
  _nx: (single: string, plural: string, number: number, context: string, domain?: string) =>
    number === 1 ? single : plural,
  
  // WordPress ノンス
  wpNonces: {
    lightningtalk: 'mock-nonce-12345',
    wp_rest: 'mock-rest-nonce',
  },
  
  // WordPress 設定
  wpLightningTalk: {
    apiUrl: 'http://localhost:6006/mock-api/',
    nonce: 'mock-nonce-12345',
    currentUser: {
      id: 1,
      name: 'Storybook User',
      roles: ['administrator'],
    },
    ajaxUrl: '/mock-ajax',
    siteUrl: 'http://localhost:6006',
    themeUrl: '/mock-theme',
    settings: {
      defaultEventId: '1',
      timeFormat: 'H:i',
      dateFormat: 'Y-m-d',
      timezone: 'Asia/Tokyo',
    },
  },
  
  // jQuery Mock
  jQuery: {
    ready: (callback: () => void) => callback(),
    ajax: (options: any) => {
      console.log('[Mock AJAX]', options);
      return Promise.resolve({ success: true, data: {} });
    },
    post: (url: string, data: any) => {
      console.log('[Mock POST]', url, data);
      return Promise.resolve({ success: true });
    },
    get: (url: string) => {
      console.log('[Mock GET]', url);
      return Promise.resolve({ success: true, data: {} });
    },
  },
  
  // コンソール用
  console: {
    ...console,
    group: (label: string) => console.log(`📦 ${label}`),
    groupEnd: () => {},
  },
});

// Mock Lightning Talk API データ
export const mockEvents = [
  {
    id: 1,
    title: 'Lightning Talk Night #1',
    description: 'Monthly Lightning Talk event for developers and creators',
    date: '2025-07-15T19:00:00Z',
    venue: 'Tech Hub Tokyo',
    venueAddress: '東京都渋谷区神宮前1-1-1',
    capacity: 50,
    participantCount: 23,
    status: 'open',
    online: false,
    onlineUrl: '',
    organizer: 'Lightning Talk Team',
    tags: ['tech', 'presentation', 'networking'],
  },
  {
    id: 2,
    title: 'Online Lightning Talk Session',
    description: 'Remote-friendly Lightning Talk session',
    date: '2025-07-22T20:00:00Z',
    venue: 'Online',
    venueAddress: '',
    capacity: 100,
    participantCount: 67,
    status: 'open',
    online: true,
    onlineUrl: 'https://meet.google.com/abc-defg-hij',
    organizer: 'Remote Team',
    tags: ['online', 'remote', 'global'],
  },
];

export const mockTalks = [
  {
    id: 1,
    eventId: 1,
    title: 'Building Modern WordPress Themes',
    description: 'How to integrate modern build tools with WordPress development',
    speaker: 'John Developer',
    speakerBio: 'Full-stack developer with 5+ years experience',
    duration: 5,
    category: 'Web Development',
    slides: 'https://slides.com/example',
    demo: 'https://demo.example.com',
    status: 'approved',
  },
  {
    id: 2,
    eventId: 1,
    title: 'TypeScript Tips & Tricks',
    description: 'Advanced TypeScript patterns for better code quality',
    speaker: 'Jane TypeScript',
    speakerBio: 'TypeScript advocate and conference speaker',
    duration: 5,
    category: 'Programming',
    slides: '',
    demo: '',
    status: 'pending',
  },
];

export const mockParticipants = [
  {
    id: 1,
    eventId: 1,
    name: 'Alice Developer',
    email: 'alice@example.com',
    participationType: 'in-person',
    registrationDate: '2025-06-15T10:30:00Z',
    talkTitle: 'React Performance Optimization',
    talkDescription: 'Tips for faster React applications',
    category: 'Frontend',
    newsletter: true,
    attendance: 'registered',
  },
  {
    id: 2,
    eventId: 1,
    name: 'Bob Designer',
    email: 'bob@example.com',
    participationType: 'listener',
    registrationDate: '2025-06-16T14:20:00Z',
    talkTitle: '',
    talkDescription: '',
    category: '',
    newsletter: false,
    attendance: 'registered',
  },
];