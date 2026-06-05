import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { getStorage }    from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";
import { getAnalytics }  from "https://www.gstatic.com/firebasejs/12.14.0/firebase-analytics.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAmx7Lp4zGS_mYIy_oV5ZZpEQ2sEWnmslU",
  authDomain:        "bit-fc.firebaseapp.com",
  projectId:         "bit-fc",
  storageBucket:     "bit-fc.firebasestorage.app",
  messagingSenderId: "861171214790",
  appId:             "1:861171214790:web:f9955c0b279a3ff5832ac7",
  measurementId:     "G-9YEN5JMCSE",
};

const app       = initializeApp(firebaseConfig);
const auth      = getAuth(app);
const db        = getFirestore(app);
const storage   = getStorage(app);
const analytics = getAnalytics(app);
export const CLOUDINARY_CLOUD_NAME = "dgaupqhi0";
export const CLOUDINARY_UPLOAD_PRESET = "bitfc_unsigned";
export { app, auth, db, storage, analytics };