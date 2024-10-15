
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, query, orderBy, onSnapshot, serverTimestamp, getDocs, getDoc, where, deleteDoc, updateDoc, } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
const firebaseConfig = {
    apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
    authDomain: "mood-flow.firebaseapp.com",
    projectId: "mood-flow",
    storageBucket: "mood-flow.appspot.com",
    messagingSenderId: "394015348209",
    appId: "1:394015348209:web:62d0ee52d026b7da78e050",
    measurementId: "G-EXYMMZXCZF"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { db, auth, collection, addDoc, setDoc, doc, query, orderBy, onSnapshot, serverTimestamp, getDocs, getDoc, where, deleteDoc, updateDoc, storage, getStorage }