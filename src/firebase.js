import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCo7VtPW4B7STcSeI8O2QqIskE4Pl2wrJY",
  authDomain: "chat-app-d6cd8.firebaseapp.com",
  projectId: "chat-app-d6cd8",
  storageBucket: "chat-app-d6cd8.firebasestorage.app",
  messagingSenderId: "982497387043",
  appId: "1:982497387043:web:cb1f04165b0cc1413e8796"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { 
  db, 
  auth, 
  provider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
};