// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from  "firebase/firestore" 
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAAlVl1QkpHWPYi-KnsN0dc6w8rOCo3zI0",
  authDomain: "inventory-management-f30e6.firebaseapp.com",
  projectId: "inventory-management-f30e6",
  storageBucket: "inventory-management-f30e6.appspot.com",
  messagingSenderId: "694129102462",
  appId: "1:694129102462:web:e27659f55dba7bb279922f",
  measurementId: "G-XS3JPX2LG5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, firestore };