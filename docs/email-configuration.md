# Email Service Configuration Guide

Lightning Talk Circle supports multiple email service providers for sending
transactional emails. This guide will help you configure the email service.

## Supported Email Providers

1. **Gmail** - Simple setup for small-scale applications
2. **SendGrid** - Professional email delivery service
3. **AWS SES** - Amazon's scalable email service
4. **SMTP** - Any SMTP server
5. **Mailgun** - Developer-friendly email service
6. **Mock** - For testing without sending real emails

## Configuration Steps

### 1. Enable Email Service

Set `EMAIL_ENABLED=true` in your `.env` file.

### 2. Choose Email Provider

Set `EMAIL_SERVICE` to one of: `gmail`, `sendgrid`, `aws-ses`, `smtp`,
`mailgun`, or `mock`.

### 3. Provider-Specific Configuration

#### Gmail Configuration

1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Configure:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   ```

#### SendGrid Configuration

1. Sign up for SendGrid: https://sendgrid.com
2. Create an API Key
3. Configure:
   ```env
   EMAIL_SERVICE=sendgrid
   SENDGRID_API_KEY=your-api-key
   ```

#### AWS SES Configuration

1. Set up AWS SES in your AWS account
2. Create SMTP credentials
3. Configure:
   ```env
   EMAIL_SERVICE=aws-ses
   AWS_SES_USERNAME=your-smtp-username
   AWS_SES_PASSWORD=your-smtp-password
   AWS_SES_REGION=us-east-1
   ```

#### Custom SMTP Configuration

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
```

#### Mailgun Configuration

1. Sign up for Mailgun: https://www.mailgun.com
2. Get SMTP credentials
3. Configure:
   ```env
   EMAIL_SERVICE=mailgun
   MAILGUN_SMTP_USER=postmaster@your-domain.mailgun.org
   MAILGUN_SMTP_PASSWORD=your-password
   ```

## Email Templates

The system sends the following types of emails:

1. **Registration Confirmation** - Sent when a participant registers
2. **Speaker Confirmation** - Sent when a speaker submits a talk
3. **Event Reminder** - Sent before the event
4. **Event Cancellation** - Sent if event is cancelled
5. **Feedback Request** - Sent after the event

## Testing Email Configuration

1. Use mock mode for development:

   ```env
   EMAIL_SERVICE=mock
   EMAIL_ENABLED=true
   ```

2. Check logs for simulated email sends

3. Test with real provider:
   ```bash
   npm run dev
   # Register for an event and check email delivery
   ```

## Troubleshooting

### Gmail Issues

- Ensure you're using App Password, not regular password
- Check if "Less secure app access" is needed (not recommended)

### SendGrid Issues

- Verify sender domain if required
- Check API key permissions

### AWS SES Issues

- Verify email addresses in sandbox mode
- Check region configuration

### General Issues

- Check spam folder
- Verify `EMAIL_FROM` address is valid
- Check server logs for error messages

## Security Best Practices

1. Never commit `.env` file to version control
2. Use environment variables in production
3. Rotate API keys regularly
4. Monitor email delivery rates
5. Implement rate limiting for email sends

## Email Service Features

- **Retry Logic**: Automatic retry on failure
- **Batch Sending**: Send emails in batches to avoid rate limits
- **HTML/Text**: Both HTML and plain text versions
- **Template System**: Customizable email templates
- **Logging**: Comprehensive logging for debugging
