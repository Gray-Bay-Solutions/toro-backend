import { Router, Request, Response } from 'express';
import YelpService, { SortBy } from '../api/yelp';
import { config } from '../config';

const router = Router();
const yelpService = new YelpService(config.yelpApiKey);

router.get('/business-search', async (req: Request, res: Response) => {
  const { location, sort_by, limit } = req.query;

  if (!location) {
    return res.status(400).send('Location is required');
  }

  const validSortBy: SortBy[] = ['best_match', 'rating', 'review_count', 'distance'];
  const sortByValidated = validSortBy.includes(sort_by as SortBy) ? (sort_by as SortBy) : 'best_match';

  try {
    const businesses = await yelpService.searchBusinesses(location as string, sortByValidated, parseInt(limit as string) || 20);
    res.json(businesses);
  } catch (error) {
    res.status(500).send('Failed to fetch Yelp data');
  }
});

export default router;
