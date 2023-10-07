/**
 *
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License only.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import { auth } from "./firebase.ts"
import { sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth"
import "./login.css"

const login_form = document.querySelector("form#login")!;
const email: HTMLFormElement = login_form.querySelector("input[type=email]")!;
const password: HTMLFormElement = login_form.querySelector("input[type=password]")!;
let isPasswordResetForm = false;

login_form.addEventListener("submit", (e: Event) => {
  e.preventDefault();
  if (isPasswordResetForm) {
    sendPasswordResetEmail(auth, (login_form.querySelector("#email-forgot-password")! as HTMLFormElement).value)
      .then(() => {
        alert("Link to reset password sent to your email");
        window.location.reload();
      })
      .catch((error) => {
        let message;
        if (error.code == "auth/user-not-found") {
          message = "User not found. Please register before logging in";
        } else if (error.code == "auth/invalid-email") {
          message = "Invalid email address";
        } else if (error.code === "auth/network-request-failed") {
          message = "A network error has occurred. Check your internet connection and see if firebase is blocked";
        } else if (error.code === "auth/too-many-requests") {
          message = "Too many requests, try again later";
        } else {
          message = "Bug in application or firebase, see console";
          console.log(error);
        }
        alert(message);
        window.location.reload();
      });
    return;
  }

  const loader: HTMLElement = login_form.querySelector(".loader")!;
  loader.style.display = "flex";
  signInWithEmailAndPassword(auth, email.value, password.value)
    .then((userCredential) => {
      console.log(userCredential);
      if (!userCredential.user.emailVerified) {
        sendEmailVerification(userCredential.user).then(() => {
          loader.style.display = "none";
          (login_form.querySelector(".container")! as HTMLElement).style.display = "none";
          (login_form.querySelector(".verification")! as HTMLElement).style.display = "flex";
        });
      } else {
        loader.style.display = "none";
        (login_form.querySelector(".container")! as HTMLElement).style.display = "none";
        (login_form.querySelector(".success")! as HTMLElement).style.display = "flex";
      }
    })
    .catch((error) => {
      let message;
      if (error.code == "auth/user-not-found") {
        message = "User not found. Please register before logging in";
      } else if (error.code == "auth/invalid-email") {
        message = "Invalid email address";
      } else if (error.code === "auth/network-request-failed") {
        message = "A network error has occurred. Check your internet connection and see if firebase is blocked";
      } else if (error.code === "auth/too-many-requests") {
        message = "Too many requests, try again later";
      } else {
        message = "Bug in application or firebase, see console";
        console.log(error);
      }
      alert(message);
      loader.style.display = "none";
    });
});

login_form.querySelector("#forgot-password-link")!.addEventListener("click", (e) => {
  e.preventDefault();
  login_form.innerHTML = `
  <h1>Reset Password</h1>
  <div class="input-container">
    <label for="email-forgot-password">Email</label>
    <input
      type="email"
      name="email-forgot-password"
      id="email-forgot-password"
      required
    />
  </div>
  <input type="submit" value="Send Reset Link" />
  <hr class="or" />
  <a href="login.html" class="login-flow">Login</a>
  `;
  isPasswordResetForm = true;
});
