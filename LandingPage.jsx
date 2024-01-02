import React from 'react';
import Navbar from './Navbar';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-container">
      <img
        src="/logo192.png"
        alt="Code Connect Logo"
        className="logo"
      />
        
      <section className="description">
      <h2>Welcome to Code Connect</h2>
        <h3>About the Platform</h3>
        <p>
          Code Connect is an interactive platform designed for programmers and developers of all skill levels. Join or create channels on various programming languages, frameworks, and technologies. Share knowledge, ask questions, and collaborate on projects in a supportive community. Enhance your coding skills and stay updated with the latest technology trends.
        </p>
        <a href="/register" className="cta-button">Get Started</a>
      </section>
    </div>
  );
}

export default LandingPage;
