import dotenv from 'dotenv';

dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// Validate required environment variables
const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
const missing = requiredVars.filter((key) => !env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  console.error('   Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// Warn about optional API keys
const optionalApiKeys = ['YOUTUBE_API_KEY', 'GEMINI_API_KEY'];
optionalApiKeys.forEach((key) => {
  if (!env[key]) {
    console.warn(`⚠️  Warning: ${key} is not set. Related features will be unavailable.`);
  }
});

export default env;
