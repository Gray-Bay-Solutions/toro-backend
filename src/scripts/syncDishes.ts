import { db } from '../api/firebase';
import YelpService from '../api/yelp';
import admin from 'firebase-admin';

const YELP_API_KEY = process.env.YELP_API_KEY || '';
const yelpService = new YelpService(YELP_API_KEY);

interface Dish {
    id: string;
    restaurant_id: string;
    name: string;
    description: string | null;
    price: number | null;
    category: string | null;
    images: string[];
    rating: {
        average: number;
        total: number;
    };
    created_at: admin.firestore.FieldValue;
    updated_at: admin.firestore.FieldValue;
    source: 'yelp' | 'user' | 'admin';
    is_available: boolean;
    external_data?: any;
}

async function getDishesForRestaurants() {
    try {
        const restaurantsSnapshot = await db.collection('restaurants').get();
        console.log(`Found ${restaurantsSnapshot.size} restaurants to process`);

        for (const doc of restaurantsSnapshot.docs) {
            const restaurant = doc.data();
            console.log(`\nProcessing dishes for: ${restaurant.name}`);

            try {
                // Get menu data from Yelp if available
                if (restaurant.yelp_id) {
                    const yelpDetails = await yelpService.getBusiness(restaurant.yelp_id);

                    // Some restaurants might have menu items in the Yelp response
                    if (yelpDetails?.menu_items?.length) {
                        for (const item of yelpDetails.menu_items) {
                            const dishData: Dish = {
                                id: `${restaurant.yelp_id}_${item.id}`,
                                restaurant_id: doc.id,
                                name: item.name,
                                description: item.description || null,
                                price: parseFloat(item.price?.replace(/[^0-9.]/g, '') || '0') || null,
                                category: item.category || 'Other',
                                images: item.photos || [],
                                rating: {
                                    average: 0,
                                    total: 0
                                },
                                created_at: admin.firestore.FieldValue.serverTimestamp(),
                                updated_at: admin.firestore.FieldValue.serverTimestamp(),
                                source: 'yelp',
                                is_available: true,
                                external_data: item
                            };

                            // Save dish to Firestore
                            // await db.collection('dishes').doc(dishData.id).set(dishData, { merge: true });
                            console.log(`Saved dish: ${dishData.name}`);
                        }
                    }
                }

                // Add delay to respect API limits
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`Error processing restaurant ${restaurant.name}:`, error);
                continue;
            }
        }

        console.log('\nFinished processing all restaurants');

    } catch (error) {
        console.error('Error in getDishesForRestaurants:', error);
        throw error;
    }
}

// For dish reviews, we can use a structure similar to restaurant reviews
interface DishReview {
    type: 'dish';
    source: 'app';  // Only app reviews for dishes initially
    review_type: 'internal';
    dish_id: string;
    restaurant_id: string;
    comment: string;
    rating: number;
    images: string[];
    timestamp: admin.firestore.Timestamp;
    author: {
        name: string;
        user_id: string;
        profile_photo: string | null;
        is_verified: boolean;
    };
    metadata: {
        platform: 'ios' | 'android' | 'web';
        verified_purchase: boolean;
        edited: boolean;
    };
}

// Execute the script
getDishesForRestaurants()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });