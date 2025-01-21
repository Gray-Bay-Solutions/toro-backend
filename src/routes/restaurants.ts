import { Router } from 'express';
import { db } from '../api/firebase';
import { createDocument, updateDocument } from '../utils/firestore';

const router = Router();

// Restaurants Endpoints
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('restaurants').get();
        const restaurants = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(restaurants);
    } catch (error) {
        console.error('Error fetching restaurants:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const restaurantData = {
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            rating: req.body.rating,
            status: 'Active'
        };
        const restaurant = await createDocument('restaurants', restaurantData);
        res.status(201).json(restaurant);
    } catch (error) {
        console.error('Error creating restaurant:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const restaurant = await updateDocument('restaurants', req.params.id, req.body);
        res.json(restaurant);
    } catch (error) {
        console.error('Error updating restaurant:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.collection('restaurants').doc(req.params.id).delete();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting restaurant:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get reviews by restaurant
router.get('/:id/reviews', async (req, res) => {
    try {
        // Get pagination parameters from query string
        const limit = parseInt(req.query.limit as string) || 10;
        const page = parseInt(req.query.page as string) || 1;
        const offset = (page - 1) * limit;

        // Create the base query
        let query = db.collection('reviews')
            .where('restaurant_id', '==', req.params.id);

        // Get total count for pagination
        const totalSnapshot = await query.count().get();
        const total = totalSnapshot.data().count;

        // Apply pagination
        query = query.limit(limit).offset(offset);

        // Execute the query
        const snapshot = await query.get();

        // Format the reviews
        const reviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
        }));

        // Send response with pagination metadata
        res.json({
            data: reviews,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching restaurant reviews:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
