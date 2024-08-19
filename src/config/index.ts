import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
}

export const config = {
  port: process.env.PORT || 3000,
  yelpApiKey: process.env.YELP_API_KEY || '',
  firebaseServiceAccount: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL || '',
};
