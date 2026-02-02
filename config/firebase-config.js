// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

// Firebase configuration (PILOTO)
const firebaseConfig = {
  apiKey: "AIzaSyDQ-8k7RxEnEaHiol44tItaf2WIWTGMaYk",
  authDomain: "finanzas-pwa-saas-pilot.firebaseapp.com",
  projectId: "finanzas-pwa-saas-pilot",
  storageBucket: "finanzas-pwa-saas-pilot.firebasestorage.app",
  messagingSenderId: "913318950195",
  appId: "1:913318950195:web:dad75e9cc5061163103a46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Exponer app globalmente para el resto de la PWA
window.firebaseApp = app;
