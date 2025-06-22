/**
 * EventCard Component
 * 
 * Specialized card component for displaying Lightning Talk events
 */

import React, { forwardRef } from 'react';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import { clsx } from 'clsx';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';
import { Button } from '../Button';
import { colors, spacing } from '../../tokens';

export interface Event {
  id: string | number;
  title: string;
  description?: string;
  date: string | Date;
  venue: string;
  venueAddress?: string;
  capacity: number;
  participantCount: number;
  status: 'draft' | 'open' | 'full' | 'closed' | 'cancelled';
  online: boolean;
  onlineUrl?: string;
  organizer?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface EventCardProps {
  /**
   * Event data
   */
  event: Event;
  
  /**
   * Card size variant
   */
  size?: 'compact' | 'default' | 'featured';
  
  /**
   * Whether to show the registration button
   */
  showRegistration?: boolean;
  
  /**
   * Whether the card is interactive (clickable)
   */
  interactive?: boolean;
  
  /**
   * Custom CSS class
   */
  className?: string;
  
  /**
   * Event handlers
   */
  onRegister?: (eventId: string | number) => void;
  onViewDetails?: (eventId: string | number) => void;
  onClick?: (event: Event) => void;
}

const EventCard = forwardRef<HTMLDivElement, EventCardProps>(({
  event,
  size = 'default',
  showRegistration = true,
  interactive = false,
  className,
  onRegister,
  onViewDetails,
  onClick,
  ...props
}, ref) => {
  const eventDate = new Date(event.date);
  const now = new Date();
  const isUpcoming = isAfter(eventDate, now);
  const isPast = isBefore(eventDate, now);
  
  // Event status helpers
  const isRegistrationOpen = event.status === 'open' && isUpcoming;
  const isFull = event.status === 'full' || event.participantCount >= event.capacity;
  const isCancelled = event.status === 'cancelled';
  
  const getStatusColor = () => {
    if (isCancelled) return colors.error[500];
    if (isPast) return colors.gray[500];
    if (isFull) return colors.warning[500];
    if (isRegistrationOpen) return colors.success[500];
    return colors.gray[500];
  };
  
  const getStatusText = () => {
    if (isCancelled) return 'Cancelled';
    if (isPast) return 'Ended';
    if (isFull) return 'Full';
    if (isRegistrationOpen) return 'Open for Registration';
    return 'Draft';
  };
  
  const handleCardClick = () => {
    if (interactive && onClick) {
      onClick(event);
    }
  };
  
  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegister && isRegistrationOpen) {
      onRegister(event.id);
    }
  };
  
  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails(event.id);
    }
  };
  
  // Size-specific styles
  const sizeStyles = {
    compact: {
      cardPadding: 'sm' as const,
      titleSize: '1rem',
      showDescription: false,
      showTags: false,
    },
    default: {
      cardPadding: 'md' as const,
      titleSize: '1.125rem',
      showDescription: true,
      showTags: true,
    },
    featured: {
      cardPadding: 'lg' as const,
      titleSize: '1.25rem',
      showDescription: true,
      showTags: true,
    },
  };
  
  const currentSize = sizeStyles[size];
  
  // Status badge
  const StatusBadge = () => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 500,
        backgroundColor: `${getStatusColor()}20`,
        color: getStatusColor(),
        border: `1px solid ${getStatusColor()}40`,
      }}
    >
      <div
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: getStatusColor(),
          marginRight: '6px',
        }}
      />
      {getStatusText()}
    </div>
  );
  
  // Participant count indicator
  const ParticipantIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], fontSize: '0.875rem', color: colors.text.secondary }}>
      <span>👥</span>
      <span>
        {event.participantCount}/{event.capacity}
        {isFull && <span style={{ color: colors.warning[600] }}> (Full)</span>}
      </span>
    </div>
  );
  
  // Date and time display
  const DateDisplay = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], fontSize: '0.875rem', color: colors.text.secondary }}>
      <span>📅</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[1] }}>
        <span>{format(eventDate, 'MMM d, yyyy • h:mm a')}</span>
        {isUpcoming && (
          <span style={{ fontSize: '0.75rem', color: colors.text.tertiary }}>
            {formatDistanceToNow(eventDate, { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
  
  // Venue display
  const VenueDisplay = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2], fontSize: '0.875rem', color: colors.text.secondary }}>
      <span>{event.online ? '💻' : '📍'}</span>
      <span>{event.venue}</span>
    </div>
  );
  
  // Tags display
  const TagsDisplay = () => {
    if (!event.tags || !event.tags.length || !currentSize.showTags) return null;
    
    return (
      <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap', marginTop: spacing[3] }}>
        {event.tags.slice(0, 3).map((tag, index) => (
          <span
            key={index}
            style={{
              padding: '2px 8px',
              backgroundColor: colors.primary[50],
              color: colors.primary[700],
              fontSize: '0.75rem',
              borderRadius: '12px',
              border: `1px solid ${colors.primary[200]}`,
            }}
          >
            {tag}
          </span>
        ))}
        {event.tags.length > 3 && (
          <span
            style={{
              padding: '2px 8px',
              backgroundColor: colors.gray[100],
              color: colors.gray[600],
              fontSize: '0.75rem',
              borderRadius: '12px',
            }}
          >
            +{event.tags.length - 3}
          </span>
        )}
      </div>
    );
  };
  
  return (
    <Card
      ref={ref}
      variant="elevated"
      padding={currentSize.cardPadding}
      interactive={interactive}
      className={clsx('lt-event-card', `lt-event-card--${size}`, className)}
      onClick={handleCardClick}
      {...props}
    >
      <CardHeader
        title={
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing[3] }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: currentSize.titleSize, 
              fontWeight: 600, 
              lineHeight: 1.4,
              color: colors.text.primary,
            }}>
              {event.title}
            </h3>
            <StatusBadge />
          </div>
        }
      />
      
      <CardContent>
        {/* Description */}
        {event.description && currentSize.showDescription && (
          <p style={{ 
            margin: `0 0 ${spacing[4]} 0`, 
            fontSize: '0.875rem', 
            lineHeight: 1.5,
            color: colors.text.secondary,
          }}>
            {event.description}
          </p>
        )}
        
        {/* Event Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing[3] }}>
          <DateDisplay />
          <VenueDisplay />
          <ParticipantIndicator />
        </div>
        
        {/* Tags */}
        <TagsDisplay />
        
        {/* Organizer */}
        {event.organizer && size !== 'compact' && (
          <div style={{ 
            marginTop: spacing[4], 
            fontSize: '0.75rem', 
            color: colors.text.tertiary 
          }}>
            Organized by {event.organizer}
          </div>
        )}
      </CardContent>
      
      {/* Footer with actions */}
      {showRegistration && (
        <CardFooter>
          <div style={{ display: 'flex', gap: spacing[2], flexWrap: 'wrap' }}>
            {isRegistrationOpen && !isFull && (
              <Button
                variant="primary"
                size={size === 'compact' ? 'sm' : 'md'}
                onClick={handleRegister}
                style={{ flex: size === 'compact' ? undefined : 1 }}
              >
                Register Now
              </Button>
            )}
            
            {isFull && isUpcoming && (
              <Button
                variant="outline"
                size={size === 'compact' ? 'sm' : 'md'}
                disabled
                style={{ flex: size === 'compact' ? undefined : 1 }}
              >
                Event Full
              </Button>
            )}
            
            <Button
              variant="ghost"
              size={size === 'compact' ? 'sm' : 'md'}
              onClick={handleViewDetails}
            >
              View Details
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
});

EventCard.displayName = 'EventCard';

export { EventCard };