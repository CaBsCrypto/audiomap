// ══════════════════════════════════════════════════════════════════
// ENJAMBRE 2 — FIREBASE CONFIG
// Inicialización de Firebase Auth + Firestore
// ══════════════════════════════════════════════════════════════════
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId:             import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
};

let app, auth, db, googleProvider;

const createMockDb = () => new Proxy({}, { get: () => () => ({}) });

try {
  // Verificación básica para evitar crash si el apiKey es un dummy de .env.example
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('xxxxxxxx')) {
    console.warn("⚠️ Firebase no se inicializó porque faltan claves en el .env");
    auth = { 
      onAuthStateChanged: (cb) => { 
        setTimeout(() => cb(null), 100); 
        return () => {}; 
      }
    };
    db = createMockDb();
    googleProvider = {};
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  }
} catch (error) {
  console.error("🔥 Error inicializando Firebase:", error);
  auth = { 
    onAuthStateChanged: (cb) => { 
      setTimeout(() => cb(null), 100); 
      return () => {}; 
    }
  };
  db = createMockDb();
  googleProvider = {};
}

export { auth, db, googleProvider };

// App ID para rutas de Firestore
export const APP_ID = import.meta.env.VITE_FIREBASE_APP_ID || 'audiomap-ia-dev';
