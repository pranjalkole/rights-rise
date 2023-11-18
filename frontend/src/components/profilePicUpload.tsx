/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 */

import React, { Component } from "react";

import "./profilePicUpload.css";

export default class ProfilePictureUpload extends Component {
  private profilePictureRef = React.createRef<ProfilePicture>();

  handleUpload = () => {
    const PP = this.profilePictureRef.current!;
    // const imageData = PP.getData();
    /* This does not exist! */
    // const file = imageData.file;
    const imageAsDataURL = PP.getImageAsDataUrl();
    console.log(imageAsDataURL);
  };

  render() {
    return (
      <div className="profilePicEdit">
        (Will Update This with Profile Pic Upload)
      </div>
    );
  }
}
/* vim: set et sw=2: */
