/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase – Onirico Studio OS (progetto oniricoapp-48953)
 * Auth Google + Realtime Database per il controllo accessi.
 * L'apiKey web NON è un segreto: la sicurezza vera viene dalle
 * regole del Database (vedi README → "Regole di sicurezza").
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
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  onValue
} from 'firebase/database';

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
export const db = getDatabase(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logoutGoogle = () => signOut(auth);
export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

// ---- Helper Realtime Database (nodo "accounts") ----
const ACCOUNTS = 'accounts';

export const accountsPath = ACCOUNTS;
export const watchAccounts = (cb: (val: Record<string, any>) => void) =>
  onValue(ref(db, ACCOUNTS), (snap) => cb(snap.val() || {}));
export const getAccounts = async () => (await get(ref(db, ACCOUNTS))).val() || {};
export const setAccount = (uid: string, data: any) => set(ref(db, `${ACCOUNTS}/${uid}`), data);
export const updateAccount = (uid: string, patch: any) => update(ref(db, `${ACCOUNTS}/${uid}`), patch);
export const removeAccount = (uid: string) => remove(ref(db, `${ACCOUNTS}/${uid}`));

export type { User };
