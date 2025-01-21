import { db } from '../api/firebase';
import admin from 'firebase-admin';
import { JSDOM } from 'jsdom';

interface DishReview {
  reviewer_name: string;
  reviewer_location: string;
  rating: number;
  review_date: string;
  review_text: string;
  review_count: number;
  photo_count: number;
  dish_id: admin.firestore.DocumentReference;
  created_at: admin.firestore.FieldValue;
  updated_at: admin.firestore.FieldValue;
}

const deleteAllDishes = async () => {
  console.log('Deleting all existing dishes and reviews...');

  // Delete all dish reviews first
  const reviewsSnapshot = await db.collection('external_dish_reviews').get();
  const reviewDeletions = reviewsSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(reviewDeletions);

  // Then delete all dishes
  const dishesSnapshot = await db.collection('dishes').get();
  const dishDeletions = dishesSnapshot.docs.map(doc => doc.ref.delete());
  await Promise.all(dishDeletions);

  console.log('Successfully deleted all dishes and reviews');
};

const processRestaurantMenusAndReviews = async (restaurantId: string) => {
  try {
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    const restaurantData = restaurantDoc.data();

    if (!restaurantData?.website || !restaurantData.website.includes('yelp.com')) {
      console.log(`Restaurant ${restaurantId} has no valid Yelp website`);
      return;
    }

    // Try to find menu link and navigate to menu page
    const response = await fetch(restaurantData.website);
    const html = await response.text();
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Look for menu link
    const menuLink = doc.querySelector('a[href*="/menu/"]');
    if (!menuLink) {
      console.log(`No menu link found for restaurant ${restaurantId}`);
      return;
    }

    // Fetch menu page
    const menuUrl = new URL(menuLink.getAttribute('href') || '', restaurantData.website).href;
    const menuResponse = await fetch(menuUrl);
    const menuHtml = await menuResponse.text();
    const menuDom = new JSDOM(menuHtml);
    const menuDoc = menuDom.window.document;

    // Process each menu section
    const menuSections = menuDoc.querySelectorAll('.section-header');
    for (const section of menuSections) {
      const sectionName = section.querySelector('h2')?.textContent?.trim() || '';
      const menuItems = section.nextElementSibling?.querySelectorAll('.menu-item') || [];

      for (const item of menuItems) {
        const name = item.querySelector('h4')?.textContent?.trim();
        const description = item.querySelector('.menu-item-details-description')?.textContent?.trim();
        const price = item.querySelector('.menu-item-price-amount')?.textContent?.trim();
        const imageElement = item.querySelector('.photo-box-img') as HTMLImageElement;
        const imageUrl = imageElement?.src || '';

        if (name) {
          // Store dish in Firestore
          const dishRef = db.collection('dishes').doc();
          const dishData = {
            name,
            description: description || "",
            price: parseFloat(price?.replace('$', '') || '0'),
            image_url: imageUrl,
            section: sectionName,
            restaurant: restaurantDoc.ref,
            created_at: admin.firestore.FieldValue.serverTimestamp(),
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          };

          await dishRef.set(dishData);
          console.log(`Added dish: ${name}`);

          // Process reviews for this dish
          const reviewsLink = item.querySelector('h4 a')?.getAttribute('href');
          if (reviewsLink) {
            const reviewsUrl = new URL(reviewsLink, restaurantData.website).href;
            const reviewsResponse = await fetch(reviewsUrl);
            const reviewsHtml = await reviewsResponse.text();
            const reviewsDom = new JSDOM(reviewsHtml);
            const reviewsDoc = reviewsDom.window.document;

            const reviews = reviewsDoc.querySelectorAll('.review');
            for (const review of reviews) {
              const reviewerName = review.querySelector('.user-display-name')?.textContent?.trim();
              const reviewerLocation = review.querySelector('.user-location b')?.textContent?.trim();
              const ratingClass = review.querySelector('.i-stars')?.className || '';
              const rating = parseInt(ratingClass.match(/i-stars--regular-(\d)/)?.[1] || '0');
              const reviewDate = review.querySelector('.rating-qualifier')?.textContent?.trim();
              const reviewText = review.querySelector('.review-content p')?.textContent?.trim();

              if (reviewerName && reviewText) {
                const reviewData: DishReview = {
                  reviewer_name: reviewerName,
                  reviewer_location: reviewerLocation || '',
                  rating,
                  review_date: reviewDate || '',
                  review_text: reviewText,
                  review_count: 0, // Update with actual count if available
                  photo_count: 0, // Update with actual count if available
                  dish_id: dishRef,
                  created_at: admin.firestore.FieldValue.serverTimestamp(),
                  updated_at: admin.firestore.FieldValue.serverTimestamp()
                };

                await db.collection('external_dish_reviews').add(reviewData);
                console.log(`Added review from ${reviewerName} for ${name}`);
              }
            }
          }

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log(`Completed processing restaurant ${restaurantId}`);
  } catch (error) {
    console.error('Error processing restaurant:', error);
    throw error;
  }
};

// Execute for all restaurants
const processAllRestaurants = async () => {
  await deleteAllDishes();

  const restaurantsSnapshot = await db.collection('restaurants').get();

  for (const restaurantDoc of restaurantsSnapshot.docs) {
    console.log(`Processing restaurant ${restaurantDoc.id}...`);
    await processRestaurantMenusAndReviews(restaurantDoc.id);
  }
};

processAllRestaurants()
  .then(() => console.log('Completed processing all restaurants'))
  .catch(console.error);