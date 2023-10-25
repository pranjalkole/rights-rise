/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 */

// import { Role } from "./misc.ts";
import { registerUser } from "./firebase.ts";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./form.css";
import "./all.css";

function Spinner({ style }: { style: React.CSSProperties }) {
  return (
    <div className="loader" style={style}>
      <div className="spinner"></div>
    </div>
  );
}

function RegisterHead() {
  return (
    <header className="flexbox">
      <a href="/" id="home-link">
        <i className="fa-solid fa-house" aria-hidden="true"></i>
      </a>
      <h1>RightsRise</h1>
    </header>
  );
}

function RegisterBody() {
  enum State {
    Loading,
    Form,
    Success,
  }
  const [state, setState] = useState(State.Form);
  // const [role, setRole] = useState(Role.User);
  const [passwords, setPasswords] = useState(["", ""]);

  if (state == State.Success) {
    return (
      <form id="register" className="main-form">
        <div className="successful flexbox">
          <i className="fas fa-check-circle"></i>
          <h2>Registration successful</h2>
          <p>
            Email verification sent successfully. Please verify your email and
            login to continue.
          </p>
          <a href="login.html" className="login-flow">
            Login
          </a>
        </div>
      </form>
    );
  }

  // function roleChange(e: React.ChangeEvent<HTMLInputElement>) {
  //   if (e.target.value == "User") {
  //     setRole(Role.User);
  //   } else if (e.target.value == "Admin") {
  //     setRole(Role.Admin);
  //   } else {
  //     /* This should never happen */
  //     alert("Bug in application, see console");
  //     console.log("Invalid role", e.target.value);
  //   }
  // }

  function formSubmit(e: React.FormEvent<HTMLFormElement>) {
    setState(State.Loading);
    e.preventDefault();
    const email = e.currentTarget.email.value;
    const displayName = e.currentTarget.displayName.value;
    console.log(email);
    if (passwords[0] != passwords[1]) {
      alert("Password and Confirmed Password do not match!");
      return;
    }

    registerUser(email, passwords[0])
      .then(async (userCredential) => {
        const data = {
          email: email,
          displayName: displayName,
          // role: role,
          idtoken: await userCredential.user.getIdToken()
          // TODO: wrap in try catch
        };
        fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }).then((response) => {
          if (response.status == 422) {
            alert("Invalid form data");
            setState(State.Form);
            return;
          } else if (response.status != 201) {
            alert("Bug in application, see console");
            console.log(response);
            setState(State.Form);
            return;
          }
          setState(State.Success);
        });
      })
      .catch((error) => {
        let message;
        if (error.code === "auth/weak-password") {
          message =
            "The password is not strong enough. Password must be at least 6 characters long";
        } else if (error.code === "auth/email-already-in-use") {
          message = "Email is already registered. Please login to continue";
        } else if (error.code === "auth/invalid-email") {
          message = "The email address is not valid";
        } else if (error.code === "auth/network-request-failed") {
          message =
            "A network error has occurred. Check your internet connection and see if firebase is blocked";
        } else {
          message = "Bug in application or firebase, see console";
          console.log(error);
        }
        alert(message);
        setState(State.Form);
      });
  }

  function passwordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasswords([e.target.value, passwords[1]]);
  }

  function cnfpasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPasswords([passwords[0], e.target.value]);
  }

  return (
    <form id="register" className="main-form" onSubmit={formSubmit}>
      <div className="container flexbox">
        <h1>Register</h1>
        <div className="input-container">
          <label htmlFor="displayName">Display Name</label>
          <input type="text" name="displayName" id="displayName" required />
        </div>
        <div className="input-container">
          <label htmlFor="email">Email</label>
          <input type="email" name="email" id="email" required />
        </div>
        <div className="input-container">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            onChange={passwordChange}
            required
          />
        </div>
        <div className="input-container">
          <label htmlFor="cnfpassword">Confirm Password</label>
          <input
            type="password"
            name="cnfpassword"
            id="cnfpassword"
            onChange={cnfpasswordChange}
            required
          />
          {passwords[1] !== "" &&
            (passwords[0] === passwords[1] ? (
              <p id="password-matching">
                <i className="fa fa-check"></i>
              </p>
            ) : (
              <p id="password-matching" className="error">
                Passwords do not match
              </p>
            ))}
        </div>

        <input type="submit" value="Register" />
        <hr className="or" />
        <a href="login.html" className="login-flow">
          Login
        </a>
      </div>
      {state == State.Loading && <Spinner style={{ display: "flex" }} />}
    </form>
  );
}

function RegisterPage() {
  return (
    <>
      <RegisterHead />
      <RegisterBody />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RegisterPage />
  </React.StrictMode>
);
/* vim: set et sw=2: */
