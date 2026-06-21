// src/firebase.js
// ─────────────────────────────────────────────────────────
// STEP 1: Go to https://console.firebase.google.com
// STEP 2: Create a project → Add a Web App → copy the config below
// STEP 3: In Firebase Console → Firestore Database → Create database (start in test mode)
// STEP 4: Replace the placeholder values below with your real config
// ─────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
