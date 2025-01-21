import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set.");
}

interface Config {
  port: number;
  nodeEnv: string;
  apiVersion: string;
  yelpApiKey: string;
  firebaseServiceAccount: any;
  firebaseDatabaseUrl: string;
  googleMapsApiKey: string;
}

export const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: 'v1',
  yelpApiKey: process.env.YELP_API_KEY || '',
  firebaseServiceAccount: JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL || '',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
};
