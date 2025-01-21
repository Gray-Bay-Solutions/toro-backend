import { Router } from 'express';
import { db } from '../api/firebase';
import { createDocument, updateDocument } from '../utils/firestore';

const router = Router();

// GET /api/v1/dishes
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('dishes').get();
        const dishes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(dishes);
    } catch (error) {
        console.error('Error fetching dishes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /api/v1/dishes
router.post('/', async (req, res) => {
    try {
        const dishData = {
            name: req.body.name,
            description: req.body.description,
            price: Number(req.body.price),
            rating: Number(req.body.rating || 0),
            restaurant: req.body.restaurant, // restaurant reference
            city: req.body.city, // city reference
            image_url: req.body.image_url || '',
            review_count: Number(req.body.review_count || 0),
            average_rating: Number(req.body.average_rating || 0)
        };
        const dish = await createDocument('dishes', dishData);
        res.status(201).json(dish);
    } catch (error) {
        console.error('Error creating dish:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /api/v1/dishes/:id
router.put('/:id', async (req, res) => {
    try {
        // Convert numeric fields
        const updatedData = {
            ...req.body,
            price: Number(req.body.price),
            rating: Number(req.body.rating),
            review_count: Number(req.body.review_count),
            average_rating: Number(req.body.average_rating)
        };
        const dish = await updateDocument('dishes', req.params.id, updatedData);
        res.json(dish);
    } catch (error) {
        console.error('Error updating dish:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /api/v1/dishes/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.collection('dishes').doc(req.params.id).delete();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting dish:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get dishes by restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const snapshot = await db.collection('dishes')
            .where('restaurant', '==', req.params.restaurantId)
            .get();

        const dishes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(dishes);
    } catch (error) {
        console.error('Error fetching restaurant dishes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get dishes by city
router.get('/city/:cityId', async (req, res) => {
    try {
        const snapshot = await db.collection('dishes')
            .where('city', '==', req.params.cityId)
            .get();

        const dishes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(dishes);
    } catch (error) {
        console.error('Error fetching city dishes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update dish rating
router.patch('/:id/rating', async (req, res) => {
    try {
        const { rating, reviewCount } = req.body;
        const dishData = {
            rating: Number(rating),
            review_count: Number(reviewCount),
            average_rating: Number(rating)
        } as any; // Type assertion to bypass type checking
        const dish = await updateDocument('dishes', req.params.id, dishData);
        res.json(dish);
    } catch (error) {
        console.error('Error updating dish rating:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get reviews by dish
router.get('/:dishId/reviews', async (req, res) => {
    try {
        const dishRef = db.collection('dishes').doc(req.params.dishId);

        const snapshot = await db.collection('reviews')
            .where('dish', '==', dishRef)
            .get();

        const reviews = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching dish reviews:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
