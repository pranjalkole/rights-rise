/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 * Copyright (C) 2023  Pranjal Kole <pranjal.kole7@gmail.com>
 */

import React, { Component } from "react";

import ProfilePicture from "@dsalvagni/react-profile-picture";
import "@dsalvagni/react-profile-picture/dist/ProfilePicture.css";
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
        <ProfilePicture
          ref={this.profilePictureRef}
          frameFormat="circle"
          minImageSize={0}
          useHelper={true}
          debug={false}
          messages={{
            DEFAULT: "",
            DRAGOVER: "Drop your photo",
            INVALID_FILE_TYPE: "Only images allowed.",
            INVALID_IMAGE_SIZE: "Your photo must be larger than 1kb.",
          }}
        />
        <button
          onClick={this.handleUpload}
          style={{ display: "none" }}
        >
          Upload
        </button>
      </div>
    );
  }
}
/* vim: set et sw=2: */
