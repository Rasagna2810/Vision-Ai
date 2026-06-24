import React from "react";
import { Link } from "react-router-dom";
import {
  FiUpload,
  FiAlertTriangle,
  FiBell
} from "react-icons/fi";
import { MdInsights } from "react-icons/md";
import {useAuth} from '../../context/UserCon.jsx';
import "./home.css";

function Home() {
  const {curr} = useAuth();
  return (
    <div className="home-container">

      {/* Hero */}
      <div className="home-hero">
        <h3>Welcome to Vision AI</h3>
        <p>Your gateway to advanced video analysis powered by AI.</p>
      </div>

      {/* Feature cards */}
      <div className="row home-cards">

        <div className="col-md-3">
          <div className="feature-card">
            <FiUpload size={32} className="icon" />
            <h6>Upload & Detect</h6>
            <p>
              Upload surveillance videos and automatically detect unsafe
              activities in real time.
            </p>
            {curr?.email ?(
            <Link to="/uploads">Start Analysis →</Link>):
            (<Link to="/signin">Get Started →</Link>)}
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card">
            <MdInsights size={32} className="icon" />
            <h6>ML Confidence Score</h6>
            <p>
              Each detected activity is evaluated using machine learning
              confidence scores for reliability.
            </p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card">
            <FiAlertTriangle size={32} className="icon" />
            <h6>Statistical Analysis</h6>
            <p>
              View daily and historical statistics using graphs and charts
              for better insights.
            </p>
          </div>
        </div>

        <div className="col-md-3">
          <div className="feature-card">
            <FiBell size={32} className="icon" />
            <h6>Alert Notifications</h6>
            <p>
              Get instant alerts when unsafe activities such as fire or
              smoking are detected.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Home;
