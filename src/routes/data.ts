import { Router, Request, Response } from 'express';
import { db } from '../api/firebase';

const router = Router();

router.get('/data', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('users').get();
    const data = snapshot.docs.map(doc => doc.data());
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
