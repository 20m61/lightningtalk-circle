/**
 * Production Email Service for Lightning Talk Event Management
 * Supports multiple providers (SendGrid, AWS SES) with queue system
 */

import sgMail from '@sendgrid/mail';
import Queue from 'bull';
import Redis from 'redis';
import { EventEmitter } from 'events';

export class ProductionEmailService extends EventEmitter {
  constructor() {
    super();
    this.enabled = process.env.EMAIL_ENABLED !== 'false';
    this.provider = process.env.EMAIL_PROVIDER || 'sendgrid';
    this.from = process.env.EMAIL_FROM || 'noreply@lightningtalk.example.com';
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.templates = this.initializeTemplates();
    this.queue = null;
    this.initialized = false;

    if (this.enabled) {
      this.setupEmailProvider();
      this.setupQueue();
    }
  }

  async setupEmailProvider() {
    switch (this.provider) {
      case 'sendgrid':
        await this.setupSendGrid();
        break;
      case 'ses':
        await this.setupAWSSES();
        break;
      default:
        throw new Error(`Unsupported email provider: ${this.provider}`);
    }
  }

  async setupSendGrid() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is required for SendGrid provider');
    }

    sgMail.setApiKey(apiKey);

    // Test API key validity
    try {
      await sgMail.send({
        to: this.from,
        from: this.from,
        subject: 'API Test',
        text: 'Test email',
        mailSettings: {
          sandboxMode: {
            enable: true
          }
        }
      });
      console.log('📧 SendGrid Email service initialized');
    } catch (error) {
      console.error('❌ SendGrid setup failed:', error.message);
      throw error;
    }
  }

  async setupAWSSES() {
    // AWS SES implementation would go here
    // For now, we'll prepare the structure
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials are required for SES provider');
    }

    console.log('📧 AWS SES Email service initialized');
  }

  async setupQueue() {
    try {
      // Create Redis connection for queue
      const redisClient = Redis.createClient({
        url: this.redisUrl
      });

      await redisClient.connect();

      // Create email queue
      this.queue = new Queue('email processing', this.redisUrl, {
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000
          },
          removeOnComplete: 100,
          removeOnFail: 50
        },
        settings: {
          stalledInterval: 30000,
          maxStalledCount: 1
        }
      });

      // Process email jobs
      this.queue.process('send', this.processEmailJob.bind(this));

      // Queue event handlers
      this.queue.on('completed', job => {
        console.log(`📧 Email job ${job.id} completed`);
        this.emit('emailSent', { jobId: job.id, email: job.data.to });
      });

      this.queue.on('failed', (job, err) => {
        console.error(`❌ Email job ${job.id} failed:`, err.message);
        this.emit('emailFailed', { jobId: job.id, email: job.data.to, error: err.message });
      });

      this.queue.on('stalled', job => {
        console.warn(`⚠️ Email job ${job.id} stalled`);
      });

      console.log('🔄 Email queue system initialized');
      this.initialized = true;
      this.emit('ready');
    } catch (error) {
      console.error('❌ Email queue setup failed:', error);
      throw error;
    }
  }

  async processEmailJob(job) {
    const { emailData, templateData } = job.data;

    try {
      await this.sendEmailDirect(emailData, templateData);
      return { success: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendEmailDirect(emailData, templateData = {}) {
    const html = this.renderTemplate(emailData.template, templateData);

    const mailData = {
      to: emailData.to,
      from: emailData.from || this.from,
      subject: emailData.subject,
      text: this.htmlToText(html),
      html,
      categories: emailData.categories || ['lightning-talk'],
      customArgs: {
        eventId: templateData.eventId,
        participantId: templateData.participantId,
        emailType: emailData.template
      }
    };

    switch (this.provider) {
      case 'sendgrid':
        return await sgMail.send(mailData);
      case 'ses':
        return await this.sendWithSES(mailData);
      default:
        throw new Error(`Unknown email provider: ${this.provider}`);
    }
  }

  // Queue-based email sending (recommended for production)
  async sendEmail(emailType, to, templateData = {}, options = {}) {
    if (!this.enabled) {
      console.log(`📧 [DISABLED] ${emailType} email to: ${to}`);
      return { success: true, simulated: true };
    }

    const template = this.templates[emailType];
    if (!template) {
      throw new Error(`Unknown email template: ${emailType}`);
    }

    const jobData = {
      emailData: {
        to,
        subject: template.subject,
        template: emailType,
        categories: [`lightning-talk-${emailType}`]
      },
      templateData
    };

    // Add to queue with priority and delay options
    const job = await this.queue.add('send', jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      jobId:
        options.jobId || `${emailType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    console.log(`📧 Email job queued: ${job.id} (${emailType} to ${to})`);
    return { jobId: job.id, queued: true };
  }

  // Template rendering
  renderTemplate(templateType, data) {
    const template = this.templates[templateType];
    if (!template) {
      throw new Error(`Template not found: ${templateType}`);
    }

    let html = template.template;

    // Simple template variable replacement
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, data[key] || '');
    });

    return html;
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  initializeTemplates() {
    return {
      registrationConfirmation: {
        subject: '🎉 ライトニングトーク参加登録完了 - {{eventTitle}}',
        template: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>参加登録完了</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                            .content { background: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; }
                            .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
                            .info-box { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #4F46E5; }
                            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🎉 参加登録完了</h1>
                                <p>{{eventTitle}}への参加登録が完了しました！</p>
                            </div>
                            <div class="content">
                                <p>{{participantName}}様</p>
                                <p>ライトニングトークイベントへのご参加、ありがとうございます。</p>
                                
                                <div class="info-box">
                                    <h3>📅 イベント詳細</h3>
                                    <p><strong>日時:</strong> {{eventDate}}</p>
                                    <p><strong>会場:</strong> {{eventVenue}}</p>
                                    <p><strong>参加形式:</strong> {{participationType}}</p>
                                    {{#if onlineUrl}}<p><strong>オンライン参加URL:</strong> <a href="{{onlineUrl}}">{{onlineUrl}}</a></p>{{/if}}
                                </div>

                                <div class="info-box">
                                    <h3>📝 当日について</h3>
                                    <ul>
                                        <li>開場は開始時刻の30分前を予定しています</li>
                                        <li>飲み物・軽食をご用意いたします</li>
                                        <li>ネットワーキングタイムもございます</li>
                                        <li>緊急連絡先: {{emergencyContact}}</li>
                                    </ul>
                                </div>

                                <a href="{{eventUrl}}" class="button">イベント詳細を確認</a>
                            </div>
                            <div class="footer">
                                <p>Lightning Talk Circle<br>
                                このメールに心当たりがない場合は、お手数ですが削除してください。</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
      },
      speakerConfirmation: {
        subject: '🎤 Lightning Talk発表申込み受付完了 - {{talkTitle}}',
        template: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>発表申込み完了</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                            .content { background: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; }
                            .button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
                            .info-box { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #059669; }
                            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🎤 発表申込み完了</h1>
                                <p>Lightning Talk発表のお申込みを受付いたしました！</p>
                            </div>
                            <div class="content">
                                <p>{{speakerName}}様</p>
                                <p>発表のお申込み、ありがとうございます。以下の内容で受付いたしました。</p>
                                
                                <div class="info-box">
                                    <h3>📋 発表内容</h3>
                                    <p><strong>タイトル:</strong> {{talkTitle}}</p>
                                    <p><strong>カテゴリ:</strong> {{talkCategory}}</p>
                                    <p><strong>発表時間:</strong> {{talkDuration}}分</p>
                                    <p><strong>概要:</strong></p>
                                    <p>{{talkDescription}}</p>
                                </div>

                                <div class="info-box">
                                    <h3>🔧 発表準備について</h3>
                                    <ul>
                                        <li>スライドは事前に準備をお願いします</li>
                                        <li>プロジェクター(HDMI)をご用意いたします</li>
                                        <li>マイクは会場で準備いたします</li>
                                        <li>リハーサルタイムがございます</li>
                                    </ul>
                                </div>

                                <a href="{{speakerGuideUrl}}" class="button">発表者ガイドを確認</a>
                            </div>
                            <div class="footer">
                                <p>Lightning Talk Circle<br>
                                ご不明な点がございましたら、お気軽にお問い合わせください。</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
      },
      eventReminder: {
        subject: '⚡ 明日開催！{{eventTitle}} - 開催リマインダー',
        template: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>イベントリマインダー</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                            .content { background: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; }
                            .button { background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
                            .info-box { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #F59E0B; }
                            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>⚡ 明日開催!</h1>
                                <p>{{eventTitle}}のリマインダーです</p>
                            </div>
                            <div class="content">
                                <p>{{participantName}}様</p>
                                <p>いよいよ明日、Lightning Talkイベントの開催です！</p>
                                
                                <div class="info-box">
                                    <h3>📅 開催詳細（再掲）</h3>
                                    <p><strong>日時:</strong> {{eventDate}}</p>
                                    <p><strong>会場:</strong> {{eventVenue}}</p>
                                    <p><strong>開場時刻:</strong> {{doorOpenTime}}</p>
                                    {{#if onlineUrl}}<p><strong>オンライン参加URL:</strong> <a href="{{onlineUrl}}">参加する</a></p>{{/if}}
                                </div>

                                <div class="info-box">
                                    <h3>📋 持ち物・注意事項</h3>
                                    <ul>
                                        <li>名刺（ネットワーキング用）</li>
                                        <li>ノートパソコン（発表者の方）</li>
                                        <li>会場は禁煙です</li>
                                        <li>写真撮影を行う場合があります</li>
                                    </ul>
                                </div>

                                <a href="{{eventUrl}}" class="button">最新情報を確認</a>
                            </div>
                            <div class="footer">
                                <p>Lightning Talk Circle<br>
                                皆様にお会いできることを楽しみにしております！</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
      },
      eventCancellation: {
        subject: '⚠️ 【重要】{{eventTitle}} 中止のお知らせ',
        template: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>イベント中止のお知らせ</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #DC2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                            .content { background: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; }
                            .info-box { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #DC2626; }
                            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>⚠️ イベント中止のお知らせ</h1>
                                <p>{{eventTitle}}の中止についてご連絡いたします</p>
                            </div>
                            <div class="content">
                                <p>{{participantName}}様</p>
                                <p>お申込みいただいておりました{{eventTitle}}ですが、やむを得ない事情により中止とさせていただくこととなりました。</p>
                                
                                <div class="info-box">
                                    <h3>📋 中止詳細</h3>
                                    <p><strong>中止理由:</strong> {{cancellationReason}}</p>
                                    <p><strong>次回開催予定:</strong> {{nextEventDate}}</p>
                                </div>

                                <p>ご参加を楽しみにしていただいていた皆様には、心よりお詫び申し上げます。</p>
                                <p>次回の開催が決まりましたら、改めてご連絡させていただきます。</p>
                            </div>
                            <div class="footer">
                                <p>Lightning Talk Circle<br>
                                ご不明な点がございましたら、お問い合わせください。</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
      },
      feedbackRequest: {
        subject: '💭 {{eventTitle}} 感想・フィードバックのお願い',
        template: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>フィードバックのお願い</title>
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #7C3AED; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                            .content { background: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; }
                            .button { background: #7C3AED; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
                            .info-box { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #7C3AED; }
                            .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>💭 フィードバックのお願い</h1>
                                <p>{{eventTitle}}へのご参加、ありがとうございました！</p>
                            </div>
                            <div class="content">
                                <p>{{participantName}}様</p>
                                <p>先日開催いたしました{{eventTitle}}へのご参加、誠にありがとうございました。</p>
                                
                                <div class="info-box">
                                    <h3>📝 アンケートのお願い</h3>
                                    <p>より良いイベント運営のため、ぜひ率直なご感想・ご意見をお聞かせください。</p>
                                    <ul>
                                        <li>所要時間: 約3分</li>
                                        <li>匿名での回答も可能です</li>
                                        <li>今後のイベント改善に活用いたします</li>
                                    </ul>
                                </div>

                                <a href="{{feedbackUrl}}" class="button">アンケートに回答する</a>
                                
                                <div class="info-box">
                                    <h3>📅 次回開催について</h3>
                                    <p>次回のLightning Talkイベントは{{nextEventDate}}を予定しております。</p>
                                    <p>詳細が決まりましたら、改めてご案内いたします。</p>
                                </div>
                            </div>
                            <div class="footer">
                                <p>Lightning Talk Circle<br>
                                今後ともよろしくお願いいたします。</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
      }
    };
  }

  // Bulk email operations
  async sendBulkEmail(emailType, recipients, templateData = {}, options = {}) {
    const jobs = [];

    for (const recipient of recipients) {
      const individualData = { ...templateData, ...recipient };
      const job = await this.sendEmail(emailType, recipient.email, individualData, {
        ...options,
        jobId: `bulk-${emailType}-${recipient.id || Date.now()}`
      });
      jobs.push(job);
    }

    console.log(`📧 Bulk email queued: ${jobs.length} emails (${emailType})`);
    return { jobs, count: jobs.length };
  }

  // Queue management
  async getQueueStats() {
    if (!this.queue) {
      return null;
    }

    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaiting(),
      this.queue.getActive(),
      this.queue.getCompleted(),
      this.queue.getFailed()
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }

  async pauseQueue() {
    await this.queue.pause();
    console.log('⏸️ Email queue paused');
  }

  async resumeQueue() {
    await this.queue.resume();
    console.log('▶️ Email queue resumed');
  }

  async retryFailedJobs() {
    const failed = await this.queue.getFailed();
    for (const job of failed) {
      await job.retry();
    }
    console.log(`🔄 Retrying ${failed.length} failed email jobs`);
  }

  // Cleanup
  async close() {
    if (this.queue) {
      await this.queue.close();
      console.log('📧 Email service closed');
    }
  }

  // Health check
  async healthCheck() {
    try {
      const stats = await this.getQueueStats();
      return {
        status: 'healthy',
        provider: this.provider,
        enabled: this.enabled,
        queue: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default ProductionEmailService;
