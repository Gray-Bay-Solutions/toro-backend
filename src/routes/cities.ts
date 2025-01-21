import { Router } from 'express';
import { db } from '../api/firebase';
import { createDocument, updateDocument } from '../utils/firestore';

const router = Router();

// Cities Endpoints
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('cities').get();
        const cities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(cities);
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const cityData = {
            name: req.body.name,
            state: req.body.state,
            country: req.body.country,
            status: 'Pending',
            totalRestaurants: 0,
            lastScraped: null,
            scrapingEnabled: true
        };
        const city = await createDocument('cities', cityData);
        res.status(201).json(city);
    } catch (error) {
        console.error('Error creating city:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const city = await updateDocument('cities', req.params.id, req.body);
        res.json(city);
    } catch (error) {
        console.error('Error updating city:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await db.collection('cities').doc(req.params.id).delete();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting city:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;