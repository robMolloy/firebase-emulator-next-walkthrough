// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSTs7Lj0jmNn6Y0wrz-KSKVWN6DXusy-Q",
  authDomain: "next-firebase-emulator.firebaseapp.com",
  projectId: "next-firebase-emulator",
  storageBucket: "next-firebase-emulator.appspot.com",
  messagingSenderId: "1064012878807",
  appId: "1:1064012878807:web:76cdd163fc5277b2ceb192",
  measurementId: "G-V4DV7EWKPV",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

export const auth = getAuth();
const initDb = getFirestore(app);
connectFirestoreEmulator(initDb, "127.0.0.1", 8080);
export const db = initDb;
