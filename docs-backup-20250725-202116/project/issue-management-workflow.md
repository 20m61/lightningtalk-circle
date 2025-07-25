# Lightning Talk Circle - Issue Management Workflow

This document outlines the workflow for managing issues in the Lightning Talk
Circle project, including the prioritization approach, labeling system, and
lifecycle management.

## Issue Prioritization

Issues are prioritized based on the following criteria:

### 1. Impact vs. Effort Matrix

| Impact↓ / Effort→ | Low | Medium | High |
| ----------------- | --- | ------ | ---- |
| High              | P0  | P1     | P2   |
| Medium            | P1  | P2     | P3   |
| Low               | P2  | P3     | P3   |

### 2. Dependencies

Issues that block other features receive higher priority. The project follows
these dependency chains:

1. Foundation/Infrastructure → Core Features → Enhancements → Optimizations
2. User-facing components → Administrative components → Analytics/reporting

### 3. User Value

Features are prioritized based on their direct value to users:

- Critical user journey components
- Frequently used features
- Pain point solutions

## Issue Labels

The following labels should be used consistently across issues:

### Type Labels

- `feature`: New functionality
- `bug`: Something isn't working correctly
- `enhancement`: Improvements to existing features
- `documentation`: Documentation-related tasks
- `task`: General tasks and maintenance work

### Priority Labels

- `priority:critical`: P0 issues (must fix immediately)
- `priority:high`: P1 issues (high importance)
- `priority:medium`: P2 issues (medium importance)
- `priority:low`: P3 issues (nice to have)

### Component Labels

- `component:eventmanagement`: Event management functionality
- `component:datecoordination`: Date coordination functionality
- `component:archive`: Presentation archive functionality
- `component:contentmanagement`: Content management system
- `component:infrastructure`: Development infrastructure
- `component:ui`: User interface elements

### Status Labels

- `status:backlog`: Not yet started
- `status:ready`: Ready for development
- `status:inprogress`: Currently being worked on
- `status:review`: Ready for review
- `status:blocked`: Blocked by another issue or external factor

## Issue Lifecycle

1. **Creation**: Issues are created using the appropriate template
   - Detailed description
   - Clear acceptance criteria
   - Appropriate labels
   - Priority assignment

2. **Refinement**: Issues are refined before development
   - Additional details added
   - Acceptance criteria clarified
   - Dependencies identified
   - Implementation notes updated

3. **Development**: Issues are worked on by developers
   - Status updated to "in progress"
   - Regular progress updates in comments
   - Questions/blockers highlighted

4. **Review**: Completed work is reviewed
   - Pull request linked to issue
   - Acceptance criteria verified
   - Documentation updated

5. **Closure**: Issues are closed when complete
   - All acceptance criteria met
   - Related documentation updated
   - Closing comments added with summary of resolution

## Sprint Planning

Issues are organized into sprints following these guidelines:

1. **Sprint Duration**: 2 weeks
2. **Sprint Composition**:
   - 70% core functionality
   - 20% enhancements/improvements
   - 10% technical debt/maintenance

3. **Selection Criteria**:
   - Priority (P0 and P1 issues first)
   - Dependencies (unblocked issues preferred)
   - Team capacity and expertise
   - Balance across components

## Progress Tracking

Progress is tracked through:

1. **Sprint Board**: Kanban-style board showing issues in various stages
2. **Burndown Chart**: Visualizing completion rate during sprints
3. **Status Updates**: Regular status meetings to discuss progress and blockers

## Issue Templates

All issues should use the standard templates located in
`.github/ISSUE_TEMPLATE/`. These templates ensure consistency in issue structure
and completeness of information.
