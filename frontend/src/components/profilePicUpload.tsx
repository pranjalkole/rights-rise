/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 */

import { Component } from "react";

import "./profilePicUpload.css";

export default class ProfilePictureUpload extends Component {
  handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const reader = new FileReader();
    reader.onloadend = function () {
      console.log(e.target);

      document
        .querySelector(".profilePicEdit img")
        ?.setAttribute("src", reader.result?.toString() || "/avatar.png");

      console.log(reader.result);
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  render() {
    return (
      <div className="profilePicEdit">
        <label htmlFor="avatar">
          <img src="/avatar.png" height="100px"></img>
          <input
            name="avatar"
            id="avatar"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={this.handleUpload}
          />
        </label>
      </div>
    );
  }
}
/* vim: set et sw=2: */
