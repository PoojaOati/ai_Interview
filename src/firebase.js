// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDE834ei65zzMiHEj_jUBafPoTDazcFozc",
  authDomain: "aiinterviewanalyser.firebaseapp.com",
  projectId: "aiinterviewanalyser",
  storageBucket: "aiinterviewanalyser.firebasestorage.app",
  messagingSenderId: "87998785872",
  appId: "1:87998785872:web:8d557d468135ff00452455",
  measurementId: "G-QBV429W7KW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const analytics = getAnalytics(app);

export { auth, googleProvider,analytics };