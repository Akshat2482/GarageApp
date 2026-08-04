// src/config.ts
//
// Fill this in with your own Firebase Realtime Database details:
//   DATABASE_URL     -- shown at the top of the Realtime Database
//                        page in the Firebase console, e.g.
//                        "https://your-project-default-rtdb.firebaseio.com"
//   DATABASE_SECRET  -- from Project settings -> Service accounts ->
//                        Database secrets (legacy) -> Show
//
// SECURITY NOTE: this secret is embedded directly in the app bundle,
// which means anyone who decompiled the app could extract it and read
// or write your database directly. For a personal single-user app
// like this one, that's a reasonable tradeoff to keep things simple.
// If this app is ever shared with anyone else or published publicly,
// switch to Firebase Authentication + per-user security rules instead
// of a shared legacy secret.

export const FIREBASE_CONFIG = {
  DATABASE_URL: 'https://garagecontroller-593f2-default-rtdb.firebaseio.com',
  DATABASE_SECRET: 'N4nIXKzkrCW4QuwWXu6BnKcxOHJlqiTvIVCocdr4',
};
