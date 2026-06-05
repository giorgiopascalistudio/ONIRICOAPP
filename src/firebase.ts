/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase – Onirico Studio OS (progetto oniricoapp-48953)
 * Config reale già inserita. L'apiKey web NON è un segreto: è
 * visibile nel sorgente di ogni sito Firebase; la sicurezza vera
 * viene dalle regole di Auth/Database.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDzhJBHWFTWnU86Mx9i-Z-uJmYUJTXrF3k',
  authDomain: 'oniricoapp-48953.firebaseapp.com',
  databaseURL: 'https://oniricoapp-48953-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'oniricoapp-48953',
  storageBucket: 'oniricoapp-48953.firebasestorage.app',
  messagingSenderId: '471588067505',
  appId: '1:471588067505:web:52f03aeed3da5b6ac3aa90'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logoutGoogle = () => signOut(auth);
export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

export type { User };
