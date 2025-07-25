# Lightning Talk Circle - Issue Creation Workflow

This document provides detailed instructions for creating and managing GitHub issues for the Lightning Talk Circle project based on the issue plans and templates.

## Issue Creation Process

### Step 1: Prepare the Issue Content

1. **Identify issues to create**: Use the [Issue Creation Plan](./issue-creation-plan.md) to identify which issues need to be created.
2. **Prepare issue content**: Use the [Issue Examples](/docs/project/issue-examples.md) and [Initial Issues](/docs/project/initial-issues.md) documents as references for formatting and content.
3. **Gather related resources**: Identify any related documentation, mockups, or technical specifications that should be linked in the issue.

### Step 2: Create the Issue in GitHub

1. **Navigate to Issues**: Go to the GitHub repository and click on the "Issues" tab.
2. **Create new issue**: Click the "New issue" button.
3. **Select appropriate template**: Choose the relevant template (Feature Request, Bug Report, or General Issue).
4. **Complete the template**:
   - Fill in all required fields from your prepared content
   - Ensure all acceptance criteria are clearly defined
   - Include related documentation links
   - Add implementation notes
   - Specify priority level

### Step 3: Apply Labels and Metadata

Apply appropriate labels to the issue following the [Issue Management Workflow](/docs/project/issue-management-workflow.md) guidelines:

1. **Type Labels**:
   - `feature`: For new functionality
   - `bug`: For issues with existing functionality
   - `enhancement`: For improvements to existing features
   - `documentation`: For documentation-related tasks
   - `task`: For general tasks and maintenance work

2. **Priority Labels**:
   - `priority:critical`: P0 issues (must fix immediately)
   - `priority:high`: P1 issues (high importance)
   - `priority:medium`: P2 issues (medium importance)
   - `priority:low`: P3 issues (nice to have)

3. **Component Labels**:
   - `component:eventmanagement`: Event management functionality
   - `component:datecoordination`: Date coordination functionality
   - `component:archive`: Presentation archive functionality
   - `component:contentmanagement`: Content management system
   - `component:infrastructure`: Development infrastructure
   - `component:ui`: User interface elements

4. **Status Labels**:
   - `status:backlog`: Not yet started

5. **Additional Metadata**:
   - Add milestone if applicable
   - Assign to appropriate team member if known
   - Link related issues if dependencies exist

### Step 4: Organize in Project Board

If using GitHub Projects:

1. **Add to project board**: Assign the issue to the appropriate project board
2. **Place in correct column**: Typically "Backlog" or "To Do" for new issues
3. **Set any project-specific fields**: Such as priority, sprint, etc.

## Issue Creation Order

Create issues in the following order to ensure proper dependency management:

1. **P0 Infrastructure/Foundation Issues** (blocking issues that must be addressed first)
   - Development environment and tools
   - CI/CD pipeline
   - Documentation structure

2. **P1 Core Feature Issues** (essential functionality for MVP)
   - Event Management features
   - Date Coordination features
   - Presentation Archive features

3. **P2 Enhancement Issues** (important but not blocking MVP)
   - User Experience enhancements
   - Content Management enhancements

4. **P2/P3 Compliance and Maintenance Issues** (important for quality, but not blocking initial functionality)
   - Accessibility implementation
   - Maintenance and operations

## Issue Verification Checklist

Before considering the issue creation process complete, verify that each issue:

- [ ] Follows the correct template format
- [ ] Contains clear and specific acceptance criteria
- [ ] Has appropriate labels applied
- [ ] Links to relevant documentation
- [ ] Includes implementation notes where helpful
- [ ] Has correct priority designation
- [ ] Is added to the project board (if applicable)
- [ ] Has dependencies clearly identified (if any)

## Maintaining Issue Quality

To ensure ongoing issue quality:

1. **Regular review**: Periodically review open issues to ensure they remain relevant and well-defined
2. **Update as needed**: Add additional context, clarify requirements, or adjust priorities as the project evolves
3. **Link related work**: When PRs address issues, ensure they are properly linked
4. **Document resolutions**: When closing issues, document how they were resolved for future reference

## Issue Templates Maintenance

The issue templates themselves should be periodically reviewed and updated:

1. **Template effectiveness**: Evaluate if the templates are helping create high-quality issues
2. **Field adjustments**: Add, remove, or modify fields based on project needs
3. **Update examples**: Keep the example issues updated to reflect current best practices

By following this workflow, all issues created for the Lightning Talk Circle project will maintain consistent quality and provide clear guidance for implementation.