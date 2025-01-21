import { Router, Request, Response } from 'express';
import { db } from '../api/firebase';

const router = Router();

// Types
interface Review {
    author_name: string;
    comment: string;
    dish: FirebaseFirestore.DocumentReference;
    rating: number;
    source: string;
    timestamp: FirebaseFirestore.Timestamp;
    type: string;
    user: FirebaseFirestore.DocumentReference;
    profile_photo_url?: string;
}

interface Dish {
    id: string;
    name: string;
    restaurant: FirebaseFirestore.DocumentReference;
}

interface Restaurant {
    id: string;
    name: string;
}

// Reviews Endpoints
router.get('/', async (req: Request, res: Response) => {
    try {
        const snapshot = await db.collection('reviews').get();

        const reviewsPromises = snapshot.docs.map(async (doc) => {
            const reviewData = doc.data() as Review;

            let dishData: Dish | null = null;
            let restaurantData: Restaurant | null = null;

            if (reviewData.dish) {
                try {
                    const dishDoc = await reviewData.dish.get();
                    if (dishDoc.exists) {
                        const dishDocData = dishDoc.data();
                        dishData = {
                            id: dishDoc.id,
                            name: dishDocData?.name,
                            restaurant: dishDocData?.restaurant
                        };

                        if (dishData.restaurant) {
                            const restaurantDoc = await dishData.restaurant.get();
                            if (restaurantDoc.exists) {
                                restaurantData = {
                                    id: restaurantDoc.id,
                                    name: restaurantDoc.data()?.name
                                };
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching dish:`, error);
                }
            }

            return {
                id: doc.id,
                author_name: reviewData.author_name,
                comment: reviewData.comment,
                rating: reviewData.rating,
                source: reviewData.source,
                timestamp: reviewData.timestamp,
                profile_photo_url: reviewData.profile_photo_url,
                dish: dishData ? {
                    id: dishData.id,
                    name: dishData.name,
                    restaurant: restaurantData ? {
                        id: restaurantData.id,
                        name: restaurantData.name
                    } : null
                } : null
            };
        });

        const reviews = await Promise.all(reviewsPromises);

        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;