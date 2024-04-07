import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCDxiqzHnOMsW0CaKV7sZCZPmDjy81XZRM",
  authDomain: "space-sculpt.firebaseapp.com",
  databaseURL: "https://space-sculpt-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "space-sculpt",
  storageBucket: "space-sculpt.appspot.com",
  messagingSenderId: "12751064898",
  appId: "1:12751064898:web:951cca50b5dbbae42c42db",
  measurementId: "G-VB8G0DNZVN"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);