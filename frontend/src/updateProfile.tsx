/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 */

import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import ProfilePictureUpload from "./components/profilePicUpload.tsx";
import "./form.css";
import "./all.css";

function Spinner({ style }: { style: React.CSSProperties }) {
  return (
    <div className="loader" style={style}>
      <div className="spinner"></div>
    </div>
  );
}

function Header() {
  return (
    <header className="flexbox">
      <a href="/" id="home-link">
        <i className="fa-solid fa-house" aria-hidden="true"></i>
      </a>
      <h1>RightsRise</h1>
    </header>
  );
}

function FormElement() {
  enum State {
    Loading,
    Form,
    Success,
  }
  const [state, setState] = useState(State.Form);
  // const [role, setRole] = useState(Role.User);

  if (state == State.Success) {
    return (
      <form id="updateProfile" className="main-form">
        <div className="successful flexbox">
          <i className="fas fa-check-circle"></i>
          <h2>Profile Updated Successfully</h2>

          <a href="/" className="login-flow">
            Home
          </a>
        </div>
      </form>
    );
  }

  function formSubmit(e: React.FormEvent<HTMLFormElement>) {
    setState(State.Loading);
    e.preventDefault();
    // The below Line uploads the image to firebase database. Please see handleUpload function of profilePicUpload.jsx
    (document.querySelector(".profilePicEdit > button") as HTMLElement).click();
    // TODO: Send request to backend
  }

  return (
    <form id="updateProfile" className="main-form" onSubmit={formSubmit}>
      <div className="container flexbox">
        <h1>Update Profile</h1>
        <ProfilePictureUpload />
        <hr />
        <div className="input-container">
          <label htmlFor="name">Name</label>
          <input type="text" name="name" id="name" required />
        </div>
        <div className="input-container age-input">
          <label htmlFor="age">Age</label>
          <input type="number" name="age" id="age" required />
        </div>
      </div>

      <input type="submit" value="Save" />

      {state == State.Loading && <Spinner style={{ display: "flex" }} />}
    </form>
  );
}
function UpdateProfile() {
  return (
    <>
      <Header></Header>
      <FormElement></FormElement>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UpdateProfile />
  </React.StrictMode>
);
