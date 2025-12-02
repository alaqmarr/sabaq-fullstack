import "server-only";
import admin from "firebase-admin";

interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseURL: string;
}

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, "\n");
}

export function createFirebaseAdminApp(config: FirebaseAdminConfig) {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.projectId,
      clientEmail: config.clientEmail,
      privateKey: formatPrivateKey(config.privateKey),
    }),
    databaseURL: config.databaseURL,
  });
}

export function getFirebaseAdmin() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

  if (!projectId || !clientEmail || !privateKey || !databaseURL) {
    // console.warn("Firebase Admin credentials not found. Realtime features may fail.");
    return null;
  }

  try {
    return createFirebaseAdminApp({
      projectId,
      clientEmail,
      privateKey,
      databaseURL,
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    return null;
  }
}

export const adminDb = getFirebaseAdmin()?.database() || null;
