import { Router, Request, Response } from 'express';
import { db } from '../api/firebase';

const router = Router();

// GET /bookmarks - Get all bookmarked restaurants for a user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get the list of bookmarked restaurant IDs for the user
    const bookmarksSnapshot = await db.collection('users')
      .doc(userId.toString())
      .collection('bookmarks')
      .get();

    const restaurantIds = bookmarksSnapshot.docs.map(doc => doc.data().restaurantId);

    if (restaurantIds.length === 0) {
      return res.json([]);
    }

    // Query the restaurants collection to get the restaurant documents
    const restaurantsRef = db.collection('restaurants');
    const restaurantDocs = await Promise.all(
      restaurantIds.map(restaurantId => restaurantsRef.doc(restaurantId).get())
    );

    const restaurants = restaurantDocs
      .filter(doc => doc.exists)
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
