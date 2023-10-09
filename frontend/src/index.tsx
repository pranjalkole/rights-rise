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

let displayName: string;
let email: string;
let role: string;
let emailVerified: boolean;

function Header({ signedIn, handleLogout }: { signedIn: boolean, handleLogout: React.MouseEventHandler<HTMLAnchorElement> }) {
  return (
    <header>
      <h1>RightsRise</h1>
      {signedIn ?
      <div>
        <>{displayName} ({role})</>
        |
        <a href="#" onClick={handleLogout}>Logout</a>
      </div> :
      <div>
        <a href="/login.html">Login</a>
        |
        <a href="/register.html">Register</a>
      </div>}
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

function Spinner() {
  return (
    <div className="loader">
      <div className="spinner"></div>
    </div>
  )
}

function App() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setLoading(true);
      if (!user) {
        setSignedIn(false);
        setLoading(false);
        return;
      }
      displayName = user.displayName!;
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
          setLoading(false);
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
          setLoading(false);
        });
      }).catch((error) => {
        alert("Could not fetch role from sqlite database, see console");
        console.log(error);
      });
    });
  }, []);

  function handleLogout() {
    setLoading(true);
    signOut(auth).then(() => {
      setLoading(false);
    }).catch((error) => {
      let message;
      if (error.code == "auth/network-request-failed") {
        message = "A network error has occurred. Check your internet connection and see if firebase is blocked";
      } else {
        message = "Bug in application or firebase, see console";
        console.log(error);
      }
      alert(message);
      setLoading(false);
    });
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <>
      <Header signedIn={signedIn} handleLogout={handleLogout} />
      {signedIn ?
      <>
        <p>
          Signed in as {email} ({role}). Your email is {!emailVerified && <>not</>} verified
        </p>
        <a href="#" onClick={handleLogout}>Logout</a>
      </>
        :
      <p>You are logged out</p>}
      <Footer />
    </>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
/* vim: set et sw=2: */
