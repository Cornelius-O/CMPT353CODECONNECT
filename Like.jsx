import React, { useState } from "react";

function Likes() {
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [activeBtn, setActiveBtn] = useState("none");

  const handleLikeClick = () => {
    if (activeBtn === "like") {
      setLikeCount(likeCount - 1);
      setActiveBtn("none");
    } else {
      if (activeBtn === "dislike") {
        setDislikeCount(dislikeCount - 1);
      }
      setLikeCount(likeCount + 1);
      setActiveBtn("like");
    }
  };

  const handleDisikeClick = () => {
    if (activeBtn === "dislike") {
      setDislikeCount(dislikeCount - 1);
      setActiveBtn("none");
    } else {
      if (activeBtn === "like") {
        setLikeCount(likeCount - 1);
      }
      setDislikeCount(dislikeCount + 1);
      setActiveBtn("dislike");
    }
  };

  return (
    <div className="container">
      <div className="btn-container">
        <button
          className={`btn ${activeBtn === "like" ? "like-active" : ""}`}
          onClick={handleLikeClick}
          style={{
            backgroundColor: activeBtn === "like" ? "#0057b7" : "#007bff",
            color: "white",
            marginRight: "8px",
          }}
        >
          Like {likeCount}
        </button>

        <button
          className={`btn ${activeBtn === "dislike" ? "dislike-active" : ""}`}
          onClick={handleDisikeClick}
          style={{
            backgroundColor: activeBtn === "dislike" ? "darkred" : "red",
            color: "white",
          }}
        >
          Dislike {dislikeCount}
        </button>
      </div>
    </div>
  );
}

export default Likes;
