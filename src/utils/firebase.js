
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, } from "firebase/firestore";
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



const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
export { addDoc, auth, collection, db, deleteDoc, doc, getDoc, getDocs, getStorage, onSnapshot, orderBy, query, serverTimestamp, setDoc, storage, updateDoc, where };
