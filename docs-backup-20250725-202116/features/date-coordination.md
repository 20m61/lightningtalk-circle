# Date Coordination Function

## Overview

The Date Coordination Function streamlines the process of determining optimal dates for lightning talk events through a democratic voting system. It allows participants and organizers to propose candidate dates and collectively decide on the most suitable option through voting.

## User Stories

1. As an event organizer, I want to propose multiple candidate dates for an upcoming event so that participants can vote on their availability.
2. As a participant, I want to vote on candidate dates that work for me so that I can attend the event.
3. As an organizer, I want to see real-time voting results so that I can make informed decisions about the final event date.
4. As a participant, I want to be notified about the decided event date so that I can plan accordingly.
5. As an organizer, I want to finalize the event date based on voting results so that we can proceed with event planning.

## Implementation Details

### Data Structure

#### Custom Post Type: "Date Candidate"

| Field | Type | Description |
|-------|------|-------------|
| Date | Date | The proposed event date |
| Start Time | Time | Proposed event start time |
| End Time | Time | Proposed event end time |
| Proposer | User Reference | User who proposed the date |
| Vote Count | Integer | Number of votes received |
| Status | Enum | Current status (voting, decided, canceled) |
| Remarks | Text | Optional additional information |

#### Custom Table: "Votes"

| Field | Type | Description |
|-------|------|-------------|
| ID | Integer | Unique vote identifier |
| User ID | Integer | WordPress user ID of voter |
| Candidate ID | Integer | Post ID of the date candidate |
| Timestamp | Datetime | When the vote was cast |

### API Endpoints

#### REST API Endpoints

1. `GET /wp-json/ltc/v1/date-candidates`
   * List all active date candidates
   * Parameters: status (optional)

2. `POST /wp-json/ltc/v1/date-candidates`
   * Create a new date candidate
   * Required fields: date, start_time, end_time
   * Authorization required: Contributor role or higher

3. `GET /wp-json/ltc/v1/date-candidates/{id}`
   * Get details of a specific date candidate

4. `POST /wp-json/ltc/v1/date-candidates/{id}/vote`
   * Cast a vote for a specific date candidate
   * Authorization required: Subscriber role or higher

5. `DELETE /wp-json/ltc/v1/date-candidates/{id}/vote`
   * Remove a vote from a date candidate
   * Authorization required: Must be the original voter

6. `PATCH /wp-json/ltc/v1/date-candidates/{id}`
   * Update a date candidate (status change, etc.)
   * Authorization required: Editor role or higher

7. `GET /wp-json/ltc/v1/date-candidates/{id}/voters`
   * Get list of users who voted for a date candidate
   * Authorization required: Editor role or higher

### Frontend Implementation

#### Date Candidate Creation Interface

* Form to create new date candidates
* Date picker with calendar visualization
* Time selection with validation
* Preview of submission before confirmation
* Success/error feedback

#### Voting Interface

* **Technologies:** Next.js component using React Hooks for state management
* **Features:**
  * Calendar view of candidate dates with visual indicators
  * Card-based list view as alternative display option
  * Clear visual differentiation of votable vs. closed candidates
  * "Vote" button for each candidate with real-time update
  * Option to change vote with confirmation dialog
  * Vote counts shown as progress bars or numerical display
  * Countdown timer for voting deadline
  * Ability to view who has voted (for organizers)

#### Real-time Results Display

* **Technologies:** WebSockets for live updates, React for UI rendering
* **Features:**
  * Live-updating vote counts without page refresh
  * Visual representations (bars, charts) of voting distribution
  * Highlighting of currently winning date(s)
  * Filtering options (by date range, status)
  * Export functionality for organizers

### Administrative Features

* Dashboard widget showing active voting sessions
* Ability to add, edit, and delete date candidates
* Option to manually adjust voting status (open/close voting)
* Bulk operations for candidate management
* Settings page for:
  * Default voting duration
  * Multiple votes allowance toggle
  * Notification preferences
  * Visibility of voter names

### Notifications

* **Email notifications:**
  * When new date candidates are proposed
  * When voting is about to close (24 hours before)
  * When a final date is decided
* **Website notifications:**
  * Banner notifications for active voting sessions
  * Personal notifications for users' voted dates
* **Optional Slack integration:**
  * New candidate announcements
  * Voting reminders
  * Final date announcements

### Analytics

* Tracking of voting patterns over time
* Analysis of popular days/times
* User participation metrics
* Admin-only analytics dashboard

## Technical Considerations

### Performance

* Optimized database queries for vote counting
* Caching of vote results with automatic invalidation
* Efficient real-time updates via WebSockets

### Security

* Rate limiting for vote submissions
* Prevention of duplicate votes
* CSRF protection for all forms
* Appropriate user capability checks

### Accessibility

* Fully keyboard-navigable voting interface
* Screen reader-friendly implementation
* High contrast mode for vote status indicators
* Clear text alternatives for visual elements

## Testing Strategy

* **Unit Tests:**
  * Vote counting logic
  * Date validation
  * API endpoint functionality
* **Integration Tests:**
  * Vote submission workflow
  * Notification triggering
* **End-to-End Tests:**
  * Complete voting process simulation
  * Admin date finalization process
* **Visual Regression Tests:**
  * Calendar view rendering
  * Vote indication UI