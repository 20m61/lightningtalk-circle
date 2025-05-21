# Content Management Specifications

## Overview

This document details the content management system for the Lightning Talk Circle website, focusing specifically on how non-account user submissions are handled, moderated, and protected against spam. It establishes a robust framework for managing user-generated content while maintaining site quality and security.

## Non-Account Submission Types

### Types of Content Accepting Non-Account Submissions

1. **Presentation Comments**
   * Public comments on archived presentations
   * Question and answer functionality
   * Feedback on presentation content

2. **Presentation Archive Proposals**
   * Submissions of past presentations for inclusion in the archive
   * Metadata and material uploads from external presenters

3. **Event Feedback**
   * Post-event surveys and feedback forms
   * Anonymous suggestions and improvement ideas

4. **General Contact Form Submissions**
   * Inquiries about the circle and events
   * Support requests
   * Partnership proposals

## Submission Workflow

### Submission Process

1. **Content Creation**
   * User completes a form with required fields
   * Anti-spam measures applied (detailed below)
   * Submission receipt confirmation displayed
   * Reference ID provided to the submitter

2. **Initial Processing**
   * Automated spam filtering (Akismet, pattern matching)
   * Assignment to appropriate review queue
   * Notification to relevant administrators

3. **Review Process**
   * Administrators review submissions in moderation dashboard
   * Options to approve, reject, edit, or flag for further review
   * Internal notes can be added to submissions

4. **Notification System**
   * Email notification to submitter upon status change
   * Optional anonymous tracking link

5. **Publication**
   * Approved content appears in appropriate section
   * Attribution handling (anonymous vs. named)
   * Appropriate formatting applied

### Submission Status Management

* **Custom Post Status Implementation:**
  * `pending` - Awaiting review
  * `approved` - Accepted and published
  * `rejected` - Declined by moderators
  * `spam` - Identified as spam
  * `trash` - Removed from consideration

* **Status Transitions:**
  * Automatic transitions based on rule configurations
  * Manual transitions by administrators
  * Bulk status changes for efficient moderation

## Administrative Interface

### Moderation Dashboard

* **Layout:**
  * Filterable list of submissions by type and status
  * Quick action buttons (approve, reject, spam)
  * Preview functionality
  * Batch operations

* **Content Details View:**
  * Complete submission details
  * Submitter information (if available)
  * Submission metadata (IP, timestamp, referrer)
  * Edit capabilities
  * Response mechanism

* **Queue Management:**
  * Priority flagging for urgent review
  * Assignment to specific moderators
  * SLA tracking for response times

### Notification Configuration

* **Administrator Notifications:**
  * Email alerts for new submissions
  * Optional Slack integration
  * Customizable notification preferences by content type
  * Digest options (immediate, hourly, daily summaries)

* **Submitter Notifications:**
  * Customizable templates for different status changes
  * Branding and tone consistency
  * Optional reference links and next steps

## Spam Prevention System

### Multi-layered Approach

1. **Akismet Integration**
   * Integration with WordPress Akismet plugin
   * Configuration for content-type specific sensitivity
   * Machine learning based on moderator actions

2. **CAPTCHA Implementation**
   * **reCAPTCHA v3** for invisible verification
   * Fallback to interactive CAPTCHA for suspicious submissions
   * Score-based action determination

3. **Honeypot Fields**
   * Invisible form fields to catch automated submissions
   * Time-based submission validation
   * JavaScript-dependent submission paths

4. **Submission Rate Limiting**
   * IP-based submission frequency restrictions
   * Graduated timeout periods for multiple submissions
   * Cookie-based tracking for persistent abusers

5. **Content Pattern Matching**
   * Regular expression filtering for spam patterns
   * Link quantity limitations
   * Known spam phrase detection

### NG Word List Management

* **Word List Categories:**
  * Prohibited content (offensive language, etc.)
  * Spam indicators (commercial terms, etc.)
  * Suspicious patterns (excessive URLs, etc.)

* **Management Interface:**
  * Category-based word list management
  * Regular expression support
  * Whitelist exceptions
  * Import/export functionality

* **Application Rules:**
  * Automatic rejection or flagging based on severity
  * Threshold-based decisions
  * Context-aware application

### IP Management

* **IP Tracking:**
  * Recording of submission IP addresses
  * Geolocation data for regional analysis
  * Correlation of multiple submissions

* **Blocking Mechanism:**
  * Manual IP blocking for confirmed spammers
  * Temporary vs. permanent blocks
  * Range-based blocking options
  * Whitelist for trusted sources

* **Automated Protection:**
  * Automatic temporary blocks after multiple rejected submissions
  * Integration with known spam IP databases
  * Behavior-based blocking triggers

## Content Storage and Management

### Database Structure

* **Custom Tables:**
  * `wp_ltc_submissions` - Core submission data
  * `wp_ltc_submission_meta` - Additional metadata
  * `wp_ltc_moderation_log` - Tracking of moderator actions

* **Data Retention:**
  * Configurable retention periods by submission type
  * Automated purging of old rejected/spam content
  * Anonymization of personal data after retention period

### Media Handling

* **File Uploads:**
  * Strict file type limitations (PDF, PPTX, etc.)
  * Size restrictions appropriate to content type
  * Virus/malware scanning before storage
  * Storage in non-executable directories

* **Image Processing:**
  * Automatic resize and optimization
  * EXIF data stripping
  * Watermarking options for content protection

## Privacy and Data Protection

### Data Collection Principles

* **Minimization:**
  * Only collect necessary information
  * Optional fields clearly marked
  * Purpose specification for all data collection

* **Transparency:**
  * Clear privacy notices at collection points
  * Processing purpose disclosure
  * Retention period information

### Compliance Measures

* **Regulatory Compliance:**
  * Alignment with Japanese personal information protection laws
  * GDPR-inspired protections for international users
  * Cookie policies and consent

* **Data Subject Rights:**
  * Process for data access requests
  * Deletion mechanisms for personal data
  * Data portability considerations

## Reporting and Analytics

### Content Metrics

* **Submission Analytics:**
  * Volume by type and time period
  * Approval/rejection rates
  * Response time tracking
  * Spam capture effectiveness

* **Moderator Performance:**
  * Processing time averages
  * Consistency of decisions
  * Volume handled

* **Content Quality:**
  * User engagement with approved submissions
  * Feedback mechanisms on moderation decisions
  * Content value assessment

### Reporting Interface

* **Dashboard:**
  * Visual representations of key metrics
  * Trend analysis over time
  * Customizable views for different stakeholders

* **Export Options:**
  * CSV/Excel exports for detailed analysis
  * Scheduled report generation
  * API access for data integration

## Integration Points

### WordPress Core Integration

* **Comment System Alignment:**
  * Extension of WordPress native comment capabilities
  * Consistent interface for moderators
  * Leveraging existing WordPress hooks and filters

* **User System Connection:**
  * Optional linking of submissions to user accounts
  * Reputation system for frequent contributors
  * Progressive privileges based on contribution history

### Third-party Service Integration

* **Notification Services:**
  * Email service provider integration
  * Slack webhook configuration
  * Optional SMS alerts for critical items

* **Content Analysis:**
  * Integration with sentiment analysis tools
  * Language translation services
  * Content categorization assistance

## Testing and Quality Assurance

* **Submission Testing:**
  * Regular testing of submission forms
  * Simulated spam submission tests
  * Performance testing under load

* **Moderation Flow Testing:**
  * End-to-end workflow validation
  * Response time monitoring
  * Decision consistency checking

* **Security Validation:**
  * Penetration testing of submission systems
  * Data protection verification
  * Access control testing