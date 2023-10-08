/**
 *
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 *
 * The following code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3 of the License only.
 *
 * This code is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 */

import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "./firebase.ts"
import { Role } from "./misc.ts"
import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom/client"
import "./index.css"

let email: string;
let role: string;
let emailVerified: boolean;

function Header() {
  return (
    <header>
      <h1>RightsRise</h1>
    </header>
  )
}

function Footer() {
  return (
    <footer>
      <h1>Game Icon</h1>
    </footer>
  )
}

function App() {
  const [count, setCount] = useState(0)
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        setSignedIn(false);
        return;
      }

      email = user.email!;
      emailVerified = user.emailVerified;
      const data = {
        email: email
      }
      fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      }).then((response) => {
        if (response.status !== 200) {
          role = "Email does not exist in database"; // TODO
          return;
        }
        response.json().then((data) => {
          if (data.role === Role.User) {
            role = "User";
          } else if (data.role === Role.Admin) {
            role = "Admin";
          } else {
            role = "Bug in application, see console";
            console.log(data);
          }
          setSignedIn(true);
        });
      });
    });
  }, []);

  function handleLogout() {
    signOut(auth);
  }

  return (
    <>
      <Header />
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      {signedIn ?
      <p>
        Signed in as {email} ({role}). Your email is {!emailVerified && <>not</>} verified <br />
        <a href="#" onClick={handleLogout}>Logout</a>
      </p> :
      <p>You are logged out</p>}
      <a href="/login.html">Login</a>
      <br />
      <a href="/register.html">Register</a>
      <Footer />
    </>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
