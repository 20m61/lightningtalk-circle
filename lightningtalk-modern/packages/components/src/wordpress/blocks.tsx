/**
 * WordPress Gutenberg Blocks - Lightning Talk Circle
 * 統合デザイントークンシステム対応のWordPress専用ブロック
 */

import React from 'react';
import { Button, ButtonProps } from '../components/atoms/Button/Button';
import { withWordPressBlock, WordPressBlockProps } from './integration';

/**
 * Lightning Talk Button Block
 * WordPressブロックエディター用のボタンブロック
 */
interface LightningButtonBlockProps extends WordPressBlockProps {
  /** ボタンのテキスト */
  text?: string;
  
  /** ボタンのバリエーション */
  variant?: ButtonProps['variant'];
  
  /** ボタンのサイズ */
  size?: ButtonProps['size'];
  
  /** Lightning効果を有効にするか */
  lightningEffect?: boolean;
  
  /** リンクURL */
  url?: string;
  
  /** 新しいタブで開くか */
  opensInNewTab?: boolean;
  
  /** アライメント */
  align?: 'left' | 'center' | 'right';
}

const LightningButtonBlock: React.FC<LightningButtonBlockProps> = ({
  text = 'Lightning Talk開始',
  variant = 'primary',
  size = 'md',
  lightningEffect = false,
  url,
  opensInNewTab = false,
  align = 'left',
  className,
  isSelected
}) => {
  const buttonElement = (
    <Button
      variant={variant}
      size={size}
      lightningEffect={lightningEffect}
      className={className}
    >
      {text}
    </Button>
  );

  const wrapperStyle: React.CSSProperties = {
    textAlign: align,
    padding: isSelected ? '10px' : '0',
    border: isSelected ? '1px dashed var(--color-primary-300)' : 'none',
    borderRadius: isSelected ? 'var(--border-radius-md)' : '0'
  };

  if (url) {
    return (
      <div style={wrapperStyle}>
        <a 
          href={url} 
          target={opensInNewTab ? '_blank' : '_self'}
          rel={opensInNewTab ? 'noopener noreferrer' : undefined}
          style={{ textDecoration: 'none' }}
        >
          {buttonElement}
        </a>
      </div>
    );
  }

  return <div style={wrapperStyle}>{buttonElement}</div>;
};

/**
 * Lightning Talk Event Card Block
 * イベント情報表示用のブロック
 */
interface LightningEventBlockProps extends WordPressBlockProps {
  /** イベント名 */
  eventTitle?: string;
  
  /** イベント説明 */
  eventDescription?: string;
  
  /** イベント日時 */
  eventDate?: string;
  
  /** イベント場所 */
  eventLocation?: string;
  
  /** 参加者数上限 */
  maxParticipants?: number;
  
  /** 現在の参加者数 */
  currentParticipants?: number;
  
  /** 登録URL */
  registrationUrl?: string;
  
  /** 背景色 */
  backgroundColor?: string;
  
  /** テキスト色 */
  textColor?: string;
}

const LightningEventBlock: React.FC<LightningEventBlockProps> = ({
  eventTitle = 'Lightning Talk Circle',
  eventDescription = '⚡ 短時間でアイデアを共有する Lightning Talk イベントです',
  eventDate = new Date().toLocaleDateString('ja-JP'),
  eventLocation = 'オンライン',
  maxParticipants = 20,
  currentParticipants = 0,
  registrationUrl,
  backgroundColor,
  textColor,
  className,
  isSelected
}) => {
  const blockStyle: React.CSSProperties = {
    background: backgroundColor || 'var(--color-neutral-50)',
    color: textColor || 'var(--color-neutral-900)',
    border: isSelected ? '2px solid var(--color-primary-500)' : '1px solid var(--color-neutral-200)',
    borderRadius: 'var(--border-radius-xl)',
    padding: 'var(--spacing-6)',
    boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
    transition: 'var(--transition-normal)'
  };

  const participationRate = maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;

  return (
    <div className={className} style={blockStyle}>
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: 'var(--color-primary-500)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Lightning Talk Event Block
        </div>
      )}
      
      <header style={{ marginBottom: 'var(--spacing-4)' }}>
        <h3 style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-primary-600)',
          margin: '0 0 var(--spacing-2) 0'
        }}>
          ⚡ {eventTitle}
        </h3>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--spacing-4)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-neutral-600)'
        }}>
          <span>📅 {eventDate}</span>
          <span>📍 {eventLocation}</span>
          <span>👥 {currentParticipants}/{maxParticipants}名</span>
        </div>
      </header>
      
      <div style={{
        fontSize: 'var(--font-size-base)',
        lineHeight: 'var(--line-height-relaxed)',
        marginBottom: 'var(--spacing-4)'
      }}>
        {eventDescription}
      </div>
      
      {/* 参加率表示 */}
      <div style={{ marginBottom: 'var(--spacing-4)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-2)',
          fontSize: 'var(--font-size-sm)'
        }}>
          <span>参加者数</span>
          <span>{Math.round(participationRate)}%</span>
        </div>
        <div style={{
          height: '8px',
          background: 'var(--color-neutral-200)',
          borderRadius: 'var(--border-radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${participationRate}%`,
            background: participationRate > 80 
              ? 'var(--color-semantic-warning-500)'
              : participationRate > 50
              ? 'var(--color-secondary-500)'
              : 'var(--color-primary-500)',
            borderRadius: 'inherit',
            transition: 'var(--transition-normal)'
          }} />
        </div>
      </div>
      
      {registrationUrl && (
        <div style={{ textAlign: 'center' }}>
          <a 
            href={registrationUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              padding: 'var(--spacing-3) var(--spacing-6)',
              background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 'var(--border-radius-lg)',
              fontWeight: 'var(--font-weight-medium)',
              transition: 'var(--transition-normal)',
              boxShadow: 'var(--shadow-md)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xl), var(--shadow-lightning-glow)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
          >
            ⚡ 参加登録
          </a>
        </div>
      )}
    </div>
  );
};

/**
 * Lightning Talk Speaker Profile Block
 * スピーカープロフィール表示用のブロック
 */
interface LightningSpeakerBlockProps extends WordPressBlockProps {
  /** スピーカー名 */
  speakerName?: string;
  
  /** スピーカーの写真URL */
  speakerImage?: string;
  
  /** スピーカーの役職・会社 */
  speakerTitle?: string;
  
  /** プロフィール説明 */
  speakerBio?: string;
  
  /** トーク タイトル */
  talkTitle?: string;
  
  /** SNSリンク */
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  
  /** レイアウト */
  layout?: 'horizontal' | 'vertical';
}

const LightningSpeakerBlock: React.FC<LightningSpeakerBlockProps> = ({
  speakerName = 'Lightning Speaker',
  speakerImage,
  speakerTitle = 'Lightning Talk Speaker',
  speakerBio = '情熱的なLightning Talkスピーカーです。',
  talkTitle,
  socialLinks = {},
  layout = 'horizontal',
  className,
  isSelected
}) => {
  const isHorizontal = layout === 'horizontal';
  
  const blockStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isHorizontal ? 'row' : 'column',
    gap: 'var(--spacing-6)',
    padding: 'var(--spacing-6)',
    border: isSelected ? '2px solid var(--color-secondary-500)' : '1px solid var(--color-neutral-200)',
    borderRadius: 'var(--border-radius-xl)',
    background: 'var(--color-neutral-50)',
    boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
    alignItems: isHorizontal ? 'center' : 'flex-start'
  };

  const imageStyle: React.CSSProperties = {
    width: isHorizontal ? '120px' : '100%',
    maxWidth: isHorizontal ? '120px' : '200px',
    height: isHorizontal ? '120px' : 'auto',
    aspectRatio: '1',
    borderRadius: 'var(--border-radius-full)',
    objectFit: 'cover',
    background: speakerImage ? 'none' : 'linear-gradient(135deg, var(--color-primary-500), var(--color-secondary-500))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: 'var(--font-size-2xl)',
    flexShrink: 0
  };

  return (
    <div className={className} style={blockStyle}>
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: 'var(--color-secondary-500)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: 'var(--font-size-xs)',
          fontWeight: 'var(--font-weight-medium)'
        }}>
          Lightning Talk Speaker Block
        </div>
      )}
      
      <div style={imageStyle}>
        {speakerImage ? (
          <img 
            src={speakerImage} 
            alt={speakerName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
          />
        ) : (
          '⚡'
        )}
      </div>
      
      <div style={{ flex: 1 }}>
        <header style={{ marginBottom: 'var(--spacing-4)' }}>
          <h4 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-primary-600)',
            margin: '0 0 var(--spacing-1) 0'
          }}>
            {speakerName}
          </h4>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-neutral-600)',
            margin: '0 0 var(--spacing-2) 0'
          }}>
            {speakerTitle}
          </p>
          {talkTitle && (
            <p style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-secondary-600)',
              margin: '0'
            }}>
              💡 {talkTitle}
            </p>
          )}
        </header>
        
        <div style={{
          fontSize: 'var(--font-size-base)',
          lineHeight: 'var(--line-height-relaxed)',
          color: 'var(--color-neutral-800)',
          marginBottom: 'var(--spacing-4)'
        }}>
          {speakerBio}
        </div>
        
        {Object.keys(socialLinks).length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} style={{ color: 'var(--color-secondary-500)' }}>🐦</a>
            )}
            {socialLinks.github && (
              <a href={socialLinks.github} style={{ color: 'var(--color-neutral-700)' }}>🐙</a>
            )}
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} style={{ color: 'var(--color-secondary-600)' }}>💼</a>
            )}
            {socialLinks.website && (
              <a href={socialLinks.website} style={{ color: 'var(--color-primary-500)' }}>🌐</a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// WordPress Block Wrappers
export const WordPressLightningButton = withWordPressBlock(LightningButtonBlock);
export const WordPressLightningEvent = withWordPressBlock(LightningEventBlock);
export const WordPressLightningSpeaker = withWordPressBlock(LightningSpeakerBlock);

export {
  LightningButtonBlock,
  LightningEventBlock,
  LightningSpeakerBlock
};

export type {
  LightningButtonBlockProps,
  LightningEventBlockProps,
  LightningSpeakerBlockProps
};