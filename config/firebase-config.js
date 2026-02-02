// config/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase config (PILOTO)
const firebaseConfig = {
  apiKey: "AIzaSyDQ-8k7RxEnEaHiol44tItaf2WIWTGMaYk",
  authDomain: "finanzas-pwa-saas-pilot.firebaseapp.com",
  projectId: "finanzas-pwa-saas-pilot",
  storageBucket: "finanzas-pwa-saas-pilot.firebasestorage.app",
  messagingSenderId: "913318950195",
  appId: "1:913318950195:web:dad75e9cc5061163103a46"
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Init Firestore (ESTO FALTABA)
const db = getFirestore(app);

// Exponer globalmente
window.firebaseApp = app;
window.db = db;

console.log("🔥 Firebase OK:", app.options.projectId);
