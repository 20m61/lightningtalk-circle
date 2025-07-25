# Lightning Talk Circle - Issue Examples

This document provides examples of issues to be created in GitHub, following the
standard templates. Below are examples of high-priority issues that should be
created first.

## Infrastructure Issue Example

### Set up development environment and tools

```markdown
## Description

Set up the standardized development environment and code quality tools as
specified in the development workflow documentation.

## User Story

**As a** developer **I want to** have a consistent development environment with
automated code quality checks **So that** I can develop features efficiently
while maintaining code quality standards

## Acceptance Criteria

- [ ] Local development environment documented and tested
- [ ] PHP_CodeSniffer configured for PSR-12 compliance
- [ ] ESLint set up with appropriate configuration for JavaScript
- [ ] Stylelint configured for CSS/SCSS validation
- [ ] Markdownlint set up for documentation consistency
- [ ] Husky and lint-staged implemented for pre-commit hooks
- [ ] Documentation updated with setup instructions

## Related Documentation

- [Development Workflow](/docs/technical/development-flow.md)

## Implementation Notes

- Configuration files should be placed in the repository root
- Linter configurations should match the standards specified in the development
  workflow document
- Pre-commit hooks should run appropriate linters based on file types

## Priority

- [x] High: Core functionality, blocking other features
- [ ] Medium: Important but not blocking
- [ ] Low: Nice to have
```

## Core Feature Issue Example

### Implement event creation and announcement system

```markdown
## Description

Create the system that allows organizers to create new lightning talk events and
publish announcements about them.

## User Story

**As an** organizer **I want to** create and publish event announcements with
all relevant details **So that** potential participants can learn about upcoming
lightning talks

## Acceptance Criteria

- [ ] Event creation form with all required fields (title, date, time, location,
      description, capacity)
- [ ] Field validation and error handling
- [ ] Draft saving functionality
- [ ] Preview capability before publishing
- [ ] Publishing mechanism with status tracking
- [ ] Event announcement display on public-facing pages
- [ ] Email notification system for subscribers when new events are published

## Related Documentation

- [Event Management Function](/docs/features/event-management.md)

## Implementation Notes

- Event creation should be restricted to users with organizer role
- Published events should be immediately visible on the events listing page
- Consider implementing scheduled publishing for future announcements

## Mockups / Screenshots

(Reference to design mockups would be included here)

## Priority

- [x] High: Core functionality, blocking other features
- [ ] Medium: Important but not blocking
- [ ] Low: Nice to have
```

### Build event registration system

```markdown
## Description

Develop the registration system that allows participants to sign up for
lightning talk events.

## User Story

**As a** participant **I want to** register for events with a simple form **So
that** I can secure my spot

## Acceptance Criteria

- [ ] Registration form with necessary fields (name, email, etc.)
- [ ] Integration with user accounts (optional login)
- [ ] Capacity management with real-time availability updates
- [ ] Waitlist functionality when events are full
- [ ] Automatic confirmation emails with event details
- [ ] QR code/ticket generation for in-person events
- [ ] Calendar integration (.ics file download)
- [ ] Registration management for users (view, cancel registrations)

## Related Documentation

- [Event Management Function](/docs/features/event-management.md)

## Implementation Notes

- Registration should work for both logged-in and non-logged-in users
- Consider implementing registration deadlines
- Ensure GDPR compliance for data collection

## Priority

- [x] High: Core functionality, blocking other features
- [ ] Medium: Important but not blocking
- [ ] Low: Nice to have
```

### Implement date suggestion and voting system

```markdown
## Description

Create a system that allows for collaborative date selection through suggestions
and voting.

## User Story

**As an** event organizer or participant **I want to** suggest dates and vote on
options **So that** we can find the optimal time for a lightning talk event

## Acceptance Criteria

- [ ] Interface for suggesting potential event dates
- [ ] Voting mechanism for date preferences
- [ ] Results visualization showing popularity of each option
- [ ] Automatic reminders for users who haven't voted
- [ ] Deadline functionality for voting periods
- [ ] Finalization process for selecting the date
- [ ] Notifications when dates are confirmed

## Related Documentation

- [Date Coordination Function](/docs/features/date-coordination.md)

## Implementation Notes

- Consider integration with calendar systems for availability checking
- Allow for adding time preferences, not just dates
- Include option for organizers to add notes or constraints to date options

## Priority

- [x] High: Core functionality, blocking other features
- [ ] Medium: Important but not blocking
- [ ] Low: Nice to have
```

## Enhancement Issue Example

### Implement in-site feedback mechanisms

```markdown
## Description

Develop various feedback collection mechanisms throughout the site to gather
user input and suggestions.

## User Story

**As a** site administrator **I want to** collect feedback from users about the
platform **So that** we can continuously improve based on user needs

## Acceptance Criteria

- [ ] Floating or slide-in feedback button accessible from all pages
- [ ] Simple rating system (1-5 stars)
- [ ] Optional text input for detailed feedback
- [ ] Page-specific context capture
- [ ] Feature-specific feedback prompts after interactions
- [ ] Periodic comprehensive survey capability
- [ ] Feedback management dashboard for administrators

## Related Documentation

- [Operations Guidelines](/docs/technical/operations.md)

## Implementation Notes

- Feedback should be categorized (bug reports, feature requests, UX/UI feedback,
  etc.)
- Create a workflow for reviewing and acting on feedback
- Consider integration with issue creation in GitHub

## Priority

- [ ] High: Core functionality, blocking other features
- [x] Medium: Important but not blocking
- [ ] Low: Nice to have
```

## Compliance Issue Example

### Implement accessibility standards compliance

```markdown
## Description

Ensure that the entire site complies with WCAG 2.1 AA accessibility standards.

## User Story

**As a** user with disabilities **I want to** use the site with assistive
technologies **So that** I can participate in lightning talk events and access
content

## Acceptance Criteria

- [ ] Semantic HTML structure throughout the site
- [ ] Proper keyboard navigation for all interactive elements
- [ ] Appropriate alt text for all images
- [ ] Sufficient color contrast ratios
- [ ] Properly labeled forms and inputs
- [ ] ARIA attributes implemented correctly
- [ ] Skip to content links
- [ ] Accessible navigation mechanisms
- [ ] Screen reader compatibility

## Related Documentation

- [Accessibility Guidelines](/docs/technical/accessibility.md)

## Implementation Notes

- Consider creating an accessibility component library
- Implement automated testing with tools like Axe
- Set up regular manual testing procedures

## Priority

- [ ] High: Core functionality, blocking other features
- [x] Medium: Important but not blocking
- [ ] Low: Nice to have
```

These examples serve as templates for creating the full set of GitHub issues.
All issues should follow the same structure and detail level to ensure
consistency across the project.
