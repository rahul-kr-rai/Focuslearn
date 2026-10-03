import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import { seedDemoUser, resetDemoUserProgress } from './src/utils/seedDemoUser.js';

async function main() {
  try {
    await connectDB();
    console.log('🔄 Resetting demo user in MongoDB to clean slate (0% progress, 0 streak)...');
    await seedDemoUser();
    await resetDemoUserProgress();
    console.log('✅ Demo user progress successfully cleared to 0 in database!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  }
}

main();
