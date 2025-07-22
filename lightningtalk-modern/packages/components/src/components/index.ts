/**
 * Lightning Talk Circle - Component Library
 * 統合デザインシステムコンポーネントライブラリ
 */

// Atomic Components (Atoms) - 統合デザイントークンシステム対応
export * from './atoms';

// Legacy Components - 段階的に統合デザインシステムに移行予定
export { Card, CardHeader, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps } from './Card';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Modal, ConfirmModal } from './Modal';
export type { ModalProps, ConfirmModalProps } from './Modal';

// Feedback Components
export { Toast, ToastContainer, useToast } from './Toast';
export type { ToastProps, ToastContainerProps, UseToastReturn } from './Toast';

// Navigation Components
export { Header } from './Header';
export type { HeaderProps } from './Header';

// Layout Components
// TODO: Fix Hero component CSS module issues
// export { Hero } from './Hero';
// export type { HeroProps } from './Hero';

// Lightning Talk Specific Components
export { EventCard } from './EventCard';
export type { EventCardProps } from './EventCard';

// TODO: Implement ParticipantList component
// export { ParticipantList } from './ParticipantList';
// export type { ParticipantListProps, Participant } from './ParticipantList';

// Interactive Components
// TODO: Fix Poll component CSS module issues
// export { Poll } from './Poll';
// export type { PollOptions, PollOption } from './Poll';

// Design Tokens
export { lightningTalkTokens } from '../tokens/unified-tokens';
export type { 
  ColorPalette,
  LightningColors,
  SemanticColors,
  Typography,
  Spacing,
  Animations,
  Breakpoints
} from '../tokens/unified-tokens';

// CSS Generators
export {
  generateFullCSS,
  generateStorybookThemeCSS,
  generateWordPressCSS
} from '../tokens/css-generator';
