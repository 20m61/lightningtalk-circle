# Lightning Talk Circle - GitHub Issue Labels

This document defines the standard labels to be used for GitHub issues in the
Lightning Talk Circle project. Consistent labeling helps with issue
organization, filtering, and reporting.

## Label Categories

The project uses four main categories of labels:

1. **Type**: Indicates what kind of issue it is
2. **Priority**: Indicates the importance and urgency
3. **Component**: Indicates which part of the system the issue relates to
4. **Status**: Indicates the current state in the workflow

## Type Labels

| Label                | Color                  | Description                                       |
| -------------------- | ---------------------- | ------------------------------------------------- |
| `type:feature`       | `#0E8A16` (green)      | New functionality being added to the application  |
| `type:bug`           | `#D73A4A` (red)        | Something isn't working as expected               |
| `type:enhancement`   | `#A2EEEF` (light blue) | Improvement to existing features or functionality |
| `type:documentation` | `#0075CA` (blue)       | Improvements or additions to documentation        |
| `type:task`          | `#FBCA04` (yellow)     | General tasks, maintenance, or chores             |
| `type:question`      | `#CC317C` (purple)     | Further information is requested or required      |

## Priority Labels

| Label               | Color                | Description                              |
| ------------------- | -------------------- | ---------------------------------------- |
| `priority:critical` | `#B60205` (dark red) | P0 issues that must be fixed immediately |
| `priority:high`     | `#D93F0B` (orange)   | P1 issues with high importance           |
| `priority:medium`   | `#FBCA04` (yellow)   | P2 issues with medium importance         |
| `priority:low`      | `#0E8A16` (green)    | P3 issues that are nice to have          |

## Component Labels

| Label                         | Color                    | Description                                          |
| ----------------------------- | ------------------------ | ---------------------------------------------------- |
| `component:eventmanagement`   | `#5319E7` (purple)       | Related to event creation, management, and execution |
| `component:datecoordination`  | `#1D76DB` (blue)         | Related to date suggestion, voting, and scheduling   |
| `component:archive`           | `#006B75` (teal)         | Related to presentation archive functionality        |
| `component:contentmanagement` | `#FBCA04` (yellow)       | Related to content creation and management           |
| `component:infrastructure`    | `#C5DEF5` (light blue)   | Related to development infrastructure, CI/CD, etc.   |
| `component:ui`                | `#BFD4F2` (light blue)   | Related to user interface elements                   |
| `component:auth`              | `#D4C5F9` (light purple) | Related to authentication and authorization          |
| `component:api`               | `#0E8A16` (green)        | Related to API functionality                         |

## Status Labels

| Label               | Color                   | Description                                 |
| ------------------- | ----------------------- | ------------------------------------------- |
| `status:backlog`    | `#EEEEEE` (light gray)  | Not yet started, in the backlog             |
| `status:ready`      | `#C2E0C6` (light green) | Ready for development                       |
| `status:inprogress` | `#0E8A16` (green)       | Currently being worked on                   |
| `status:review`     | `#FBCA04` (yellow)      | Ready for review                            |
| `status:blocked`    | `#D93F0B` (orange)      | Blocked by another issue or external factor |

## Additional Labels

| Label              | Color              | Description                                 |
| ------------------ | ------------------ | ------------------------------------------- |
| `good first issue` | `#7057FF` (purple) | Good for newcomers to the project           |
| `help wanted`      | `#008672` (teal)   | Extra attention is needed                   |
| `duplicate`        | `#CCCCCC` (gray)   | This issue already exists                   |
| `wontfix`          | `#FFFFFF` (white)  | This will not be worked on                  |
| `dependencies`     | `#0366D6` (blue)   | Pull requests that update a dependency file |

## Using Labels

When creating or updating issues:

1. **Apply at least one label from each category**: type, priority, component,
   and status
2. **Be consistent**: Follow the definitions in this document
3. **Update as needed**: Change labels as the issue progresses through its
   lifecycle

## Adding Labels to GitHub

To set up these labels in GitHub:

1. Go to the repository's Issues tab
2. Click Labels
3. Create new labels with the exact names, colors, and descriptions listed above
4. Consider using a tool like GitHub Label Sync to automate this process

## Label Maintenance

Periodically review and update this labeling system:

1. **Add new labels** as new components or classifications emerge
2. **Retire unused labels** that are no longer relevant
3. **Update descriptions** to improve clarity

By maintaining a consistent labeling system, the project will benefit from
improved organization, filtering capabilities, and reporting.
