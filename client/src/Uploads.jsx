// import React from 'react'
// import { useState } from 'react'

// function Uploads() {
//   const [video, setVideo] = useState(null);
//   const [streamUrl, setStreamUrl] = useState("");

//   const uploadVideo = async () => {
//     if (!video) return alert("Select a video");

//     const fd = new FormData();
//     fd.append("file", video);

//     const res = await fetch("http://127.0.0.1:8000/upload-video", {
//       method: "POST",
//       body: fd,
//     });

//     const data = await res.json();

//     // 👇 NOW use GET for streaming
//     setStreamUrl(`http://127.0.0.1:8000/stream-video/${data.video_id}`);
//   };

//   return (
//    <div className="video-container">
//   <h2>Video Activity Detection</h2>

//   <div className="upload-controls">
//     <input
//       type="file"
//       accept="video/*"
//       onChange={(e) => setVideo(e.target.files[0])}
//     />

//     <button onClick={uploadVideo} className="ee">Upload & Detect</button>
//   </div>

//   {streamUrl && (
//     <div className="video-output">
//       <img
//         src={streamUrl}
//         alt="Processed stream"
//       />
//     </div>
//   )}
// </div>

//   );
// }

// export default Uploads
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/UserCon.jsx";
import "./Uploads.css";
import { FiUpload } from "react-icons/fi";
import { MdDoNotDisturb } from "react-icons/md";

function Uploads() {
  const [video, setVideo] = useState(null);
  const [videoId, setVideoId] = useState("");
  const [status, setStatus] = useState("idle"); // idle | analyzing | completed
  const [result, setResult] = useState("");
  const { curr } = useAuth();
  const [unsafeTypes, setUnsafeTypes] = useState([]);
  const [safe_activities, setsafe_activities] = useState([]);
  const [confidence, setConfidence] = useState(0);


  const pollRef = useRef(null);

  // cleanup on unmount / logout / reload
  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current);
      }
    };
  }, []);
  const handleCloseResult = () => {
  setStatus("idle");
  setResult("");
  setsafe_activities([]);
  setUnsafeTypes([]);
  setVideo(null);
  setVideoId("");
};


  const pollResult = async (vid) => {
  try {
    const res = await fetch(
      `http://127.0.0.1:8000/finalize/${vid}`,
      { method: "POST" }
    );

    // Analysis not ready yet → retry
    if (res.status === 400) {
      pollRef.current = setTimeout(() => pollResult(vid), 2000);
      return;
    }

    // Any other error → stop
    if (!res.ok) {
      console.error("Finalize failed:", res.status);
      setStatus("idle");
      return;
    }

    // Success
    const resultData = await res.json();

    setResult(resultData.status);
    setUnsafeTypes(resultData.unsafe_types);
    setsafe_activities(resultData.safe_activities);
    setConfidence(resultData.confidence_score);
    setStatus("completed");

    clearTimeout(pollRef.current);
  } catch (err) {
    console.error("Polling error:", err);
    setStatus("idle");   // stop retrying
  }
};


  const uploadVideo = async () => {
    if (!video) {
      alert("Please select a video");
      return;
    }

    setStatus("analyzing");

    const fd = new FormData();
    // fd.append("file", video);
    fd.append("file", video);
    fd.append("user_id", curr.user_id);

    // 1️⃣ Upload video
    const res = await fetch("http://127.0.0.1:8000/upload-video", {
      method: "POST",
      body: fd,
    });

    const data = await res.json();
    const vid = data.video_id;
    setVideoId(vid);

    // 2️⃣ Start background analysis
    // await fetch(`http://127.0.0.1:8000/analyze/${vid}`, {
    //   method: "POST",
    // });

    // 3️⃣ Start polling finalize
    // pollResult(vid);
      setTimeout(() => pollResult(vid), 3000);
  };

  return (
   <div className="upload-layout">

  {/* LEFT / Upload */}
  <div className="side-card">
    <h5>Upload Video</h5>

    {status === "idle" && (
      <>
        <input
          type="file"
          accept="video/*"
          id="videoUpload"
          hidden
          onChange={(e) => setVideo(e.target.files[0])}
        />

        {!video ? (
          <label htmlFor="videoUpload" className="upload-box">
            <FiUpload size={40} />
          </label>
        ) : (
          <button className="analyze-btn" onClick={uploadVideo}>
            Analyze
          </button>
        )}
      </>
    )}

    {status === "analyzing" && (
      <div className="loading">
        <div className="spinner"></div>
        <p>Analyzing...</p>
      </div>
    )}
  </div>

  {/* CENTER / STREAM */}
  <div className="stream-panel">
    {videoId ?(
      <img
  src={`http://127.0.0.1:8000/stream-video/${videoId}`}
  alt="Live Stream"
  className="stream-video"
  onLoad={() => pollResult(videoId)}   // ✅ important
/>

    ):(<p className="mt-5 align-item-center"> <MdDoNotDisturb /> Video is not uploaded</p>)}
  </div>

  {/* RIGHT / RESULTS */}
  {status === "completed" && (
    <div className="sidcard">

      <div className="result-header">
        <h5>Analysis</h5>
        <button className="close-btn" onClick={handleCloseResult}>✕</button>
      </div>

      <h4 className={result === "UNSAFE" ? "unsafe" : "safe"}>
        {result}
      </h4>

      {/* Confidence Meter */}
      <div className="confidence-box">
        <p>Confidence Score</p>
        <div className="confidence-bar">
          <div
            className={`confidence-fill ${
              confidence < 40 ? "low" : confidence < 70 ? "mid" : "high"
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
        <span>{confidence}%</span>
      </div>

      {/* Counts */}
      <div className="counts">
        <p>Safe Activities: <b>{safe_activities.length}</b></p>
        <p>Unsafe Activities: <b>{unsafeTypes.length}</b></p>
      </div>

      {/* Lists */}
      <h6>Safe</h6>
      <ul>
        {safe_activities.map((a, i) => <li key={i}>{a}</li>)}
      </ul>

      <h6>Unsafe</h6>
      <ul>
        {unsafeTypes.map((a, i) => <li key={i}>{a}</li>)}
      </ul>

    </div>
  )}

</div>

  );
}

export default Uploads;


