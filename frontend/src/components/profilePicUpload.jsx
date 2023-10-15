import React, { Component } from "react";

import ProfilePicture from "@dsalvagni/react-profile-picture";
import "@dsalvagni/react-profile-picture/dist/ProfilePicture.css";
import "./profilePicUpload.css";

export default class ProfilePictureUpload extends Component {
  constructor(props) {
    super(props);

    this.profilePictureRef = React.createRef();
  }

  handleUpload() {
    console.log(this);
    const PP = this.profilePictureRef.current;
    const imageData = PP.getData();
    const file = imageData.file;
    const imageAsDataURL = PP.getImageAsDataUrl();
    console.log(file, imageAsDataURL);
  }

  render() {
    return (
      <div className="profilePicEdit">
        <ProfilePicture
          ref={this.profilePictureRef}
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
          onClick={this.handleUpload.bind(this)}
          style={{ display: "none" }}
        >
          Upload
        </button>
      </div>
    );
  }
}
