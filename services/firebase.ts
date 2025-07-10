// Import the functions you need from the SDKs you need
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAc8gonabArtWMgLjPl39UXe9VMq6DEGj0",
  authDomain: "dentsync-6dd0d.web.app",
  projectId: "dentsync-6dd0d",
  storageBucket: "dentsync-6dd0d.firebasestorage.app",
  messagingSenderId: "487234268549",
  appId: "1:487234268549:web:b8379d300972c64cde28ec"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const googleProvider = new firebase.auth.GoogleAuthProvider();