import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


import { getFirestore }
from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";



const firebaseConfig = {

apiKey: "AIzaSyBM28cOyNvy-fXzFcr8vJZGLbqxqCNNZbc",

authDomain: "papa-ka-radio.firebaseapp.com",

projectId: "papa-ka-radio",

storageBucket: "papa-ka-radio.firebasestorage.app",

messagingSenderId: "542060558426",

appId: "1:542060558426:web:9ca56a06a9afa63d128063"

};



const app = initializeApp(firebaseConfig);



const db = getFirestore(app);



export { db };