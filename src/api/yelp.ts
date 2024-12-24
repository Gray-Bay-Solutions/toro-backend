import yelpDevelopers from '@api/yelp-developers';

export type SortBy = 'best_match' | 'rating' | 'review_count' | 'distance' | undefined;

class YelpService {
  private sdk: typeof yelpDevelopers;

  constructor(apiKey: string) {
    this.sdk = yelpDevelopers;
    this.sdk.auth(`Bearer ${apiKey}`);
  }

  async getBusiness(id: string): Promise<any> {
    try {
      const response = await this.sdk.v3_business_info({
        business_id_or_alias: id,
      });
      return response.data;
    } catch (error) {
      console.error('Error searching business on Yelp:', error);
      throw error;
    }
  }

  async searchBusinesses(
    location: string,
    sortBy: SortBy = 'best_match',
    limit: number = 20,
    options: {
      offset?: number;
      term?: string;
      radius?: number;
    } = {}
  ): Promise<any> {
    try {
      const response = await this.sdk.v3_business_search({
        location,
        sort_by: sortBy,
        limit,
        offset: options.offset || 0,
        term: options.term || 'restaurants',
        radius: options.radius || 8000
      });
      return response.data;
    } catch (error) {
      console.error('Error searching businesses on Yelp:', error);
      throw error;
    }
  }
}

export default YelpService;
