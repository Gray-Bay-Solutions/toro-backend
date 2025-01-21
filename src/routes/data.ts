import { Router, Request, Response } from 'express';
import { db } from '../api/firebase';
import { firestore } from 'firebase-admin';

export const router = Router();

// Scraping Control Endpoints
router.post('/scraping/start', async (req: Request, res: Response) => {
  try {
    const { cityId } = req.body;
    // Update city status
    await db.collection('cities').doc(cityId).update({
      status: 'Scraping',
      lastScraped: firestore.Timestamp.now()
    });
    // Start your scraping process here
    // You might want to trigger a background job or queue
    res.json({ message: 'Scraping started' });
  } catch (error) {
    console.error('Error starting scraping:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/scraping/stop', async (req: Request, res: Response) => {
  try {
    const { cityId } = req.body;
    await db.collection('cities').doc(cityId).update({
      status: 'Active'
    });
    // Stop your scraping process here
    res.json({ message: 'Scraping stopped' });
  } catch (error) {
    console.error('Error stopping scraping:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Dashboard Stats Endpoint
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const citiesSnapshot = await db.collection('cities').get();
    const restaurantsSnapshot = await db.collection('restaurants').get();
    const usersSnapshot = await db.collection('users').get();
    const reviewsSnapshot = await db.collection('reviews').get();
    const dishesSnapshot = await db.collection('dishes').get(); // Add dishes snapshot

    const stats = {
      totalCities: citiesSnapshot.size,
      totalRestaurants: restaurantsSnapshot.size,
      totalUsers: usersSnapshot.size,
      totalReviews: reviewsSnapshot.size,
      totalDishes: dishesSnapshot.size, // Add total dishes
      activeCities: citiesSnapshot.docs.filter(doc => doc.data().status === 'Active').length,
      averageRating: calculateAverageRating(restaurantsSnapshot.docs),
      averageDishRating: calculateAverageRating(dishesSnapshot.docs), // Add average dish rating
      recentActivity: await getRecentActivity(),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Helper Functions
function calculateAverageRating(restaurants: firestore.QueryDocumentSnapshot[]) {
  const totalRating = restaurants.reduce((sum, doc) => sum + (doc.data().rating || 0), 0);
  return totalRating / restaurants.length || 0;
}

async function getRecentActivity() {
  const snapshot = await db.collection('activityLog')
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get();

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export default router;