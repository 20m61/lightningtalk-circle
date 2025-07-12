/**
 * Email Service for Lightning Talk Event Management
 * Handles all email communications with real email provider integration
 */

import nodemailer from 'nodemailer';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('email-service');

export class EmailService {
  constructor(config = {}) {
    this.enabled = process.env.EMAIL_ENABLED === 'true';
    this.from = config.fromEmail || process.env.EMAIL_FROM || 'noreply@lightningtalk.example.com';
    this.templates = this.initializeTemplates();
    this.provider = config.provider || process.env.EMAIL_SERVICE || 'mock';
    this.config = {
      provider: this.provider,
      fromEmail: this.from,
      ...config
    };

    if (this.enabled) {
      this.setupEmailProvider();
    } else {
      logger.info('📧 Email service disabled (simulation mode)');
    }
  }

  setupEmailProvider() {
    try {
      switch (this.provider.toLowerCase()) {
        case 'gmail':
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD
            }
          });
          logger.info('📧 Email service initialized with Gmail');
          break;

        case 'sendgrid':
          this.transporter = nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            secure: false,
            auth: {
              user: 'apikey',
              pass: process.env.SENDGRID_API_KEY
            }
          });
          logger.info('📧 Email service initialized with SendGrid');
          break;

        case 'aws-ses':
          this.transporter = nodemailer.createTransport({
            host: process.env.AWS_SES_REGION
              ? `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`
              : 'email-smtp.us-east-1.amazonaws.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.AWS_SES_USERNAME,
              pass: process.env.AWS_SES_PASSWORD
            }
          });
          logger.info('📧 Email service initialized with AWS SES');
          break;

        case 'smtp':
          this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASSWORD
            }
          });
          logger.info('📧 Email service initialized with custom SMTP');
          break;

        case 'mailgun':
          this.transporter = nodemailer.createTransport({
            host: process.env.MAILGUN_SMTP_HOST || 'smtp.mailgun.org',
            port: process.env.MAILGUN_SMTP_PORT || 587,
            secure: false,
            auth: {
              user: process.env.MAILGUN_SMTP_USER,
              pass: process.env.MAILGUN_SMTP_PASSWORD
            }
          });
          logger.info('📧 Email service initialized with Mailgun');
          break;

        default:
          logger.warn('📧 Email service in mock mode - no real emails will be sent');
          this.transporter = null;
      }

      // Verify transporter configuration
      if (this.transporter) {
        this.transporter.verify((error, success) => {
          if (error) {
            logger.error('📧 Email service configuration error:', error);
          } else {
            logger.info('📧 Email service ready to send messages');
          }
        });
      }
    } catch (error) {
      logger.error('📧 Failed to setup email provider:', error);
      this.transporter = null;
    }
  }

  initializeTemplates() {
    return {
      registrationConfirmation: {
        subject: '🎉 ライトニングトーク参加登録完了',
        template: this.getRegistrationConfirmationTemplate()
      },
      speakerConfirmation: {
        subject: '🎤 発表申込み受付完了',
        template: this.getSpeakerConfirmationTemplate()
      },
      eventReminder: {
        subject: '⚡ ライトニングトーク開催間近のお知らせ',
        template: this.getEventReminderTemplate()
      },
      eventCancellation: {
        subject: '⚠️ イベント中止のお知らせ',
        template: this.getEventCancellationTemplate()
      },
      feedbackRequest: {
        subject: '💭 イベントの感想をお聞かせください',
        template: this.getFeedbackRequestTemplate()
      }
    };
  }

  async sendRegistrationConfirmation(participant, event) {
    const template = this.templates.registrationConfirmation;
    const html = template.template
      .replace(/{{participantName}}/g, participant.name)
      .replace(/{{eventTitle}}/g, event.title)
      .replace(/{{eventDate}}/g, this.formatDate(event.date))
      .replace(/{{eventVenue}}/g, event.venue.name)
      .replace(
        /{{participationType}}/g,
        this.formatParticipationType(participant.participationType)
      )
      .replace(/{{onlineUrl}}/g, event.venue.onlineUrl || '');

    await this.sendEmail({
      to: participant.email,
      subject: template.subject,
      html
    });
  }

  async sendSpeakerConfirmation(participant, talk, event) {
    const template = this.templates.speakerConfirmation;
    const html = template.template
      .replace(/{{speakerName}}/g, participant.name)
      .replace(/{{talkTitle}}/g, talk.title)
      .replace(/{{eventTitle}}/g, event.title)
      .replace(/{{eventDate}}/g, this.formatDate(event.date))
      .replace(/{{talkDuration}}/g, talk.duration)
      .replace(/{{category}}/g, this.formatCategory(talk.category));

    await this.sendEmail({
      to: participant.email,
      subject: template.subject,
      html
    });
  }

  async sendEventReminder(participant, event) {
    const daysUntil = Math.ceil(
      Math.abs((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24))
    );
    const template = this.templates.eventReminder;
    const html = template.template
      .replace(/{{participantName}}/g, participant.name)
      .replace(/{{eventTitle}}/g, event.title)
      .replace(/{{eventDate}}/g, this.formatDate(event.date))
      .replace(/{{daysUntil}}/g, daysUntil)
      .replace(/{{eventVenue}}/g, event.venue.name)
      .replace(/{{onlineUrl}}/g, event.venue.onlineUrl || '');

    await this.sendEmail({
      to: participant.email,
      subject: template.subject,
      html
    });
  }

  async sendEventCancellation(participant, event, reason = '') {
    const template = this.templates.eventCancellation;
    const html = template.template
      .replace(/{{participantName}}/g, participant.name)
      .replace(/{{eventTitle}}/g, event.title)
      .replace(/{{eventDate}}/g, this.formatDate(event.date))
      .replace(/{{reason}}/g, reason || '諸事情により');

    await this.sendEmail({
      to: participant.email,
      subject: template.subject,
      html
    });
  }

  async sendFeedbackRequest(participant, event) {
    const template = this.templates.feedbackRequest;
    const html = template.template
      .replace(/{{participantName}}/g, participant.name)
      .replace(/{{eventTitle}}/g, event.title)
      .replace(/{{feedbackUrl}}/g, process.env.FEEDBACK_URL || 'https://forms.google.com/feedback');

    await this.sendEmail({
      to: participant.email,
      subject: template.subject,
      html
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.enabled) {
        logger.info(`📧 [SIMULATED] Email to: ${to}, Subject: ${subject}`);
        return {
          success: true,
          messageId: `mock-${Date.now()}`,
          simulated: true
        };
      }

      if (!this.transporter) {
        logger.warn(`📧 [MOCK MODE] Email to: ${to}, Subject: ${subject}`);
        return {
          success: true,
          messageId: `mock-${Date.now()}`,
          mock: true
        };
      }

      logger.info(`📧 Sending email to: ${to}`);

      const mailOptions = {
        from: this.from,
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`📧 Email sent successfully: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      logger.error('📧 Failed to send email:', error);
      throw error;
    }
  }

  /**
   * メール送信をリトライ付きで実行
   * @param {object} emailData - 送信データ
   * @param {object} [options] - オプション（maxRetriesなど）
   * @returns {Promise<{success: boolean, messageId?: string, attempts: number}>}
   */
  async sendWithRetry(emailData, options = {}) {
    const maxRetries = options.maxRetries ?? 3;
    const retryDelay = options.retryDelay ?? 1000;
    let attempts = 0;
    let lastError;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const result = await this.sendEmail(emailData);
        if (result && result.success) {
          return { ...result, attempts };
        }
        lastError = new Error('Unknown send failure');
      } catch (err) {
        lastError = err;
        logger.warn(`📧 Email send attempt ${attempts} failed:`, err.message);

        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
        }
      }
    }

    throw Object.assign(lastError || new Error('Failed to send email'), { attempts });
  }

  /**
   * バッチメール送信
   * @param {Array} recipients - 受信者リスト
   * @param {Function} templateFn - テンプレート生成関数
   * @param {object} options - オプション
   * @returns {Promise<Array>} 送信結果
   */
  async sendBatch(recipients, templateFn, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;
    const delayBetweenBatches = options.delayBetweenBatches || 1000;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async recipient => {
          try {
            const emailData = await templateFn(recipient);
            return await this.sendWithRetry(emailData, options);
          } catch (error) {
            return {
              success: false,
              error: error.message,
              recipient: recipient.email
            };
          }
        })
      );

      results.push(...batchResults);

      // Delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return results;
  }

  /**
   * Convert HTML to plain text
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  // Email templates
  getRegistrationConfirmationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>参加登録完了</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ なんでもライトニングトーク</h1>
            <p>参加登録が完了しました！</p>
        </div>
        <div class="content">
            <p>{{participantName}} さん</p>
            <p>この度は「{{eventTitle}}」にご参加いただき、ありがとうございます！</p>

            <div class="info-box">
                <h3>📅 イベント詳細</h3>
                <p><strong>日時:</strong> {{eventDate}}</p>
                <p><strong>会場:</strong> {{eventVenue}}</p>
                <p><strong>参加方法:</strong> {{participationType}}</p>
            </div>

            <p>当日は5分間のライトニングトークを通じて、様々な「なんでも」な話をお楽しみください！</p>
            <p>ご質問がございましたら、お気軽にお問い合わせください。</p>

            <div class="footer">
                <p>なんでもライトニングトーク運営チーム</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
  }

  getSpeakerConfirmationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>発表申込み完了</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(45deg, #FF6B6B, #FFD93D); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .talk-info { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #FF6B6B; }
        .tips { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎤 発表申込み完了</h1>
            <p>ライトニングトーク発表者として登録されました！</p>
        </div>
        <div class="content">
            <p>{{speakerName}} さん</p>
            <p>発表申込みありがとうございます！あなたの「なんでも」な話を楽しみにしています。</p>

            <div class="talk-info">
                <h3>🗣️ 発表内容</h3>
                <p><strong>タイトル:</strong> {{talkTitle}}</p>
                <p><strong>カテゴリー:</strong> {{category}}</p>
                <p><strong>発表時間:</strong> {{talkDuration}}分</p>
            </div>

            <div class="tips">
                <h4>💡 発表のコツ</h4>
                <ul>
                    <li>結論から話すと聞き手にとって分かりやすいです</li>
                    <li>体験談を交えると親しみやすくなります</li>
                    <li>{{talkDuration}}分は意外と短いので、要点を絞りましょう</li>
                    <li>完璧を目指さず、楽しく話してください！</li>
                </ul>
            </div>

            <p>当日まで何かご質問がございましたら、お気軽にお問い合わせください。</p>

            <div class="footer">
                <p>なんでもライトニングトーク運営チーム</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
  }

  getEventReminderTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>イベント開催間近</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #87CEEB 0%, #4169E1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .countdown { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; border: 2px solid #4169E1; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚡ もうすぐ開催！</h1>
            <p>ライトニングトークまであと{{daysUntil}}日</p>
        </div>
        <div class="content">
            <p>{{participantName}} さん</p>
            <p>「{{eventTitle}}」の開催が近づいてまいりました！</p>

            <div class="countdown">
                <h2>📅 {{eventDate}}</h2>
                <p><strong>会場:</strong> {{eventVenue}}</p>
                <p><strong>オンライン参加:</strong> {{onlineUrl}}</p>
            </div>

            <p>当日は様々な「なんでも」な話が聞けることを楽しみにしています。</p>
            <p>準備はいかがですか？当日お会いできることを心よりお待ちしております！</p>

            <div class="footer">
                <p>なんでもライトニングトーク運営チーム</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
  }

  getEventCancellationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>イベント中止のお知らせ</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .apology { background: #ffebee; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #f44336; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ イベント中止のお知らせ</h1>
        </div>
        <div class="content">
            <p>{{participantName}} さん</p>

            <div class="apology">
                <p>「{{eventTitle}}」（{{eventDate}}開催予定）につきまして、{{reason}}中止とさせていただくことになりました。</p>
                <p>楽しみにしていただいていた皆様には、心よりお詫び申し上げます。</p>
            </div>

            <p>次回イベントの開催が決まりましたら、改めてご案内させていただきます。</p>
            <p>この度は、ご迷惑をおかけして申し訳ございませんでした。</p>

            <div class="footer">
                <p>なんでもライトニングトーク運営チーム</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
  }

  getFeedbackRequestTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>感想をお聞かせください</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(45deg, #ff9a9e 0%, #fecfef 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .feedback-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
        .button { display: inline-block; background: #ff9a9e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 10px 0; }
        .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💭 ご参加ありがとうございました</h1>
            <p>感想をお聞かせください</p>
        </div>
        <div class="content">
            <p>{{participantName}} さん</p>
            <p>「{{eventTitle}}」にご参加いただき、ありがとうございました！</p>

            <div class="feedback-box">
                <h3>📝 アンケートにご協力ください</h3>
                <p>今回のイベントはいかがでしたか？<br>
                今後のイベント向上のため、ぜひ感想をお聞かせください。</p>
                <a href="{{feedbackUrl}}" class="button">アンケートに回答する</a>
                <p><small>所要時間: 約3分</small></p>
            </div>

            <p>またの機会にお会いできることを楽しみにしています！</p>

            <div class="footer">
                <p>なんでもライトニングトーク運営チーム</p>
            </div>
        </div>
    </div>
</body>
</html>
        `;
  }

  // Helper methods
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatParticipationType(type) {
    const types = {
      onsite: '現地参加',
      online: 'オンライン参加',
      undecided: '当日決定'
    };
    return types[type] || type;
  }

  formatCategory(category) {
    const categories = {
      tech: '💻 プログラミング・技術',
      hobby: '🎨 趣味・アート・創作',
      learning: '📚 読書・学習体験',
      travel: '🌍 旅行・文化体験',
      food: '🍳 料理・グルメ',
      game: '🎮 ゲーム・エンタメ',
      lifehack: '💡 ライフハック・効率化',
      pet: '🐱 ペット・動物',
      garden: '🌱 ガーデニング・植物',
      money: '📈 投資・副業',
      sports: '🏃‍♂️ スポーツ・健康',
      music: '🎵 音楽・演奏',
      other: '🌟 その他'
    };
    return categories[category] || category;
  }
}
