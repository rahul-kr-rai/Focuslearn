import app from './src/app.js';
import connectDB from './src/config/db.js';
import env from './src/config/env.js';
import { verifyEmailConfig } from './src/services/emailService.js';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Verify Email service configuration
    await verifyEmailConfig();

    // Start Express server
    app.listen(env.PORT, () => {
      console.log(`
  ╔═════════════════════════════════════════════════════════════╗
  ║                                                             ║
  ║   🎓 FocusLearn API Server                                  ║
  ║   ──────────────────────────────────────────────────────────║
  ║   Port:        ${String(env.PORT).padEnd(28)}               ║
  ║   Environment: ${String(env.NODE_ENV).padEnd(28)}           ║
  ║   Health:      http://localhost:${env.PORT}/api/health      ║
  ║                                                             ║
  ╚═════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
