/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase – Onirico Studio OS
 * --------------------------------------------------------------
 * Incolla qui SOLO i 3 valori mancanti del tuo progetto Firebase
 * (apiKey, messagingSenderId, appId). Li trovi identici nel tuo
 * vecchio file HTML "onirico-studio-os.html" dentro l'oggetto
 * `firebaseConfig`, oppure su:
 *   Firebase Console → Impostazioni progetto → Le tue app (Web).
 *
 * I campi authDomain / projectId / storageBucket sono già
 * compilati con il progetto che usi (oniricoapp-48953).
 * --------------------------------------------------------------
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
  apiKey: 'INCOLLA_QUI_LA_TUA_API_KEY',
  authDomain: 'oniricoapp-48953.firebaseapp.com',
  projectId: 'oniricoapp-48953',
  storageBucket: 'oniricoapp-48953.appspot.com',
  messagingSenderId: 'INCOLLA_QUI_IL_SENDER_ID',
  appId: 'INCOLLA_QUI_L_APP_ID'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logoutGoogle = () => signOut(auth);
export const watchAuth = (cb: (u: User | null) => void) => onAuthStateChanged(auth, cb);

export type { User };
