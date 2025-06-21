/**
 * Database Service for Lightning Talk Event Management
 * File-based JSON database with in-memory caching for development
 * Can be easily replaced with PostgreSQL/MongoDB for production
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DatabaseService extends EventEmitter {
    constructor() {
        super();
        this.dataDir = path.join(__dirname, '../data');
        this.cache = new Map();
        this.initialized = false;
        this.saveQueue = new Map();
        this.saveTimeout = null;
    }

    async initialize() {
        try {
            // Ensure data directory exists
            await fs.mkdir(this.dataDir, { recursive: true });

            // Initialize collections
            this.collections = {
                events: 'events.json',
                participants: 'participants.json',
                talks: 'talks.json',
                settings: 'settings.json',
                analytics: 'analytics.json'
            };

            // Load or create each collection
            for (const [collection, filename] of Object.entries(this.collections)) {
                await this.initializeCollection(collection, filename);
            }

            // Initialize settings
            await this.initializeSettings();

            this.initialized = true;
            this.emit('ready');
            
            console.log('📦 Database service initialized');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    async initializeCollection(collection, filename) {
        const filePath = path.join(this.dataDir, filename);
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            this.cache.set(collection, JSON.parse(data));
        } catch (error) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, create empty collection
                const emptyData = [];
                this.cache.set(collection, emptyData);
                await this.saveCollection(collection);
                console.log(`📝 Created new collection: ${collection}`);
            } else {
                throw error;
            }
        }
    }

    async initializeSettings() {
        const defaultSettings = {
            siteName: 'なんでもライトニングトーク',
            siteUrl: process.env.SITE_URL || 'http://localhost:3000',
            adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
            emailEnabled: process.env.EMAIL_ENABLED === 'true',
            analyticsEnabled: true,
            registrationSettings: {
                requireApproval: false,
                allowWalkIn: true,
                maxParticipants: 100,
                autoConfirmation: true
            },
            talkSettings: {
                requireApproval: false,
                allowLastMinute: true,
                maxDuration: 5,
                categories: [
                    'tech', 'hobby', 'learning', 'travel', 'food', 
                    'game', 'lifehack', 'pet', 'garden', 'money', 
                    'sports', 'music', 'other'
                ]
            },
            notificationSettings: {
                emailOnRegistration: true,
                emailOnTalkSubmission: true,
                reminderEmails: true,
                reminderDays: [7, 1]
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const existingSettings = this.cache.get('settings');
        if (!existingSettings || existingSettings.length === 0) {
            this.cache.set('settings', [defaultSettings]);
            await this.saveCollection('settings');
        }
    }

    async waitForConnection() {
        if (this.initialized) return;
        
        return new Promise((resolve) => {
            this.once('ready', resolve);
        });
    }

    // CRUD Operations
    async findAll(collection, filter = {}) {
        this.validateCollection(collection);
        const data = this.cache.get(collection) || [];
        
        if (Object.keys(filter).length === 0) {
            return data;
        }

        return data.filter(item => this.matchesFilter(item, filter));
    }

    async findById(collection, id) {
        this.validateCollection(collection);
        const data = this.cache.get(collection) || [];
        return data.find(item => item.id === id);
    }

    async findOne(collection, filter) {
        this.validateCollection(collection);
        const data = this.cache.get(collection) || [];
        return data.find(item => this.matchesFilter(item, filter));
    }

    async create(collection, document) {
        this.validateCollection(collection);
        
        // Add metadata
        const now = new Date().toISOString();
        const newDocument = {
            id: this.generateId(),
            ...document,
            createdAt: now,
            updatedAt: now
        };

        // Add to cache
        const data = this.cache.get(collection) || [];
        data.push(newDocument);
        this.cache.set(collection, data);

        // Queue save
        this.queueSave(collection);

        // Emit event
        this.emit('created', { collection, document: newDocument });

        return newDocument;
    }

    async update(collection, id, updates) {
        this.validateCollection(collection);
        
        const data = this.cache.get(collection) || [];
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) {
            throw new Error(`Document with id ${id} not found in ${collection}`);
        }

        // Apply updates
        const updatedDocument = {
            ...data[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        data[index] = updatedDocument;
        this.cache.set(collection, data);

        // Queue save
        this.queueSave(collection);

        // Emit event
        this.emit('updated', { collection, document: updatedDocument });

        return updatedDocument;
    }

    async delete(collection, id) {
        this.validateCollection(collection);
        
        const data = this.cache.get(collection) || [];
        const index = data.findIndex(item => item.id === id);
        
        if (index === -1) {
            throw new Error(`Document with id ${id} not found in ${collection}`);
        }

        const deletedDocument = data[index];
        data.splice(index, 1);
        this.cache.set(collection, data);

        // Queue save
        this.queueSave(collection);

        // Emit event
        this.emit('deleted', { collection, document: deletedDocument });

        return deletedDocument;
    }

    // Aggregation methods
    async count(collection, filter = {}) {
        const results = await this.findAll(collection, filter);
        return results.length;
    }

    async countByField(collection, field) {
        const data = await this.findAll(collection);
        const counts = {};
        
        data.forEach(item => {
            const value = item[field] || 'unknown';
            counts[value] = (counts[value] || 0) + 1;
        });

        return counts;
    }

    async getStats(collection) {
        const data = await this.findAll(collection);
        
        return {
            total: data.length,
            createdToday: data.filter(item => {
                const created = new Date(item.createdAt);
                const today = new Date();
                return created.toDateString() === today.toDateString();
            }).length,
            createdThisWeek: data.filter(item => {
                const created = new Date(item.createdAt);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return created >= weekAgo;
            }).length,
            lastUpdated: data.length > 0 ? 
                Math.max(...data.map(item => new Date(item.updatedAt))) : 
                null
        };
    }

    // Event-specific methods
    async getCurrentEvent() {
        const events = await this.findAll('events', { status: 'upcoming' });
        return events.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    }

    async getEventParticipants(eventId) {
        return await this.findAll('participants', { eventId });
    }

    async getEventTalks(eventId) {
        return await this.findAll('talks', { eventId });
    }

    async getEventAnalytics(eventId) {
        const participants = await this.getEventParticipants(eventId);
        const talks = await this.getEventTalks(eventId);

        return {
            participantCount: participants.length,
            speakerCount: talks.length,
            participationTypes: await this.countByField('participants', 'participationType'),
            talkCategories: await this.countByField('talks', 'category'),
            registrationTrend: this.getRegistrationTrend(participants),
            avgRating: this.calculateAverageRating(talks)
        };
    }

    getRegistrationTrend(participants) {
        const trend = {};
        participants.forEach(participant => {
            const date = new Date(participant.createdAt).toDateString();
            trend[date] = (trend[date] || 0) + 1;
        });
        return trend;
    }

    calculateAverageRating(talks) {
        const ratingsArray = talks
            .filter(talk => talk.rating)
            .map(talk => talk.rating);
        
        if (ratingsArray.length === 0) return null;
        
        return ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length;
    }

    // Settings management
    async getSettings() {
        const settings = this.cache.get('settings') || [];
        return settings[0] || {};
    }

    async updateSettings(updates) {
        const settings = await this.getSettings();
        const updatedSettings = {
            ...settings,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.cache.set('settings', [updatedSettings]);
        await this.queueSave('settings');

        return updatedSettings;
    }

    // Data seeding for development
    async seed(seedData) {
        for (const [collection, data] of Object.entries(seedData)) {
            if (this.collections[collection]) {
                this.cache.set(collection, data);
                await this.saveCollection(collection);
                console.log(`🌱 Seeded ${collection} with ${data.length} items`);
            }
        }
    }

    // Data export/backup
    async exportData() {
        const exportData = {};
        
        for (const collection of Object.keys(this.collections)) {
            exportData[collection] = this.cache.get(collection) || [];
        }

        return {
            ...exportData,
            exportedAt: new Date().toISOString(),
            version: '1.0.0'
        };
    }

    async importData(importData) {
        for (const [collection, data] of Object.entries(importData)) {
            if (this.collections[collection] && Array.isArray(data)) {
                this.cache.set(collection, data);
                await this.saveCollection(collection);
                console.log(`📥 Imported ${collection} with ${data.length} items`);
            }
        }
    }

    // Helper methods
    validateCollection(collection) {
        if (!this.collections[collection]) {
            throw new Error(`Invalid collection: ${collection}`);
        }
    }

    matchesFilter(item, filter) {
        return Object.entries(filter).every(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                // Handle operators like { $gte: value }
                return Object.entries(value).every(([operator, operatorValue]) => {
                    switch (operator) {
                        case '$gte':
                            return item[key] >= operatorValue;
                        case '$lte':
                            return item[key] <= operatorValue;
                        case '$gt':
                            return item[key] > operatorValue;
                        case '$lt':
                            return item[key] < operatorValue;
                        case '$ne':
                            return item[key] !== operatorValue;
                        case '$in':
                            return Array.isArray(operatorValue) && operatorValue.includes(item[key]);
                        case '$nin':
                            return Array.isArray(operatorValue) && !operatorValue.includes(item[key]);
                        default:
                            return false;
                    }
                });
            }
            return item[key] === value;
        });
    }

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    queueSave(collection) {
        this.saveQueue.set(collection, true);
        
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        this.saveTimeout = setTimeout(async () => {
            const collectionsToSave = Array.from(this.saveQueue.keys());
            this.saveQueue.clear();

            for (const collection of collectionsToSave) {
                await this.saveCollection(collection);
            }
        }, 1000); // Batch saves every 1 second
    }

    async saveCollection(collection) {
        try {
            const filename = this.collections[collection];
            const filePath = path.join(this.dataDir, filename);
            const data = this.cache.get(collection) || [];
            
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`Failed to save collection ${collection}:`, error);
            throw error;
        }
    }

    async close() {
        // Save all pending changes
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }

        const collectionsToSave = Array.from(this.saveQueue.keys());
        for (const collection of collectionsToSave) {
            await this.saveCollection(collection);
        }

        console.log('📦 Database service closed');
    }
}