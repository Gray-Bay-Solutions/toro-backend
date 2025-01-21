import { Router, Request, Response } from 'express';
import { db } from '../api/firebase';
import { firestore } from 'firebase-admin';

const router = Router();

// Generic CRUD operations for any collection
const createDocument = async (collection: string, data: any) => {
  const docRef = await db.collection(collection).add({
    ...data,
    createdAt: firestore.Timestamp.now(),
    updatedAt: firestore.Timestamp.now()
  });
  return { id: docRef.id, ...data };
};

const updateDocument = async (collection: string, id: string, data: any) => {
  await db.collection(collection).doc(id).update({
    ...data,
    updatedAt: firestore.Timestamp.now()
  });
  return { id, ...data };
};

// Cities Endpoints
router.get('/cities', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('cities').get();
    const cities = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/cities', async (req: Request, res: Response) => {
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
    res.status(500).send('Internal Server Error');
  }
});

router.put('/cities/:id', async (req: Request, res: Response) => {
  try {
    const city = await updateDocument('cities', req.params.id, req.body);
    res.json(city);
  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.delete('/cities/:id', async (req: Request, res: Response) => {
  try {
    await db.collection('cities').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Restaurants Endpoints
router.get('/restaurants', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('restaurants').get();
    const restaurants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/restaurants', async (req: Request, res: Response) => {
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
    res.status(500).send('Internal Server Error');
  }
});

router.put('/restaurants/:id', async (req: Request, res: Response) => {
  try {
    const restaurant = await updateDocument('restaurants', req.params.id, req.body);
    res.json(restaurant);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.delete('/restaurants/:id', async (req: Request, res: Response) => {
  try {
    await db.collection('restaurants').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get reviews by restaurant
router.get('/restaurants/:id/reviews', async (req: Request, res: Response) => {
  try {
    // Get pagination parameters from query string
    const limit = parseInt(req.query.limit as string) || 10;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    // Get sorting parameters
    // const sortBy = (req.query.sortBy as string) || 'timestamp';
    // const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Create the base query
    let query = db.collection('reviews')
      .where('restaurant_id', '==', req.params.id);
      // .orderBy(sortBy, sortOrder);

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
      // Ensure timestamp is serializable
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
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error
    });
  }
});

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
router.get('/reviews', async (req: Request, res: Response) => {
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

// Users Endpoints
router.get('/users', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Internal Server Error');
  }
});

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

// Dishes Endpoints
router.get('/dishes', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('dishes').get();
    const dishes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(dishes);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/dishes', async (req: Request, res: Response) => {
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
    res.status(500).send('Internal Server Error');
  }
});

router.put('/dishes/:id', async (req: Request, res: Response) => {
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
    res.status(500).send('Internal Server Error');
  }
});

router.delete('/dishes/:id', async (req: Request, res: Response) => {
  try {
    await db.collection('dishes').doc(req.params.id).delete();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get dishes by restaurant
router.get('/dishes/restaurant/:restaurantId', async (req: Request, res: Response) => {
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
    res.status(500).send('Internal Server Error');
  }
});

// Get dishes by city
router.get('/dishes/city/:cityId', async (req: Request, res: Response) => {
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
    res.status(500).send('Internal Server Error');
  }
});

// Update dish rating
router.patch('/dishes/:id/rating', async (req: Request, res: Response) => {
  try {
    const { rating, reviewCount } = req.body;
    const dish = await updateDocument('dishes', req.params.id, {
      rating: Number(rating),
      review_count: Number(reviewCount),
      average_rating: Number(rating)
    });
    res.json(dish);
  } catch (error) {
    console.error('Error updating dish rating:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Get reviews by dish
router.get('/dishes/:dishId/reviews', async (req: Request, res: Response) => {
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