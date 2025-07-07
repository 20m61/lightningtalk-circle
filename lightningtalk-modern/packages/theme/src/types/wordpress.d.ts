/**
 * WordPress Integration Type Definitions
 */

// WordPress Global Objects
declare global {
  interface Window {
    wp?: {
      hooks?: {
        addAction: (hookName: string, namespace: string, callback: (data: any) => void) => void;
        addFilter: (hookName: string, namespace: string, callback: (data: any) => any) => void;
        doAction: (hookName: string, ...args: any[]) => void;
        applyFilters: (hookName: string, value: any, ...args: any[]) => any;
      };
      blocks?: {
        registerBlockType: (name: string, settings: any) => void;
      };
      element?: {
        createElement: (type: string, props?: any, ...children: any[]) => any;
      };
      customize?: {
        preview?: {
          bind: (event: string, callback: (data: any) => void) => void;
        };
      };
    };

    wpLightningTalk?: {
      apiUrl: string;
      nonce: string;
      currentUser: {
        ID: number;
        display_name: string;
        user_email: string;
        user_login: string;
      };
      ajaxUrl: string;
      siteUrl: string;
      themeUrl: string;
      settings?: {
        defaultEventId?: string;
        enableNotifications?: boolean;
        [key: string]: any;
      };
    };

    jQuery?: any;
  }
}

// WordPress API Types
export interface WordPressEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  venue: {
    name: string;
    address?: string;
    onlineUrl?: string;
  };
  maxParticipants?: number;
  maxTalks?: number;
  status: 'draft' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface WordPressParticipant {
  id: string;
  name: string;
  email: string;
  eventId: string;
  participationType: 'onsite' | 'online' | 'undecided';
  registeredAt: string;
}

export interface WordPressTalk {
  id: string;
  title: string;
  description: string;
  speakerName: string;
  eventId: string;
  category: string;
  duration: number;
  submittedAt: string;
}

// Block Editor Types
export interface BlockAttributes {
  [key: string]: {
    type: string;
    default?: any;
  };
}

export interface BlockProps {
  attributes: { [key: string]: any };
  setAttributes: (attrs: { [key: string]: any }) => void;
  className?: string;
}

// Customizer Types
export interface CustomizerSettings {
  colorScheme?: 'light' | 'dark' | 'auto';
  typography?: {
    primaryFont: string;
    baseSize: number;
  };
  layout?: {
    containerWidth: number;
    enableSidebar: boolean;
  };
  [key: string]: any;
}
