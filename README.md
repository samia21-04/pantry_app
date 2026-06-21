# 🛒 Pantry Pals

A real-time collaborative grocery list app built with React + Firebase + Vite, deployable on Vercel.

---

## Features
- Google Sign-In (no passwords needed)
- Multiple lists per account
- Add items with quantity, category, and notes
- Check off items with a live progress bar
- Invite collaborators by email — they see changes instantly (Firestore real-time sync)
- Filter by category or checked/unchecked status
- Secure: only list members can read/write their lists

---

## Setup (do this once)

### 1. Firebase Project
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it `pantry-pals` → Continue
3. **Disable** Google Analytics (optional) → Create project

### 2. Enable Authentication
1. In the Firebase console → **Authentication** → Get Started
2. Click **Google** under Sign-in providers → Enable → Save

### 3. Enable Firestore
1. **Firestore Database** → Create database
2. Choose **Start in test mode** for now → Next → Enable
3. After setup, go to **Rules** tab and paste the contents of `firestore.rules`

### 4. Register your Web App
1. Project Overview → click the **</>** (Web) icon
2. Register app name `pantry-pals` → Register
3. Copy the `firebaseConfig` object shown

### 5. Add your config
Open `src/firebase.js` and replace the placeholder values with your real config:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "pantry-pals-xxxxx.firebaseapp.com",
  projectId: "pantry-pals-xxxxx",
  storageBucket: "pantry-pals-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

### 6. Enable your domain in Firebase Auth
After deploying to Vercel, add your `.vercel.app` domain:
- Firebase Console → Authentication → Settings → Authorized domains → Add domain

---

## Run locally

```bash
npm install
npm run dev
```

Visit http://localhost:5173

---

## Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
npm run build
vercel deploy --prod
```

Or connect your GitHub repo to Vercel for automatic deploys on every push.

---

## How collaboration works

1. You create a list
2. Tap **Invite** → enter a collaborator's Gmail address
3. When they log in to the app, the list appears in their tabs automatically
4. Any change (add item, check off, delete) syncs to everyone in real time via Firestore

---

## Project structure

```
pantry-pals/
├── index.html
├── vite.config.js
├── package.json
├── firestore.rules        ← paste into Firebase Console
└── src/
    ├── main.jsx
    ├── firebase.js        ← ADD YOUR FIREBASE CONFIG HERE
    └── App.jsx            ← all UI and logic
```
