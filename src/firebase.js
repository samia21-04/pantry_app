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
  apiKey: "AIzaSyAsVsOwuK4vgpL-KioCe0lnVvLN3Eo287E",
  authDomain: "pantry-pals-1802d.firebaseapp.com",
  projectId: "pantry-pals-1802d",
  storageBucket: "pantry-pals-1802d.firebasestorage.app",
  messagingSenderId: "59023466980",
  appId: "1:59023466980:web:bad0ec2f2ff1514c2627f1",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
