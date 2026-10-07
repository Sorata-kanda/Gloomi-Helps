import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC6tC-R5LilxVsUUm5vRmj19hj0wfxXvAA",
    authDomain: "gloomi-cb8e2.firebaseapp.com",
    projectId: "gloomi-cb8e2",
    storageBucket: "gloomi-cb8e2.firebasestorage.app",
    messagingSenderId: "805839974111",
    appId: "1:805839974111:web:e2e27acc86f88e9899c36a",
    measurementId: "G-WZRS6SZPT4",
};

const firebaseApp = initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);