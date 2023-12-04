/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 */

import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase.ts";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./all.css";
import "../style.css";

let email;
let idToken;

function App() {
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/login.html";
        return;
      }
      console.log(user);
      email = user.email!;
      idToken = await user.getIdToken(); /* TODO: wrap in try catch */
      const data = {
        email: email,
        idtoken: idToken,
      };
      await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          if (response.status !== 200) {
            alert("Email does not exist in database"); // TODO
            return;
          }
          response.json().then((data) => {
            setDisplayName(data.displayName);
            console.log(data);
          });
        })
        .catch((error) => {
          alert("Could not fetch role from database, see console");
          console.log(error);
          return;
        });
    });
  }, []);
  function handleLogout() {
    signOut(auth)
      .then(() => {
        window.location.href = "/login.html";
      })
      .catch((error) => {
        let message;
        if (error.code == "auth/network-request-failed") {
          message =
            "A network error has occurred. Check your internet connection and see if firebase is blocked";
        } else {
          message = "Bug in application or firebase, see console";
          console.log(error);
        }
        alert(message);
      });
  }
  if (displayName == "") {
    return <h1>Loading...</h1>;
  }
  return (
    <>
      <header>
        <h1>RightsRise</h1>
        <div className="flexbox nav">
          <a href="/updateProfile.html" className="updateProfile">
            <div className="fa fa-cog"></div>
          </a>
          <a href="#" onClick={handleLogout}>
            <div className="fa fa-sign-out"></div>
          </a>
        </div>
      </header>
      <div className="main flexbox">
        <div className="full-width flexbox summary">
          <img src="media/avatar.png" alt="" className="avatar" />

          <div className="info">
            <div className="name">{displayName}</div>
            <div className="institute">Himalaya Valley High School, Patna</div>
          </div>
          <div className="flexbox stats">
            <div className="flexbox hexagon points">
              <span>Points</span>
              <div id="points">1098</div>
            </div>
            <div className="flexbox hexagon rank">
              <span>Rank</span>
              <div id="rank">19</div>
            </div>
          </div>
        </div>
        <div className="half-width-container">
          <div className="flexbox half-width badges">
            <div className="title">Your Badges</div>
            <div className="flexbox">
              <img src="media/badges/l4.png" alt="badges" className="badge" />
              <img
                src="media/badges/active.png"
                alt="badges"
                className="badge"
              />
              <img
                src="media/badges/wizard.png"
                alt="badges"
                className="badge"
              />
              <img
                src="media/badges/contributor.png"
                alt="badges"
                className="badge"
              />
            </div>
          </div>
          <div className="flexbox half-width leaderboard">
            <div className="title">Leaderboard</div>
            <table>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Aarav Patel</span>
                </td>
                <td>1500</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Ananya Sharma</span>
                </td>
                <td>1458</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Aryan Gupta</span>
                </td>
                <td>1457</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Ishaan Verma</span>
                </td>
                <td>1300</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Neha Singh</span>
                </td>
                <td>1266</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Mira Patel</span>
                </td>
                <td>1266</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Rahul Kumar</span>
                </td>
                <td>1200</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Kavya Gupta</span>
                </td>
                <td>1195</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Aditya Joshi</span>
                </td>
                <td>1150</td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <img src="media/avatar.png" alt="profile photo" />
                  <span>Sanya Shah</span>
                </td>
                <td>1147</td>
              </tr>
            </table>
          </div>
          <div className="flexbox half-width tools">
            <div className="title">Tools</div>
          </div>
        </div>
      </div>
      <div className="flexbox bottom-nav">
        <a href="/">
          <span className="description">Home</span>
          <i className="fa fa-house"></i>
        </a>
        <a href="/quiz">
          <span className="description">Quiz</span>
          <i className="fa fa-list-check"></i>
        </a>
        <a href="/game" className="game-button">
          <i className="fa-solid fa-gamepad"></i>
        </a>
        <a href="/ask">
          <span className="description">Ask</span>
          <i className="fas fa-comments"></i>
        </a>
        <a href="/rewards">
          <span className="description">Rewards</span>
          <i className="fa-solid fa-award"></i>
        </a>
      </div>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
/* vim: set et sw=2: */
