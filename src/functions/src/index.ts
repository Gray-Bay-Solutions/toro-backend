import * as functions from "firebase-functions/v2";

// Cloud function triggered on creation of a review document
export const updateDishReviewStats = functions.firestore
  .onDocumentCreated("reviews/{reviewId}", async (event) => {
    const newReview = event.data?.data();
    const dishRef = newReview?.dish;
    const rating = newReview?.rating;

    if (!dishRef || typeof rating !== "number") {
      console.error("Invalid review data: missing dish reference or rating");
      return;
    }

    try {
      // Fetch the referenced dish document
      const dishSnapshot = await dishRef.get();

      if (!dishSnapshot.exists) {
        throw new Error("Dish document not found from reference");
      }

      const dishData = dishSnapshot.data() || {};
      const currentReviewCount = dishData.review_count || 0;
      const currentAverageRating = dishData.average_rating || 0;

      // Calculate new review count and average rating
      const newReviewCount = currentReviewCount + 1;
      const newAverageRating =
        (currentAverageRating * currentReviewCount + rating) / newReviewCount;

      // Update the dish document with the new review count and average rating
      await dishRef.update({
        review_count: newReviewCount,
        average_rating: newAverageRating,
      });

      console.log(`Successfully updated dish with ID ${dishRef.id}`);
    } catch (error) {
      console.error("Error updating dish:", error);
    }
  });
