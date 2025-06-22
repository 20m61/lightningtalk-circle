/**
 * ParticipantList Component
 * 
 * Lightning Talk specific component for displaying event participants
 */

import React, { forwardRef, useState } from 'react';
import { clsx } from 'clsx';
import { colors, spacing, radii } from '../../tokens';
import { Button } from '../Button';
import { Input } from '../Input';

export interface Participant {
  id: string | number;
  name: string;
  email?: string;
  role: 'attendee' | 'speaker' | 'organizer';
  avatar?: string;
  bio?: string;
  talkTitle?: string;
  registrationDate: string | Date;
  status: 'registered' | 'checked-in' | 'no-show' | 'cancelled';
  company?: string;
}

export interface ParticipantListProps {
  /**
   * Array of participants
   */
  participants: Participant[];
  
  /**
   * Whether to show search functionality
   */
  showSearch?: boolean;
  
  /**
   * Whether to show role filter
   */
  showRoleFilter?: boolean;
  
  /**
   * Whether to show status filter
   */
  showStatusFilter?: boolean;
  
  /**
   * Display variant
   */
  variant?: 'list' | 'grid' | 'compact';
  
  /**
   * Whether to show participant details
   */
  showDetails?: boolean;
  
  /**
   * Whether to show check-in functionality
   */
  showCheckIn?: boolean;
  
  /**
   * Maximum number of participants to display
   */
  maxDisplay?: number;
  
  /**
   * Custom CSS class
   */
  className?: string;
  
  /**
   * Event handlers
   */
  onParticipantClick?: (participant: Participant) => void;
  onCheckIn?: (participantId: string | number) => void;
  onRemoveParticipant?: (participantId: string | number) => void;
  
  /**
   * Loading state
   */
  loading?: boolean;
  
  /**
   * Empty state message
   */
  emptyMessage?: string;
}

const ParticipantList = forwardRef<HTMLDivElement, ParticipantListProps>(({
  participants,
  showSearch = true,
  showRoleFilter = true,
  showStatusFilter = false,
  variant = 'list',
  showDetails = true,
  showCheckIn = false,
  maxDisplay,
  className,
  onParticipantClick,
  onCheckIn,
  onRemoveParticipant,
  loading = false,
  emptyMessage = 'No participants found',
  ...props
}, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Filter participants
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.talkTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || participant.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || participant.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });
  
  const displayedParticipants = maxDisplay 
    ? filteredParticipants.slice(0, maxDisplay)
    : filteredParticipants;
  
  // Role counts
  const roleCounts = participants.reduce((acc, participant) => {
    acc[participant.role] = (acc[participant.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Status counts
  const statusCounts = participants.reduce((acc, participant) => {
    acc[participant.status] = (acc[participant.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'speaker': return '🎤';
      case 'organizer': return '👑';
      case 'attendee': 
      default: return '👤';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in': return colors.success[500];
      case 'registered': return colors.primary[500];
      case 'no-show': return colors.warning[500];
      case 'cancelled': return colors.error[500];
      default: return colors.gray[500];
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'checked-in': return 'Checked In';
      case 'registered': return 'Registered';
      case 'no-show': return 'No Show';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };
  
  const handleCheckIn = (participantId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCheckIn) {
      onCheckIn(participantId);
    }
  };
  
  const handleRemove = (participantId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveParticipant) {
      onRemoveParticipant(participantId);
    }
  };
  
  // Container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[4],
  };
  
  // Filters styles
  const filtersStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    flexWrap: 'wrap',
    alignItems: 'center',
  };
  
  const filterSelectStyles: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: radii.input,
    border: `1px solid ${colors.border.medium}`,
    fontSize: '0.875rem',
    backgroundColor: colors.background.primary,
  };
  
  // List styles based on variant
  const getListStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: spacing[4],
        };
      case 'compact':
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[2],
        };
      case 'list':
      default:
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: spacing[3],
        };
    }
  };
  
  // Participant item component
  const ParticipantItem = ({ participant }: { participant: Participant }) => {
    const itemStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[3],
      padding: variant === 'compact' ? spacing[2] : spacing[4],
      borderRadius: radii.card,
      border: `1px solid ${colors.border.light}`,
      backgroundColor: colors.background.card,
      cursor: onParticipantClick ? 'pointer' : 'default',
      transition: 'all 0.2s ease',
      
      ':hover': onParticipantClick ? {
        borderColor: colors.border.medium,
        backgroundColor: colors.background.secondary,
      } : {},
    };
    
    const avatarStyles: React.CSSProperties = {
      width: variant === 'compact' ? '32px' : '48px',
      height: variant === 'compact' ? '32px' : '48px',
      borderRadius: '50%',
      backgroundColor: colors.background.secondary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: variant === 'compact' ? '1rem' : '1.5rem',
      flexShrink: 0,
    };
    
    const contentStyles: React.CSSProperties = {
      flex: 1,
      minWidth: 0,
    };
    
    const nameStyles: React.CSSProperties = {
      fontSize: variant === 'compact' ? '0.875rem' : '1rem',
      fontWeight: 600,
      color: colors.text.primary,
      margin: 0,
    };
    
    const detailStyles: React.CSSProperties = {
      fontSize: '0.75rem',
      color: colors.text.secondary,
      margin: `${spacing[1]} 0 0 0`,
    };
    
    const statusBadgeStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 500,
      backgroundColor: `${getStatusColor(participant.status)}20`,
      color: getStatusColor(participant.status),
      border: `1px solid ${getStatusColor(participant.status)}40`,
    };
    
    const actionsStyles: React.CSSProperties = {
      display: 'flex',
      gap: spacing[2],
      alignItems: 'center',
    };
    
    return (
      <div
        style={itemStyles}
        onClick={() => onParticipantClick?.(participant)}
        className={clsx('lt-participant-item', `lt-participant-item--${variant}`)}
      >
        {/* Avatar */}
        <div style={avatarStyles}>
          {participant.avatar ? (
            <img
              src={participant.avatar}
              alt={participant.name}
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            getRoleIcon(participant.role)
          )}
        </div>
        
        {/* Content */}
        <div style={contentStyles}>
          <h3 style={nameStyles}>{participant.name}</h3>
          
          {showDetails && variant !== 'compact' && (
            <div style={detailStyles}>
              {participant.email && <div>{participant.email}</div>}
              {participant.company && <div>{participant.company}</div>}
              {participant.talkTitle && (
                <div><strong>Talk:</strong> {participant.talkTitle}</div>
              )}
            </div>
          )}
        </div>
        
        {/* Status Badge */}
        <div style={statusBadgeStyles}>
          {getStatusText(participant.status)}
        </div>
        
        {/* Actions */}
        <div style={actionsStyles}>
          {showCheckIn && participant.status === 'registered' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleCheckIn(participant.id, e)}
            >
              Check In
            </Button>
          )}
          
          {onRemoveParticipant && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleRemove(participant.id, e)}
              aria-label={`Remove ${participant.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              </svg>
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: spacing[8] }}>
        <div>Loading participants...</div>
      </div>
    );
  }
  
  return (
    <div
      ref={ref}
      className={clsx('lt-participant-list', `lt-participant-list--${variant}`, className)}
      style={containerStyles}
      {...props}
    >
      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: spacing[2] }}>
        <div style={{ fontSize: '0.875rem', color: colors.text.secondary }}>
          {participants.length} participant{participants.length !== 1 ? 's' : ''} total
          {maxDisplay && filteredParticipants.length > maxDisplay && (
            <span> • Showing {maxDisplay} of {filteredParticipants.length}</span>
          )}
        </div>
        
        {/* Role counts */}
        <div style={{ display: 'flex', gap: spacing[3], fontSize: '0.875rem' }}>
          <span>🎤 {roleCounts.speaker || 0} speakers</span>
          <span>👤 {roleCounts.attendee || 0} attendees</span>
          {roleCounts.organizer && <span>👑 {roleCounts.organizer} organizers</span>}
        </div>
      </div>
      
      {/* Filters */}
      {(showSearch || showRoleFilter || showStatusFilter) && (
        <div style={filtersStyles}>
          {/* Search */}
          {showSearch && (
            <Input
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startIcon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              }
              size="sm"
            />
          )}
          
          {/* Role Filter */}
          {showRoleFilter && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={filterSelectStyles}
            >
              <option value="all">All Roles</option>
              <option value="speaker">Speakers</option>
              <option value="attendee">Attendees</option>
              <option value="organizer">Organizers</option>
            </select>
          )}
          
          {/* Status Filter */}
          {showStatusFilter && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={filterSelectStyles}
            >
              <option value="all">All Status</option>
              <option value="registered">Registered</option>
              <option value="checked-in">Checked In</option>
              <option value="no-show">No Show</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      )}
      
      {/* Participants List */}
      {displayedParticipants.length > 0 ? (
        <div style={getListStyles()}>
          {displayedParticipants.map((participant) => (
            <ParticipantItem key={participant.id} participant={participant} />
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: spacing[8],
          color: colors.text.secondary,
        }}>
          {emptyMessage}
        </div>
      )}
      
      {/* Show more button */}
      {maxDisplay && filteredParticipants.length > maxDisplay && (
        <div style={{ textAlign: 'center' }}>
          <Button variant="outline" onClick={() => {}}>
            Show {filteredParticipants.length - maxDisplay} More
          </Button>
        </div>
      )}
    </div>
  );
});

ParticipantList.displayName = 'ParticipantList';

export { ParticipantList };