// src/scripts/googleReviews.ts
import { db } from '../api/firebase';
import { config } from '../config';
import { 
    Client, 
    PlaceInputType
} from '@googlemaps/google-maps-services-js';
import admin from 'firebase-admin';

const client = new Client({});

interface GoogleReview {
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: string;
    profile_photo_url?: string;
}


async function deleteAllReviews() {
    const snapshot = await db.collection('reviews').get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} reviews`);
}


function parseTimestamp(time: any): admin.firestore.Timestamp | null {
    try {
        // If it's a Date object or can be converted to one
        const date = new Date(time);
        if (!isNaN(date.getTime())) {
            return admin.firestore.Timestamp.fromDate(date);
        }
        return null;
    } catch (error) {
        console.warn('Error parsing timestamp:', time, error);
        return null;
    }
}

async function updateRestaurantReviews() {
    try {
        await deleteAllReviews();
        const restaurantsSnapshot = await db.collection('restaurants').get();
        console.log(`Found ${restaurantsSnapshot.size} restaurants in the database`);
        
        for (const doc of restaurantsSnapshot.docs) {
            const restaurant = doc.data();
            console.log(`\nProcessing restaurant: ${restaurant.name}`);
            
            try {
                // If we have a Google Place ID stored, use it directly
                const placeId = restaurant.google_place_id;
                
                if (!placeId) {
                    console.warn(`No Google Place ID for restaurant: ${restaurant.name}`);
                    continue;
                }

                const placeDetails = await client.placeDetails({
                    params: {
                        place_id: placeId,
                        key: config.googleMapsApiKey,
                        fields: ['reviews']
                    }
                });

                const reviews = placeDetails.data.result?.reviews as GoogleReview[] | undefined;

                if (!reviews) {
                    console.warn(`No Google reviews found for restaurant: ${restaurant.name}`);
                    continue;
                }

                // Sort reviews by rating (highest first) and take top 10
                const topReviews = reviews
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 10);

                for (const review of topReviews) {
                    const timestamp = parseTimestamp(review.time);
                    
                    if (!timestamp) {
                        console.warn(`Invalid timestamp for review: ${review.time}`);
                        continue;
                    }

                    const reviewData = {
                        type: 'restaurant',
                        source: 'google',           // Explicitly mark as Google review
                        review_type: 'external',    // To distinguish from in-app reviews
                        comment: review.text,
                        rating: review.rating,
                        timestamp,
                        restaurant_id: doc.id,
                        restaurant_name: restaurant.name,
                        author: {
                            name: review.author_name,
                            profile_photo: review.profile_photo_url || null,
                            is_verified: false      // Google reviewers aren't verified in our app
                        },
                        metadata: {
                            relative_time: review.relative_time_description,
                            platform: 'google',
                            original_timestamp: review.time
                        }
                    };

                    // Create a consistent ID format for Google reviews
                    const reviewId = `google_${doc.id}_${review.time}_${review.author_name}`
                        .replace(/[.#$\[\]]/g, '_');
                    
                    await db.collection('reviews').doc(reviewId).set(reviewData, { merge: true });
                }
                
                console.log(`Successfully processed top ${topReviews.length} Google reviews for: ${restaurant.name}`);
                // Rate limit delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Error processing restaurant ${restaurant.name}:`, error);
                continue;
            }
        }
        
        console.log('\nFinished updating all restaurant Google reviews');
        
    } catch (error) {
        console.error('Error updating restaurant reviews:', error);
        throw error;
    }
}

// Execute the script
updateRestaurantReviews()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });

// For reference, this is how in-app reviews would differ in structure:
const inAppReviewExample = {
    type: 'restaurant',
    source: 'app',               // Mark as in-app review
    review_type: 'internal',     // To distinguish from external reviews
    comment: 'Great food!',
    rating: 5,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    restaurant_id: 'restaurantId',
    restaurant_name: 'Restaurant Name',
    author: {
        name: 'User Display Name',
        user_id: 'actualUserId',  // Reference to our users collection
        profile_photo: 'userPhotoUrl',
        is_verified: true        // Can mark if they've actually ordered/visited
    },
    metadata: {
        platform: 'ios',         // or 'android', 'web'
        verified_purchase: true,  // If they ordered through your app
        edited: false           // If they've edited their review
    }
};