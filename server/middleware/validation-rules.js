/**
 * Comprehensive Validation Rules for Lightning Talk Circle API
 * Uses express-validator for robust input validation
 */

import { body, param, query } from 'express-validator';

// Common validation patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[\+]?[\d\s\-\(\)]{10,15}$/;
const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/;
const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Event validation rules
export const eventValidationRules = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Event title must be between 5 and 100 characters')
      .matches(
        /^[a-zA-Z0-9\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF！？！？・（）()[\]「」『』【】〈〉《》、。,.\-_]+$/
      )
      .withMessage('Event title contains invalid characters'),

    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Event description must be between 10 and 2000 characters')
      .escape(),

    body('eventDate')
      .isISO8601()
      .withMessage('Event date must be a valid ISO 8601 date')
      .custom(value => {
        const eventDate = new Date(value);
        const now = new Date();
        const maxFutureDate = new Date();
        maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 2);

        if (eventDate <= now) {
          throw new Error('Event date must be in the future');
        }
        if (eventDate > maxFutureDate) {
          throw new Error('Event date cannot be more than 2 years in the future');
        }
        return true;
      }),

    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date')
      .custom((value, { req }) => {
        if (value) {
          const endDate = new Date(value);
          const startDate = new Date(req.body.eventDate);
          if (endDate <= startDate) {
            throw new Error('End date must be after start date');
          }
          // Max event duration: 24 hours
          if (endDate.getTime() - startDate.getTime() > 24 * 60 * 60 * 1000) {
            throw new Error('Event duration cannot exceed 24 hours');
          }
        }
        return true;
      }),

    body('venue.name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Venue name must be between 2 and 100 characters')
      .escape(),

    body('venue.address')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Venue address must be between 5 and 200 characters')
      .escape(),

    body('venue.capacity')
      .isInt({ min: 1, max: 10000 })
      .withMessage('Venue capacity must be between 1 and 10000'),

    body('venue.online').optional().isBoolean().withMessage('Online field must be a boolean'),

    body('venue.onlineUrl')
      .optional()
      .custom((value, { req }) => {
        if (req.body.venue?.online && !value) {
          throw new Error('Online URL is required when event is online');
        }
        if (value && !urlPattern.test(value)) {
          throw new Error('Online URL must be a valid HTTP/HTTPS URL');
        }
        return true;
      }),

    body('maxTalks')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Maximum talks must be between 1 and 50'),

    body('talkDuration')
      .optional()
      .isInt({ min: 1, max: 60 })
      .withMessage('Talk duration must be between 1 and 60 minutes'),

    body('registrationDeadline')
      .optional()
      .isISO8601()
      .withMessage('Registration deadline must be a valid ISO 8601 date')
      .custom((value, { req }) => {
        if (value) {
          const deadline = new Date(value);
          const eventDate = new Date(req.body.eventDate);
          if (deadline >= eventDate) {
            throw new Error('Registration deadline must be before event date');
          }
        }
        return true;
      }),

    body('tags')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Tags must be an array with maximum 10 items'),

    body('tags.*')
      .optional()
      .trim()
      .isLength({ min: 1, max: 30 })
      .withMessage('Each tag must be between 1 and 30 characters')
      .matches(/^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_]+$/)
      .withMessage('Tags can only contain letters, numbers, hyphens, and underscores')
  ],

  update: [
    param('id')
      .matches(/^[a-zA-Z0-9\-_]{3,50}$/)
      .withMessage('Event ID must be alphanumeric with hyphens/underscores, 3-50 characters'),

    // All create rules but optional
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Event title must be between 5 and 100 characters'),

    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('Event description must be between 10 and 2000 characters')
      .escape(),

    body('eventDate')
      .optional()
      .isISO8601()
      .withMessage('Event date must be a valid ISO 8601 date'),

    body('venue.capacity')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Venue capacity must be between 1 and 10000')
  ]
};

// Participant validation rules
export const participantValidationRules = {
  register: [
    body('eventId')
      .matches(/^[a-zA-Z0-9\-_]{3,50}$/)
      .withMessage('Event ID must be alphanumeric with hyphens/underscores, 3-50 characters'),

    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-'.]+$/)
      .withMessage('Name contains invalid characters')
      .escape(),

    body('email')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail()
      .isLength({ max: 320 })
      .withMessage('Email address is too long'),

    body('phone')
      .optional()
      .trim()
      .matches(phonePattern)
      .withMessage('Phone number must be a valid format')
      .isLength({ min: 10, max: 15 })
      .withMessage('Phone number must be between 10 and 15 digits'),

    body('company')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Company name must not exceed 100 characters')
      .escape(),

    body('jobTitle')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Job title must not exceed 100 characters')
      .escape(),

    body('participationType')
      .isIn(['online', 'offline', 'hybrid'])
      .withMessage('Participation type must be online, offline, or hybrid'),

    body('dietaryRestrictions')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Dietary restrictions must not exceed 500 characters')
      .escape(),

    body('emergencyContact.name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Emergency contact name must be between 2 and 100 characters')
      .escape(),

    body('emergencyContact.phone')
      .optional()
      .trim()
      .matches(phonePattern)
      .withMessage('Emergency contact phone must be a valid format'),

    body('marketingConsent')
      .optional()
      .isBoolean()
      .withMessage('Marketing consent must be a boolean'),

    body('privacyConsent')
      .isBoolean()
      .withMessage('Privacy consent is required')
      .custom(value => {
        if (!value) {
          throw new Error('Privacy consent must be accepted');
        }
        return true;
      }),

    body('surveys')
      .optional()
      .isArray({ max: 10 })
      .withMessage('Surveys must be an array with maximum 10 items'),

    body('surveys.*.question')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Survey question must be between 5 and 200 characters'),

    body('surveys.*.answer')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Survey answer must not exceed 1000 characters')
  ],

  update: [
    param('id')
      .matches(/^[a-zA-Z0-9\-_]{3,50}$/)
      .withMessage('Participant ID must be alphanumeric with hyphens/underscores'),

    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .escape(),

    body('phone')
      .optional()
      .trim()
      .matches(phonePattern)
      .withMessage('Phone number must be a valid format'),

    body('participationType')
      .optional()
      .isIn(['online', 'offline', 'hybrid'])
      .withMessage('Participation type must be online, offline, or hybrid')
  ]
};

// Talk submission validation rules
export const talkValidationRules = {
  submit: [
    body('eventId')
      .matches(/^[a-zA-Z0-9\-_]{3,50}$/)
      .withMessage('Event ID must be alphanumeric with hyphens/underscores'),

    body('speakerName')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Speaker name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-'.]+$/)
      .withMessage('Speaker name contains invalid characters')
      .escape(),

    body('speakerEmail')
      .trim()
      .isEmail()
      .withMessage('Must be a valid email address')
      .normalizeEmail(),

    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Talk title must be between 5 and 100 characters')
      .matches(
        /^[a-zA-Z0-9\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF！？・（）()[\]「」『』【】〈〉《》、。,.\-_:;]+$/
      )
      .withMessage('Talk title contains invalid characters')
      .escape(),

    body('description')
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Talk description must be between 20 and 2000 characters')
      .escape(),

    body('category')
      .isIn([
        'technology',
        'business',
        'design',
        'lifestyle',
        'science',
        'education',
        'entertainment',
        'other'
      ])
      .withMessage('Category must be a valid option'),

    body('duration')
      .optional()
      .isInt({ min: 1, max: 60 })
      .withMessage('Duration must be between 1 and 60 minutes'),

    body('targetAudience')
      .isIn(['beginner', 'intermediate', 'advanced', 'all'])
      .withMessage('Target audience must be beginner, intermediate, advanced, or all'),

    body('needsProjector').optional().isBoolean().withMessage('Needs projector must be a boolean'),

    body('slides')
      .optional()
      .trim()
      .custom(value => {
        if (value && !urlPattern.test(value)) {
          throw new Error('Slides URL must be a valid HTTP/HTTPS URL');
        }
        return true;
      }),

    body('materials')
      .optional()
      .isArray({ max: 5 })
      .withMessage('Materials must be an array with maximum 5 items'),

    body('materials.*.name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Material name must be between 1 and 100 characters'),

    body('materials.*.url')
      .optional()
      .custom(value => {
        if (value && !urlPattern.test(value)) {
          throw new Error('Material URL must be valid');
        }
        return true;
      }),

    body('speakerBio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Speaker bio must not exceed 500 characters')
      .escape(),

    body('previousExperience')
      .optional()
      .isBoolean()
      .withMessage('Previous experience must be a boolean'),

    body('specialRequirements')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Special requirements must not exceed 500 characters')
      .escape()
  ],

  update: [
    param('id')
      .matches(/^[a-zA-Z0-9\-_]{3,50}$/)
      .withMessage('Talk ID must be alphanumeric with hyphens/underscores'),

    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Talk title must be between 5 and 100 characters')
      .escape(),

    body('description')
      .optional()
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Talk description must be between 20 and 2000 characters')
      .escape(),

    body('category')
      .optional()
      .isIn([
        'technology',
        'business',
        'design',
        'lifestyle',
        'science',
        'education',
        'entertainment',
        'other'
      ])
      .withMessage('Category must be a valid option')
  ]
};

// Admin validation rules
export const adminValidationRules = {
  updateParticipant: [
    param('id')
      .matches(/^[a-zA-Z0-9\-_]{3,50}$/)
      .withMessage('Participant ID must be alphanumeric with hyphens/underscores'),

    body('status')
      .optional()
      .isIn(['confirmed', 'waitlist', 'cancelled', 'attended', 'no-show'])
      .withMessage('Status must be a valid option'),

    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must not exceed 1000 characters')
      .escape(),

    body('checkedIn').optional().isBoolean().withMessage('Checked in must be a boolean'),

    body('checkedInAt')
      .optional()
      .isISO8601()
      .withMessage('Check in time must be a valid ISO 8601 date')
  ],

  updateTalk: [
    param('id')
      .matches(/^[a-zA-Z0-9\-_]{3,50}$/)
      .withMessage('Talk ID must be alphanumeric with hyphens/underscores'),

    body('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'scheduled'])
      .withMessage('Status must be pending, approved, rejected, or scheduled'),

    body('scheduledTime')
      .optional()
      .matches(timePattern)
      .withMessage('Scheduled time must be in HH:MM format'),

    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Feedback must not exceed 1000 characters')
      .escape(),

    body('rating')
      .optional()
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5')
  ]
};

// Query parameter validation
export const queryValidationRules = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),

    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),

    query('sort')
      .optional()
      .isIn(['date', 'name', 'title', 'createdAt', 'updatedAt'])
      .withMessage('Sort field must be valid'),

    query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc')
  ],

  search: [
    query('q')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters')
      .escape(),

    query('category')
      .optional()
      .isIn([
        'technology',
        'business',
        'design',
        'lifestyle',
        'science',
        'education',
        'entertainment',
        'other'
      ])
      .withMessage('Category filter must be valid'),

    query('status')
      .optional()
      .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
      .withMessage('Status filter must be valid'),

    query('dateFrom').optional().isISO8601().withMessage('Date from must be a valid ISO 8601 date'),

    query('dateTo').optional().isISO8601().withMessage('Date to must be a valid ISO 8601 date')
  ]
};

// File upload validation
export const fileValidationRules = {
  upload: [
    body('fileType')
      .isIn(['image', 'document', 'presentation'])
      .withMessage('File type must be image, document, or presentation'),

    body('fileName')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('File name must be between 1 and 255 characters')
      .matches(/^[a-zA-Z0-9\-_. ]+\.[a-zA-Z0-9]+$/)
      .withMessage('File name must have valid format'),

    body('fileSize')
      .isInt({ min: 1, max: 10485760 }) // 10MB max
      .withMessage('File size must be between 1 byte and 10MB')
  ]
};

// Rate limiting validation helpers
export const rateLimitingRules = {
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 registrations per hour per IP
    message: 'Too many registration attempts from this IP'
  },

  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes per IP
    message: 'Too many API requests from this IP'
  },

  emailSend: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 emails per hour per IP
    message: 'Too many email requests from this IP'
  },

  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts'
  }
};

export default {
  eventValidationRules,
  participantValidationRules,
  talkValidationRules,
  adminValidationRules,
  queryValidationRules,
  fileValidationRules,
  rateLimitingRules
};
