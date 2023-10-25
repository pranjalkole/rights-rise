/**
 * @source: https://github.com/pranjalkole/rights-rise
 *
 * @license AGPL-3.0-only
 *
 * Copyright (C) 2023  Hemant Kumar <ytbhemant@gmail.com>
 */

import { useRef } from "react";

import ProfilePicture from "@dsalvagni/react-profile-picture";
import "@dsalvagni/react-profile-picture/dist/ProfilePicture.css";
import "./profilePicUpload.css";

export default function ProfilePictureUpload() {
  const profilePictureRef = useRef();

  function handleUpload() {
    const PP = profilePictureRef.current;
    const imageData = PP.getData();
    const file = imageData.file;
    const imageAsDataURL = PP.getImageAsDataUrl();
    console.log(file, imageAsDataURL);
    /* TODO */
  }

  return (
    <div className="profilePicEdit">
      <ProfilePicture
        ref={profilePictureRef}
        frameFormat="circle"
        minImageSize={0}
        useHelper={true}
        debug={true}
        messages={{
          DEFAULT: "",
          DRAGOVER: "Drop your photo",
          INVALID_FILE_TYPE: "Only images allowed.",
          INVALID_IMAGE_SIZE: "Your photo must be larger than 1kb.",
        }}
      />
      <button
        onClick={handleUpload}
        style={{ display: "none" }}
      >
        Upload
      </button>
    </div>
  );
}
/* vim: set et sw=2: */
