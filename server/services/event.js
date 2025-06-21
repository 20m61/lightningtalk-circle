/**
 * Event Service for Lightning Talk Event Management
 * Business logic for event operations and analytics
 */

export class EventService {
    constructor(database, emailService) {
        this.database = database;
        this.emailService = emailService;
        this.reminderJobs = new Map();
        this.startReminderScheduler();
    }

    // Event lifecycle management
    async createEvent(eventData) {
        const event = await this.database.create('events', eventData);
        
        // Schedule reminder emails
        await this.scheduleReminders(event);
        
        // Track analytics
        await this.trackAnalytics(event.id, 'event_created', {
            venue: event.venue.name,
            capacity: event.venue.capacity,
            maxTalks: event.maxTalks
        });

        return event;
    }

    async updateEvent(eventId, updates) {
        const event = await this.database.update('events', eventId, updates);
        
        // Reschedule reminders if date changed
        if (updates.date) {
            await this.rescheduleReminders(event);
        }

        return event;
    }

    async cancelEvent(eventId, reason = '') {
        const event = await this.database.findById('events', eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        // Update event status
        await this.database.update('events', eventId, {
            status: 'cancelled',
            cancelReason: reason,
            cancelledAt: new Date().toISOString()
        });

        // Get all participants
        const participants = await this.database.findAll('participants', { eventId });

        // Send cancellation emails
        const settings = await this.database.getSettings();
        if (settings.emailEnabled) {
            for (const participant of participants) {
                try {
                    await this.emailService.sendEventCancellation(participant, event, reason);
                } catch (error) {
                    console.error('Failed to send cancellation email:', error);
                }
            }
        }

        // Cancel reminder jobs
        this.cancelReminders(eventId);

        // Track analytics
        await this.trackAnalytics(eventId, 'event_cancelled', {
            reason,
            participantCount: participants.length,
            daysBeforeEvent: this.getDaysUntilEvent(event.date)
        });

        return event;
    }

    // Reminder system
    async scheduleReminders(event) {
        const settings = await this.database.getSettings();
        if (!settings.emailEnabled || !settings.notificationSettings?.reminderEmails) {
            return;
        }

        const reminderDays = settings.notificationSettings.reminderDays || [7, 1];
        const eventDate = new Date(event.date);

        for (const days of reminderDays) {
            const reminderDate = new Date(eventDate);
            reminderDate.setDate(reminderDate.getDate() - days);

            if (reminderDate > new Date()) {
                this.scheduleReminderJob(event.id, reminderDate, days);
            }
        }
    }

    scheduleReminderJob(eventId, reminderDate, daysUntil) {
        const timeUntilReminder = reminderDate.getTime() - Date.now();
        
        if (timeUntilReminder > 0) {
            const timeoutId = setTimeout(async () => {
                await this.sendEventReminders(eventId, daysUntil);
                this.reminderJobs.delete(`${eventId}-${daysUntil}`);
            }, timeUntilReminder);

            this.reminderJobs.set(`${eventId}-${daysUntil}`, timeoutId);
        }
    }

    async sendEventReminders(eventId, daysUntil) {
        try {
            const event = await this.database.findById('events', eventId);
            if (!event || event.status !== 'upcoming') {
                return;
            }

            const participants = await this.database.findAll('participants', { 
                eventId,
                status: 'confirmed'
            });

            for (const participant of participants) {
                try {
                    await this.emailService.sendEventReminder(participant, event, daysUntil);
                } catch (error) {
                    console.error('Failed to send reminder email:', error);
                }
            }

            // Track analytics
            await this.trackAnalytics(eventId, 'reminder_sent', {
                daysUntil,
                participantCount: participants.length
            });

            console.log(`📧 Sent ${daysUntil}-day reminders to ${participants.length} participants`);

        } catch (error) {
            console.error('Error sending event reminders:', error);
        }
    }

    async rescheduleReminders(event) {
        // Cancel existing reminders
        this.cancelReminders(event.id);
        
        // Schedule new reminders
        await this.scheduleReminders(event);
    }

    cancelReminders(eventId) {
        for (const [key, timeoutId] of this.reminderJobs.entries()) {
            if (key.startsWith(`${eventId}-`)) {
                clearTimeout(timeoutId);
                this.reminderJobs.delete(key);
            }
        }
    }

    startReminderScheduler() {
        // Check for pending reminders every hour
        setInterval(async () => {
            await this.checkPendingReminders();
        }, 60 * 60 * 1000);
    }

    async checkPendingReminders() {
        try {
            const upcomingEvents = await this.database.findAll('events', { status: 'upcoming' });
            
            for (const event of upcomingEvents) {
                await this.scheduleReminders(event);
            }
        } catch (error) {
            console.error('Error checking pending reminders:', error);
        }
    }

    // Registration management
    async processRegistration(registrationData) {
        const { eventId, participantData, talkData } = registrationData;
        
        const event = await this.database.findById('events', eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        // Check registration constraints
        await this.validateRegistration(event, participantData);

        // Create participant
        const participant = await this.database.create('participants', {
            ...participantData,
            eventId: event.id
        });

        // Create talk if speaker registration
        let talk = null;
        if (talkData) {
            await this.validateTalkSubmission(event, talkData);
            talk = await this.database.create('talks', {
                ...talkData,
                eventId: event.id,
                speakerId: participant.id,
                speakerName: participant.name,
                speakerEmail: participant.email
            });
        }

        // Send confirmation emails
        const settings = await this.database.getSettings();
        if (settings.emailEnabled) {
            if (talk) {
                await this.emailService.sendSpeakerConfirmation(participant, talk, event);
            } else {
                await this.emailService.sendRegistrationConfirmation(participant, event);
            }
        }

        // Track analytics
        await this.trackAnalytics(event.id, 'participant_registered', {
            participationType: participant.participationType,
            isSpeaker: !!talk,
            category: talk?.category
        });

        return { participant, talk };
    }

    async validateRegistration(event, participantData) {
        // Check if registration is open
        if (!event.registrationOpen) {
            throw new Error('Registration is closed for this event');
        }

        // Check capacity
        const currentParticipants = await this.database.count('participants', { eventId: event.id });
        const settings = await this.database.getSettings();
        const maxParticipants = settings.registrationSettings?.maxParticipants || 100;

        if (currentParticipants >= maxParticipants) {
            throw new Error('Event is at full capacity');
        }

        // Check for duplicate registration
        const existingParticipant = await this.database.findOne('participants', {
            email: participantData.email,
            eventId: event.id
        });

        if (existingParticipant) {
            throw new Error('Already registered with this email');
        }
    }

    async validateTalkSubmission(event, talkData) {
        // Check if talk submission is open
        if (!event.talkSubmissionOpen) {
            throw new Error('Talk submission is closed for this event');
        }

        // Check talk slots
        const currentTalks = await this.database.count('talks', { eventId: event.id });
        const maxTalks = event.maxTalks || 20;

        if (currentTalks >= maxTalks) {
            throw new Error('All talk slots are filled');
        }
    }

    // Analytics and reporting
    async trackAnalytics(eventId, action, data = {}) {
        try {
            await this.database.create('analytics', {
                eventId,
                action,
                data,
                timestamp: new Date().toISOString(),
                date: new Date().toDateString()
            });
        } catch (error) {
            console.error('Failed to track analytics:', error);
        }
    }

    async getEventAnalytics(eventId, dateRange = null) {
        let analytics = await this.database.findAll('analytics', { eventId });

        // Filter by date range if provided
        if (dateRange) {
            const { start, end } = dateRange;
            analytics = analytics.filter(item => {
                const date = new Date(item.timestamp);
                return date >= new Date(start) && date <= new Date(end);
            });
        }

        return this.processAnalytics(analytics);
    }

    processAnalytics(analytics) {
        const summary = {
            totalEvents: analytics.length,
            uniqueDays: new Set(analytics.map(a => a.date)).size,
            actionCounts: {},
            timeline: {},
            hourlyDistribution: {},
            topActions: []
        };

        // Count actions
        analytics.forEach(item => {
            summary.actionCounts[item.action] = (summary.actionCounts[item.action] || 0) + 1;
            
            // Timeline data
            if (!summary.timeline[item.date]) {
                summary.timeline[item.date] = {};
            }
            summary.timeline[item.date][item.action] = (summary.timeline[item.date][item.action] || 0) + 1;
            
            // Hourly distribution
            const hour = new Date(item.timestamp).getHours();
            summary.hourlyDistribution[hour] = (summary.hourlyDistribution[hour] || 0) + 1;
        });

        // Top actions
        summary.topActions = Object.entries(summary.actionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([action, count]) => ({ action, count }));

        return summary;
    }

    async generateEventReport(eventId) {
        const event = await this.database.findById('events', eventId);
        if (!event) {
            throw new Error('Event not found');
        }

        const [participants, talks, analytics] = await Promise.all([
            this.database.findAll('participants', { eventId }),
            this.database.findAll('talks', { eventId }),
            this.getEventAnalytics(eventId)
        ]);

        return {
            event: {
                id: event.id,
                title: event.title,
                date: event.date,
                status: event.status,
                venue: event.venue
            },
            summary: {
                totalParticipants: participants.length,
                confirmedParticipants: participants.filter(p => p.status === 'confirmed').length,
                totalTalks: talks.length,
                confirmedTalks: talks.filter(t => t.status === 'confirmed').length,
                participationTypes: this.countByField(participants, 'participationType'),
                talkCategories: this.countByField(talks, 'category'),
                registrationTrend: this.getRegistrationTrend(participants)
            },
            analytics,
            participants: participants.map(p => ({
                id: p.id,
                name: p.name,
                participationType: p.participationType,
                status: p.status,
                isSpeaker: p.isSpeaker || false,
                registeredAt: p.createdAt
            })),
            talks: talks.map(t => ({
                id: t.id,
                title: t.title,
                category: t.category,
                speakerName: t.speakerName,
                status: t.status,
                submittedAt: t.createdAt
            })),
            generatedAt: new Date().toISOString()
        };
    }

    // Helper methods
    countByField(items, field) {
        const counts = {};
        items.forEach(item => {
            const value = item[field] || 'unknown';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }

    getRegistrationTrend(participants) {
        const trend = {};
        participants.forEach(participant => {
            const date = new Date(participant.createdAt).toDateString();
            trend[date] = (trend[date] || 0) + 1;
        });
        return trend;
    }

    getDaysUntilEvent(eventDate) {
        const now = new Date();
        const event = new Date(eventDate);
        const diffTime = event - now;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    formatEventStatus(status) {
        const statuses = {
            upcoming: '開催予定',
            ongoing: '開催中',
            completed: '終了',
            cancelled: '中止'
        };
        return statuses[status] || status;
    }
}