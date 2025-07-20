/**
 * EventCard Component
 *
 * Lightning Talk event display card with interactive features
 */

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import styles from './EventCard.module.css';
import { Button } from '../Button';
import { Card } from '../Card';

export interface EventCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Event details
   */
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    description?: string;
    participantsCount: number;
    maxParticipants?: number;
    imageUrl?: string;
    status: 'upcoming' | 'ongoing' | 'completed';
    tags?: string[];
  };

  /**
   * Card variant
   */
  variant?: 'default' | 'featured' | 'compact';

  /**
   * Whether to show participation button
   */
  showParticipateButton?: boolean;

  /**
   * Whether to show participant count
   */
  showParticipantCount?: boolean;

  /**
   * Whether to show event status badge
   */
  showStatus?: boolean;

  /**
   * Callback when participate button is clicked
   */
  onParticipate?: (eventId: string) => void;

  /**
   * Callback when card is clicked
   */
  onViewDetails?: (eventId: string) => void;

  /**
   * Custom CSS class
   */
  className?: string;
}

const EventCard = forwardRef<HTMLDivElement, EventCardProps>(
  (
    {
      event,
      variant = 'default',
      showParticipateButton = true,
      showParticipantCount = true,
      showStatus = true,
      onParticipate,
      onViewDetails,
      className,
      ...props
    },
    ref
  ) => {
    const {
      id,
      title,
      date,
      time,
      location,
      description,
      participantsCount,
      maxParticipants,
      imageUrl,
      status,
      tags
    } = event;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    };

    const handleParticipate = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onParticipate) {
        onParticipate(id);
      }
    };

    const handleViewDetails = () => {
      if (onViewDetails) {
        onViewDetails(id);
      }
    };

    const isFullyBooked = maxParticipants && participantsCount >= maxParticipants;
    const participationRate = maxParticipants ? (participantsCount / maxParticipants) * 100 : 0;

    return (
      <Card
        ref={ref}
        className={clsx(
          styles.eventCard,
          styles[`eventCard--${variant}`],
          styles[`eventCard--${status}`],
          className
        )}
        variant={variant === 'featured' ? 'highlighted' : 'default'}
        interactive={!!onViewDetails}
        {...(onViewDetails && { onClick: handleViewDetails })}
        {...props}
      >
        {/* Event Image */}
        {imageUrl && variant !== 'compact' && (
          <div className={styles.imageContainer}>
            <img src={imageUrl} alt={title} className={styles.eventImage} loading="lazy" />
            {showStatus && (
              <div className={clsx(styles.statusBadge, styles[`statusBadge--${status}`])}>
                {status === 'upcoming' && '開催予定'}
                {status === 'ongoing' && '開催中'}
                {status === 'completed' && '終了'}
              </div>
            )}
          </div>
        )}

        {/* Event Content */}
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <h3 className={styles.title}>{title}</h3>
            {!imageUrl && showStatus && (
              <div className={clsx(styles.statusBadge, styles[`statusBadge--${status}`])}>
                {status === 'upcoming' && '開催予定'}
                {status === 'ongoing' && '開催中'}
                {status === 'completed' && '終了'}
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className={styles.details}>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>📅</span>
              <span className={styles.detailText}>{formatDate(date)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>⏰</span>
              <span className={styles.detailText}>{time}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>📍</span>
              <span className={styles.detailText}>{location}</span>
            </div>
          </div>

          {/* Description */}
          {description && variant !== 'compact' && (
            <p className={styles.description}>{description}</p>
          )}

          {/* Tags */}
          {tags && tags.length > 0 && variant !== 'compact' && (
            <div className={styles.tags}>
              {tags.map((tag, index) => (
                <span key={index} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Participants */}
          {showParticipantCount && (
            <div className={styles.participants}>
              <div className={styles.participantCount}>
                <span className={styles.participantIcon}>👥</span>
                <span className={styles.participantText}>
                  {participantsCount}
                  {maxParticipants && ` / ${maxParticipants}`}
                  人参加
                </span>
              </div>
              {maxParticipants && (
                <div className={styles.participantProgress}>
                  <div className={styles.progressBar} style={{ width: `${participationRate}%` }} />
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            {showParticipateButton && status === 'upcoming' && (
              <Button
                variant={isFullyBooked ? 'outline' : 'primary'}
                size={variant === 'compact' ? 'sm' : 'md'}
                onClick={handleParticipate}
                {...(isFullyBooked && { disabled: true })}
                {...(styles.participateButton && { className: styles.participateButton })}
              >
                {isFullyBooked ? '満員' : '参加する'}
              </Button>
            )}
            {onViewDetails && (
              <Button
                variant="ghost"
                size={variant === 'compact' ? 'sm' : 'md'}
                onClick={handleViewDetails}
                {...(styles.detailsButton && { className: styles.detailsButton })}
              >
                詳細を見る
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }
);

EventCard.displayName = 'EventCard';

export { EventCard };
