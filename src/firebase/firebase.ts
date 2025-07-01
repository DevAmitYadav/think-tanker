// by Amit Yadav: Firebase configuration and initialization for the Mind Mapping tool
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// by Amit Yadav: Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDKk57VubLIlGBrWEuL8G_sa9_eIgLAyg",
  authDomain: "mindmapping-db42c.firebaseapp.com",
  projectId: "mindmapping-db42c",
  storageBucket: "mindmapping-db42c.appspot.com",
  messagingSenderId: "856860486659",
  appId: "1:856860486659:web:da3392109402420c07b236",
  measurementId: "G-34WY4JLKSW"
};

// by Amit Yadav: Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
