/**
 * Emergency Contacts API Routes
 * Server-side endpoints for emergency contact management and logging
 */

import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const logger = createLogger('EmergencyContacts');

// Rate limiting for emergency contacts API
const emergencyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many emergency contact requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Emergency alert rate limit (stricter)
const alertRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 alerts per 5 minutes
  message: 'Too many emergency alerts from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting
router.use(emergencyRateLimit);

// Apply authentication to all routes except logging (for emergency access)
router.use('/log', (req, res, next) => next());
router.use(authenticateToken);

/**
 * @swagger
 * components:
 *   schemas:
 *     EmergencyContact:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique contact identifier
 *         name:
 *           type: string
 *           description: Contact name or organization
 *         phone:
 *           type: string
 *           description: Emergency phone number
 *         type:
 *           type: string
 *           enum: [medical, security, fire, general, venue]
 *           description: Type of emergency service
 *         priority:
 *           type: number
 *           description: Priority level (1-3, lower is higher priority)
 *         description:
 *           type: string
 *           description: Description of the contact's role
 *         isSystem:
 *           type: boolean
 *           description: Whether this is a system-defined contact
 *         verified:
 *           type: boolean
 *           description: Whether the contact has been verified
 *         eventId:
 *           type: string
 *           description: Associated event ID (for event-specific contacts)
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/emergency-contacts/events/{eventId}:
 *   get:
 *     summary: Get emergency contacts for an event
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Emergency contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmergencyContact'
 */
router.get(
  '/events/:eventId',
  [param('eventId').isString().notEmpty().withMessage('Event ID is required')],
  async(req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { eventId } = req.params;

      // Get event to verify access
      const event = await req.app.locals.database.read('events', eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Get emergency contacts for the event
      const contacts = await req.app.locals.database.query('emergencyContacts', {
        eventId
      });

      res.json({
        success: true,
        data: contacts || []
      });

      logger.info(`Emergency contacts retrieved for event ${eventId} by user ${req.user.id}`);
    } catch (error) {
      logger.error('Error retrieving emergency contacts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve emergency contacts'
      });
    }
  }
);

/**
 * @swagger
 * /api/emergency-contacts/events/{eventId}:
 *   post:
 *     summary: Add emergency contact to an event
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: Contact name or organization
 *               phone:
 *                 type: string
 *                 description: Emergency phone number
 *               type:
 *                 type: string
 *                 enum: [medical, security, fire, general, venue]
 *               priority:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 3
 *               description:
 *                 type: string
 *               verified:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Emergency contact created successfully
 */
router.post(
  '/events/:eventId',
  [
    param('eventId').isString().notEmpty().withMessage('Event ID is required'),
    body('name')
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name is required and must be 1-100 characters'),
    body('phone')
      .isString()
      .trim()
      .matches(/^[\d\-+()s]+$/)
      .withMessage('Valid phone number is required'),
    body('type')
      .isIn(['medical', 'security', 'fire', 'general', 'venue'])
      .withMessage('Valid type is required'),
    body('priority').optional().isInt({ min: 1, max: 3 }).withMessage('Priority must be 1-3'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('verified').optional().isBoolean()
  ],
  async(req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { eventId } = req.params;
      const { name, phone, type, priority = 2, description, verified = false } = req.body;

      // Verify event exists and user has permission
      const event = await req.app.locals.database.read('events', eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found'
        });
      }

      // Check if user is admin or event organizer
      if (req.user.role !== 'admin' && event.organizerId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Create emergency contact
      const contactId = `ec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const contact = {
        id: contactId,
        eventId,
        name: name.trim(),
        phone: phone.trim(),
        type,
        priority,
        description: description?.trim(),
        verified,
        isSystem: false,
        isEvent: true,
        createdBy: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await req.app.locals.database.create('emergencyContacts', contact);

      res.status(201).json({
        success: true,
        data: contact,
        message: 'Emergency contact created successfully'
      });

      logger.info(
        `Emergency contact created: ${contactId} for event ${eventId} by user ${req.user.id}`
      );
    } catch (error) {
      logger.error('Error creating emergency contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create emergency contact'
      });
    }
  }
);

/**
 * @swagger
 * /api/emergency-contacts/{contactId}:
 *   put:
 *     summary: Update emergency contact
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [medical, security, fire, general, venue]
 *               priority:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 3
 *               description:
 *                 type: string
 *               verified:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Emergency contact updated successfully
 */
router.put(
  '/:contactId',
  [
    param('contactId').isString().notEmpty().withMessage('Contact ID is required'),
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Name must be 1-100 characters'),
    body('phone')
      .optional()
      .isString()
      .trim()
      .matches(/^[\d\-+()s]+$/)
      .withMessage('Valid phone number required'),
    body('type')
      .optional()
      .isIn(['medical', 'security', 'fire', 'general', 'venue'])
      .withMessage('Valid type required'),
    body('priority').optional().isInt({ min: 1, max: 3 }).withMessage('Priority must be 1-3'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('verified').optional().isBoolean()
  ],
  async(req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { contactId } = req.params;

      // Get existing contact
      const existingContact = await req.app.locals.database.read('emergencyContacts', contactId);
      if (!existingContact) {
        return res.status(404).json({
          success: false,
          error: 'Emergency contact not found'
        });
      }

      // Check permissions
      if (existingContact.isSystem && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Cannot modify system contacts'
        });
      }

      if (existingContact.createdBy !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Update contact
      const updates = {};
      ['name', 'phone', 'type', 'priority', 'description', 'verified'].forEach(field => {
        if (req.body[field] !== undefined) {
          updates[field] =
            typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
        }
      });

      const updatedContact = {
        ...existingContact,
        ...updates,
        updatedAt: new Date()
      };

      await req.app.locals.database.update('emergencyContacts', contactId, updatedContact);

      res.json({
        success: true,
        data: updatedContact,
        message: 'Emergency contact updated successfully'
      });

      logger.info(`Emergency contact updated: ${contactId} by user ${req.user.id}`);
    } catch (error) {
      logger.error('Error updating emergency contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update emergency contact'
      });
    }
  }
);

/**
 * @swagger
 * /api/emergency-contacts/{contactId}:
 *   delete:
 *     summary: Delete emergency contact
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Emergency contact deleted successfully
 */
router.delete(
  '/:contactId',
  [param('contactId').isString().notEmpty().withMessage('Contact ID is required')],
  async(req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { contactId } = req.params;

      // Get existing contact
      const existingContact = await req.app.locals.database.read('emergencyContacts', contactId);
      if (!existingContact) {
        return res.status(404).json({
          success: false,
          error: 'Emergency contact not found'
        });
      }

      // Check permissions
      if (existingContact.isSystem) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete system contacts'
        });
      }

      if (existingContact.createdBy !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      await req.app.locals.database.delete('emergencyContacts', contactId);

      res.json({
        success: true,
        message: 'Emergency contact deleted successfully'
      });

      logger.info(`Emergency contact deleted: ${contactId} by user ${req.user.id}`);
    } catch (error) {
      logger.error('Error deleting emergency contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete emergency contact'
      });
    }
  }
);

/**
 * @swagger
 * /api/emergency-contacts/alert:
 *   post:
 *     summary: Send emergency alert
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [medical, security, fire, general, venue]
 *               location:
 *                 type: object
 *                 properties:
 *                   lat:
 *                     type: number
 *                   lng:
 *                     type: number
 *                   accuracy:
 *                     type: number
 *               eventId:
 *                 type: string
 *               details:
 *                 type: string
 *     responses:
 *       200:
 *         description: Emergency alert sent successfully
 */
router.post(
  '/alert',
  alertRateLimit,
  [
    body('type')
      .isIn(['medical', 'security', 'fire', 'general', 'venue'])
      .withMessage('Valid alert type required'),
    body('location').optional().isObject().withMessage('Location must be an object'),
    body('location.lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Valid latitude required'),
    body('location.lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Valid longitude required'),
    body('eventId').optional().isString(),
    body('details')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('Details must be less than 1000 characters')
  ],
  async(req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { type, location, eventId, details } = req.body;
      const userId = req.user.id;

      // Create alert record
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const alert = {
        id: alertId,
        type,
        userId,
        eventId,
        location,
        details,
        status: 'active',
        createdAt: new Date(),
        userAgent: req.headers['user-agent']
      };

      await req.app.locals.database.create('emergencyAlerts', alert);

      // Get relevant emergency contacts for notification
      const contacts = [];

      if (eventId) {
        const eventContacts = await req.app.locals.database.query('emergencyContacts', {
          eventId,
          type
        });
        contacts.push(...(eventContacts || []));
      }

      // Get system contacts for this type
      const systemContacts = await req.app.locals.database.query('emergencyContacts', {
        isSystem: true,
        type
      });
      contacts.push(...(systemContacts || []));

      // Send notifications (implement notification service integration here)
      const notificationData = {
        type: 'emergency_alert',
        alertId,
        alertType: type,
        userId,
        userName: req.user.name || req.user.email,
        location,
        eventId,
        details,
        contacts: contacts.map(c => ({ name: c.name, phone: c.phone })),
        timestamp: new Date().toISOString()
      };

      // Send to notification service if available
      if (req.app.locals.notificationService) {
        try {
          await req.app.locals.notificationService.sendEmergencyAlert(notificationData);
        } catch (notificationError) {
          logger.error('Error sending emergency notification:', notificationError);
          // Continue with response even if notification fails
        }
      }

      res.json({
        success: true,
        data: {
          alertId,
          message: 'Emergency alert sent successfully',
          contactsNotified: contacts.length
        }
      });

      logger.warn(`EMERGENCY ALERT: ${type} alert sent by user ${userId}`, {
        alertId,
        type,
        location,
        eventId,
        details: details?.substring(0, 100)
      });
    } catch (error) {
      logger.error('Error sending emergency alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send emergency alert'
      });
    }
  }
);

/**
 * @swagger
 * /api/emergency-contacts/log:
 *   post:
 *     summary: Log emergency action (public endpoint for emergency access)
 *     tags: [Emergency Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - data
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [call, location_share, alert_sent, contact_view]
 *               data:
 *                 type: object
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Action logged successfully
 */
router.post(
  '/log',
  [
    body('action')
      .isIn(['call', 'location_share', 'alert_sent', 'contact_view'])
      .withMessage('Valid action required'),
    body('data').isObject().withMessage('Data object required'),
    body('timestamp').optional().isISO8601().withMessage('Valid timestamp required'),
    body('eventId').optional().isString()
  ],
  async(req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { action, data, timestamp, eventId } = req.body;

      // Create log entry
      const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const logEntry = {
        id: logId,
        action,
        data,
        eventId,
        timestamp: timestamp || new Date().toISOString(),
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        createdAt: new Date()
      };

      await req.app.locals.database.create('emergencyLogs', logEntry);

      res.json({
        success: true,
        message: 'Action logged successfully'
      });

      // Log emergency actions at appropriate level
      const logLevel = action === 'call' || action === 'alert_sent' ? 'warn' : 'info';
      logger[logLevel](`Emergency action logged: ${action}`, {
        logId,
        action,
        eventId,
        ip: req.ip
      });
    } catch (error) {
      logger.error('Error logging emergency action:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to log action'
      });
    }
  }
);

/**
 * @swagger
 * /api/emergency-contacts/verify/{contactId}:
 *   post:
 *     summary: Verify emergency contact
 *     tags: [Emergency Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *         description: Contact ID
 *     responses:
 *       200:
 *         description: Contact verification status updated
 */
router.post(
  '/verify/:contactId',
  [param('contactId').isString().notEmpty().withMessage('Contact ID is required')],
  async(req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { contactId } = req.params;

      // Get existing contact
      const existingContact = await req.app.locals.database.read('emergencyContacts', contactId);
      if (!existingContact) {
        return res.status(404).json({
          success: false,
          error: 'Emergency contact not found'
        });
      }

      // Only admins and contact creators can verify
      if (existingContact.createdBy !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      // Update verification status
      const updatedContact = {
        ...existingContact,
        verified: true,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        updatedAt: new Date()
      };

      await req.app.locals.database.update('emergencyContacts', contactId, updatedContact);

      res.json({
        success: true,
        data: updatedContact,
        message: 'Contact verification updated successfully'
      });

      logger.info(`Emergency contact verified: ${contactId} by user ${req.user.id}`);
    } catch (error) {
      logger.error('Error verifying emergency contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify contact'
      });
    }
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  logger.error('Emergency contacts route error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

export default router;
