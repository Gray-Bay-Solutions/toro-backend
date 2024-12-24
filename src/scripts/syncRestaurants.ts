import { db } from '../api/firebase';
import YelpService from '../api/yelp';
import { Client, PlaceInputType } from '@googlemaps/google-maps-services-js';
import admin from 'firebase-admin';

const YELP_API_KEY = process.env.YELP_API_KEY || '';
const yelpService = new YelpService(YELP_API_KEY);
const googleClient = new Client({});

async function deleteAllRestaurants() {
    const snapshot = await db.collection('restaurants').get();
    const batch = db.batch();

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Deleted ${snapshot.size} restaurants`);
}

async function scrapeRestaurants() {
    try {
        // Delete existing restaurants
        await deleteAllRestaurants();

        let offset = 0;
        const limit = 50;  // Yelp's max per request
        const radius = 8000;  // 5 miles in meters
        let totalProcessed = 0;
        let hasMore = true;

        while (hasMore) {
            // Get Fort Lauderdale restaurants from Yelp
            const yelpResponse = await yelpService.searchBusinesses(
                'Fort Lauderdale, FL',
                'best_match',
                limit,
                {
                    offset: offset,
                    term: 'restaurants',
                    radius: radius
                }
            );

            console.log(`Processing batch of ${yelpResponse.businesses.length} restaurants (offset: ${offset})`);

            if (yelpResponse.businesses.length === 0) {
                hasMore = false;
                break;
            }

            for (const business of yelpResponse.businesses) {
                try {
                    // Get detailed Yelp data
                    const yelpDetails = await yelpService.getBusiness(business.id);

                    // Search for the same business on Google
                    const googleSearch = await googleClient.findPlaceFromText({
                        params: {
                            input: `${business.name} ${business.location.address1} Fort Lauderdale`,
                            inputtype: PlaceInputType.textQuery,
                            key: process.env.GOOGLE_MAPS_API_KEY || '',
                            fields: ['place_id']
                        }
                    });

                    let googleDetails = null;
                    if (googleSearch.data.candidates?.[0]?.place_id) {
                        googleDetails = await googleClient.placeDetails({
                            params: {
                                place_id: googleSearch.data.candidates[0].place_id,
                                key: process.env.GOOGLE_MAPS_API_KEY || '',
                                fields: ['name', 'rating', 'formatted_address', 'formatted_phone_number',
                                    'opening_hours', 'price_level', 'website', 'user_ratings_total']
                            }
                        });
                    }

                    // Prepare restaurant document
                    const restaurantData = {
                        name: business.name,
                        is_active: !business.is_closed,
                        created_at: admin.firestore.FieldValue.serverTimestamp(),
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                        last_scraped: admin.firestore.FieldValue.serverTimestamp(),

                        yelp_id: business.id,
                        google_place_id: googleSearch.data.candidates?.[0]?.place_id || null,
                        data_source: 'yelp',  // Primary source

                        phone: business.display_phone,
                        website: business.url,
                        address: {
                            full: business.location.display_address.join(', '),
                            street: business.location.address1 || null,
                            city: business.location.city,
                            state: business.location.state,
                            zip: business.location.zip_code,
                            country: business.location.country,
                            coordinates: {
                                latitude: business.coordinates.latitude,
                                longitude: business.coordinates.longitude
                            }
                        },

                        categories: business.categories.map((cat: any) => cat.title),
                        price_level: googleDetails?.data.result.price_level || 0,

                        rating: {
                            average: business.rating,
                            total: business.review_count,
                            yelp: {
                                rating: business.rating,
                                total: business.review_count
                            },
                            google: googleDetails?.data.result ? {
                                rating: googleDetails.data.result.rating,
                                total: googleDetails.data.result.user_ratings_total
                            } : null
                        },

                        images: {
                            primary: business.image_url || null,
                            gallery: business.photos || []
                        },

                        transactions: business.transactions || [],

                        external_data: {
                            yelp: yelpDetails,
                            google: googleDetails?.data.result || null
                        }
                    };

                    console.log(restaurantData);

                    // Save to Firestore
                    await db.collection('restaurants').doc().set(restaurantData);
                    console.log(`Saved restaurant: ${business.name}`);

                    console.log(`Saved restaurant ${++totalProcessed}: ${business.name}`);

                    // Add delay to respect API rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));

                } catch (error) {
                    console.error(`Error processing restaurant ${business.name}:`, error);
                    continue;
                }
            }

            offset += limit;
            console.log(`Total restaurants processed so far: ${totalProcessed}`);

            // Add a small delay between batches
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log(`Finished scraping ${totalProcessed} restaurants`);

    } catch (error) {
        console.error('Error in scrapeRestaurants:', error);
        throw error;
    }
}

// Run the scraper
scrapeRestaurants().catch((error) => console.error(error));