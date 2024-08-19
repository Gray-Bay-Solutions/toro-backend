import yelpDevelopers from '@api/yelp-developers';

export type SortBy = 'best_match' | 'rating' | 'review_count' | 'distance' | undefined;

class YelpService {
  private sdk: typeof yelpDevelopers;

  constructor(apiKey: string) {
    this.sdk = yelpDevelopers;
    this.sdk.auth(`Bearer ${apiKey}`);
  }

  async searchBusinesses(location: string, sortBy: SortBy = 'best_match', limit: number = 20) {
    try {
      const response = await this.sdk.v3_business_search({
        location: location,
        sort_by: sortBy,
        limit: limit,
      });
      return response.data;
    } catch (error) {
      console.error('Error searching businesses on Yelp:', error);
      throw error;
    }
  }
}

export default YelpService;
