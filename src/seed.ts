import admin from 'firebase-admin';
import YelpService, { SortBy } from './api/yelp';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file located in the root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase Admin SDK
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set.');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

// Initialize YelpService
const yelpApiKey = process.env.YELP_API_KEY || '';
const yelpService = new YelpService(yelpApiKey);

async function seedRestaurants(location: string) {
  try {
    const businesses = await yelpService.searchBusinesses(location, 'best_match', 50);

    for (const business of businesses.businesses) {
      // TODO: look for photo URL
      const restaurantData = {
        name: business.name,
        location: new admin.firestore.GeoPoint(business.coordinates.latitude, business.coordinates.longitude),
        address: `${business.location.address1}, ${business.location.city}, ${business.location.state} ${business.location.zip_code}`,
        phone: business.phone,
        website: business.url,
        yelpId: business.id,
        averageRating: business.rating,
        totalRatings: business.review_count,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Add the restaurant to Firestore
      await db.collection('restaurants').doc(business.id).set(restaurantData);
      console.log(`Added ${business.name} to Firestore`);
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding restaurants:', error);
  }
}

// Start seeding
seedRestaurants('Fort Lauderdale, FL').then(() => {
  console.log('Seeding process finished.');
  process.exit();
}).catch(error => {
  console.error('Error during seeding process:', error);
  process.exit(1);
});
