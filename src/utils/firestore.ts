import { db } from '../api/firebase';
import { firestore } from 'firebase-admin';

interface BaseDocument {
  createdAt?: firestore.Timestamp;
  updatedAt?: firestore.Timestamp;
}

export const createDocument = async <T extends BaseDocument>(
  collection: string,
  data: Omit<T, 'createdAt' | 'updatedAt'>
): Promise<T & { id: string }> => {
  const timestamp = firestore.Timestamp.now();
  const docRef = await db.collection(collection).add({
    ...data,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  return {
    id: docRef.id,
    ...data as T,
    createdAt: timestamp,
    updatedAt: timestamp
  };
};

export const updateDocument = async <T extends BaseDocument>(
  collection: string,
  id: string,
  data: Partial<T>
): Promise<T & { id: string }> => {
  const timestamp = firestore.Timestamp.now();
  const updateData = {
    ...data,
    updatedAt: timestamp
  };

  await db.collection(collection).doc(id).update(updateData);
  return {
    id,
    ...data as T,
    updatedAt: timestamp
  };
}; 