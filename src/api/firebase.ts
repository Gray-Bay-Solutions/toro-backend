import admin from 'firebase-admin';
import { config } from '../config';

admin.initializeApp({
  credential: admin.credential.cert(config.firebaseServiceAccount as admin.ServiceAccount),
  databaseURL: config.firebaseDatabaseUrl,
});

export const db = admin.firestore();
