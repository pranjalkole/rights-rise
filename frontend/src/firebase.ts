/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBs_OgQxibXXMXqmb1MzWfVI_OARvgThok",
  authDomain: "testing-ff0e3.firebaseapp.com",
  databaseURL:
    "https://testing-ff0e3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "testing-ff0e3",
  storageBucket: "testing-ff0e3.appspot.com",
  messagingSenderId: "619833076225",
  appId: "1:619833076225:web:a9db974e3fa32d68046e00",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export function registerUser(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      return userCredential;
    });
}
/* vim: set et sw=2: */
