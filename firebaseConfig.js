// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCqFKY0BADp-lj3eWiLdUqpQ1iJoLSww-w",
  authDomain: "turftime-f5bb6.firebaseapp.com",
  projectId: "turftime-f5bb6",
  storageBucket: "turftime-f5bb6.firebasestorage.app",
  messagingSenderId: "858806636514",
  appId: "1:858806636514:web:4497f01033e13b33cf33bb",
  measurementId: "G-44BDPRTTDR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);