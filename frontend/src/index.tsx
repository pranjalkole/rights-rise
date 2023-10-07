/** 
 *
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
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

import { _onAuthStateChanged } from "./firebase.ts"
import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import "./App.css"

enum Roles {
  User = 1,
  Admin
}

let email: string;
let role: string;

function App() {
  const [count, setCount] = useState(0)
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    return _onAuthStateChanged((user) => {
      if (!user) {
        setSignedIn(false);
        return;
      }

      email = user.email!;
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
          if (data.role === Roles.User) {
            role = "User";
          } else if (data.role === Roles.Admin) {
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

  return (
    <>
      <h1>RightsRise</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
      {signedIn &&
      <p>
        Signed in as {email} ({role})
      </p>}
      <a href="/login.html">Login</a>
      <br />
      <a href="/register.html">Register</a>
    </>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
