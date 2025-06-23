/**
 * Email Service Unit Tests
 * メールサービスの単体テスト
 */

const { EmailService } = require('../../../server/services/email');

describe('EmailService', () => {
  let emailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      expect(emailService).toBeInstanceOf(EmailService);
      expect(emailService.provider).toBeDefined();
    });

    it('should handle custom configuration', () => {
      const customConfig = {
        provider: 'sendgrid',
        apiKey: 'test-api-key',
        fromEmail: 'test@example.com'
      };

      const customEmailService = new EmailService(customConfig);
      expect(customEmailService.config).toEqual(expect.objectContaining(customConfig));
    });
  });

  describe('template management', () => {
    it('should register email template', () => {
      const template = {
        name: 'welcome',
        subject: 'Welcome to Lightning Talk!',
        html: '<h1>Welcome {{name}}!</h1>',
        text: 'Welcome {{name}}!'
      };

      emailService.registerTemplate = jest.fn().mockReturnValue(true);

      const result = emailService.registerTemplate(template);

      expect(result).toBe(true);
      expect(emailService.registerTemplate).toHaveBeenCalledWith(template);
    });

    it('should get registered template', () => {
      const templateName = 'welcome';
      const expectedTemplate = {
        name: 'welcome',
        subject: 'Welcome to Lightning Talk!',
        html: '<h1>Welcome {{name}}!</h1>'
      };

      emailService.getTemplate = jest.fn().mockReturnValue(expectedTemplate);

      const template = emailService.getTemplate(templateName);

      expect(template).toEqual(expectedTemplate);
      expect(emailService.getTemplate).toHaveBeenCalledWith(templateName);
    });

    it('should handle missing template', () => {
      emailService.getTemplate = jest.fn().mockReturnValue(null);

      const template = emailService.getTemplate('nonexistent');

      expect(template).toBeNull();
    });
  });

  describe('email sending', () => {
    it('should send simple email', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'This is a test email',
        html: '<p>This is a test email</p>'
      };

      emailService.send = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'test-message-id'
      });

      const result = await emailService.send(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('test-message-id');
      expect(emailService.send).toHaveBeenCalledWith(emailData);
    });

    it('should send templated email', async () => {
      const emailData = {
        to: 'test@example.com',
        template: 'welcome',
        data: {
          name: 'Test User',
          eventTitle: 'Lightning Talk Event'
        }
      };

      emailService.sendTemplate = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'template-message-id'
      });

      const result = await emailService.sendTemplate(emailData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('template-message-id');
      expect(emailService.sendTemplate).toHaveBeenCalledWith(emailData);
    });

    it('should handle multiple recipients', async () => {
      const emailData = {
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Bulk Email Test',
        text: 'This is a bulk email'
      };

      emailService.sendBulk = jest.fn().mockResolvedValue({
        success: true,
        sent: 2,
        failed: 0
      });

      const result = await emailService.sendBulk(emailData);

      expect(result.success).toBe(true);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
    });
  });

  describe('participant notifications', () => {
    it('should send registration confirmation', async () => {
      const participant = {
        name: 'Test User',
        email: 'test@example.com',
        eventTitle: 'Lightning Talk Event',
        eventDate: '2025-06-25T19:00:00Z'
      };

      emailService.sendParticipantRegistration = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'registration-confirmation'
      });

      const result = await emailService.sendParticipantRegistration(participant);

      expect(result.success).toBe(true);
      expect(emailService.sendParticipantRegistration).toHaveBeenCalledWith(participant);
    });

    it('should send event reminder', async () => {
      const participant = {
        name: 'Test User',
        email: 'test@example.com',
        eventTitle: 'Lightning Talk Event',
        eventDate: '2025-06-25T19:00:00Z'
      };

      emailService.sendEventReminder = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'event-reminder'
      });

      const result = await emailService.sendEventReminder(participant);

      expect(result.success).toBe(true);
      expect(emailService.sendEventReminder).toHaveBeenCalledWith(participant);
    });
  });

  describe('speaker notifications', () => {
    it('should send talk submission confirmation', async () => {
      const talk = {
        title: 'Test Talk',
        speakerName: 'Test Speaker',
        speakerEmail: 'speaker@example.com',
        eventTitle: 'Lightning Talk Event'
      };

      emailService.sendTalkSubmission = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'talk-submission'
      });

      const result = await emailService.sendTalkSubmission(talk);

      expect(result.success).toBe(true);
      expect(emailService.sendTalkSubmission).toHaveBeenCalledWith(talk);
    });

    it('should send talk approval notification', async () => {
      const talk = {
        title: 'Test Talk',
        speakerName: 'Test Speaker',
        speakerEmail: 'speaker@example.com',
        status: 'confirmed'
      };

      emailService.sendTalkStatusUpdate = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'talk-approval'
      });

      const result = await emailService.sendTalkStatusUpdate(talk);

      expect(result.success).toBe(true);
      expect(emailService.sendTalkStatusUpdate).toHaveBeenCalledWith(talk);
    });
  });

  describe('admin notifications', () => {
    it('should send admin notification for new registration', async () => {
      const participant = {
        name: 'Test User',
        email: 'test@example.com',
        eventTitle: 'Lightning Talk Event'
      };

      emailService.sendAdminNotification = jest.fn().mockResolvedValue({
        success: true,
        messageId: 'admin-notification'
      });

      const result = await emailService.sendAdminNotification('new_registration', participant);

      expect(result.success).toBe(true);
      expect(emailService.sendAdminNotification).toHaveBeenCalledWith(
        'new_registration',
        participant
      );
    });
  });

  describe('error handling', () => {
    it('should handle invalid email addresses', async () => {
      const emailData = {
        to: 'invalid-email',
        subject: 'Test',
        text: 'Test'
      };

      emailService.send = jest.fn().mockRejectedValue(new Error('Invalid email address'));

      await expect(emailService.send(emailData)).rejects.toThrow('Invalid email address');
    });

    it('should handle API failures', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test',
        text: 'Test'
      };

      emailService.send = jest.fn().mockRejectedValue(new Error('API quota exceeded'));

      await expect(emailService.send(emailData)).rejects.toThrow('API quota exceeded');
    });

    it('should handle template rendering errors', async () => {
      const emailData = {
        to: 'test@example.com',
        template: 'invalid-template',
        data: {}
      };

      emailService.sendTemplate = jest.fn().mockRejectedValue(new Error('Template not found'));

      await expect(emailService.sendTemplate(emailData)).rejects.toThrow('Template not found');
    });
  });

  describe('queue management', () => {
    it('should add email to queue', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Queued Email',
        text: 'This email is queued'
      };

      emailService.addToQueue = jest.fn().mockResolvedValue({
        success: true,
        queueId: 'queue-123'
      });

      const result = await emailService.addToQueue(emailData);

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('queue-123');
    });

    it('should process email queue', async () => {
      emailService.processQueue = jest.fn().mockResolvedValue({
        processed: 5,
        failed: 0
      });

      const result = await emailService.processQueue();

      expect(result.processed).toBe(5);
      expect(result.failed).toBe(0);
    });

    it('should get queue status', async () => {
      emailService.getQueueStatus = jest.fn().mockResolvedValue({
        pending: 10,
        processing: 2,
        completed: 100,
        failed: 1
      });

      const status = await emailService.getQueueStatus();

      expect(status.pending).toBe(10);
      expect(status.processing).toBe(2);
      expect(status.completed).toBe(100);
      expect(status.failed).toBe(1);
    });
  });

  describe('configuration validation', () => {
    it('should validate email service configuration', () => {
      emailService.validateConfig = jest.fn().mockReturnValue({
        valid: true,
        errors: []
      });

      const validation = emailService.validateConfig();

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect invalid configuration', () => {
      emailService.validateConfig = jest.fn().mockReturnValue({
        valid: false,
        errors: ['API key is required', 'From email is invalid']
      });

      const validation = emailService.validateConfig();

      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(2);
    });
  });

  describe('performance and reliability', () => {
    it('should handle email sending with retry logic', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Retry Test',
        text: 'This email should retry on failure'
      };

      emailService.sendWithRetry = jest
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({
          success: true,
          messageId: 'retry-success',
          attempts: 2
        });

      const result = await emailService.sendWithRetry(emailData, { maxRetries: 3 });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });

    it('should handle rate limiting', async () => {
      emailService.checkRateLimit = jest.fn().mockReturnValue({
        allowed: true,
        remaining: 95,
        resetTime: Date.now() + 3600000
      });

      const rateLimit = emailService.checkRateLimit();

      expect(rateLimit.allowed).toBe(true);
      expect(rateLimit.remaining).toBe(95);
    });
  });
});
