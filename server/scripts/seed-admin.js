/**
 * Seed Admin User Script
 * Creates an initial admin user for the system
 */

import { DatabaseService } from '../services/database.js';
import { hashPassword } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedAdmin() {
  console.log('🌱 Seeding admin user...');

  try {
    // Initialize database
    const database = new DatabaseService();
    await database.initialize();

    // Admin user details
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@lightningtalk.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Check if admin already exists
    const existingAdmins = await database.findAll('users', { email: adminEmail });
    if (existingAdmins.length > 0) {
      console.log('✅ Admin user already exists:', adminEmail);
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(adminPassword);

    // Create admin user
    const admin = await database.create('users', {
      email: adminEmail,
      passwordHash,
      name: adminName,
      role: 'admin',
      createdAt: new Date().toISOString(),
      isSystemUser: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the admin password after first login!');
    console.log('');
    console.log('To login, use these credentials:');
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: ${adminPassword}`);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdmin();
}

export default seedAdmin;
