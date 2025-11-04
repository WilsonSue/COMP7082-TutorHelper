import React, { useEffect } from 'react';
import '../style.css';

function Home() {
    // useEffect(() => {
    //     const script = document.createElement('script');
    //     script.src = './home-functions.js';
    //     script.async = true;
    //     document.body.appendChild(script);
    //     return () => {
    //       document.body.removeChild(script);
    //     };
    // }, []);
  return (
    <div className="App">
      <header className="App-header">
        <button className="btn-logout" id="logoutBtn">
          Logout
        </button>

        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="logo">
              <h1>Tutor Bot</h1>
            </div>
            <div className="welcome-message" id="welcomeMessage">
              Welcome, User!
            </div>
          </div>

          <div className="learning-section">
            <h2 className="section-title">Start Learning!</h2>

            <div className="learning-options">
              <div className="learning-option active" data-option="visual">
                <div className="checkbox-container">
                  <div className="custom-checkbox checked">
                    <span className="checkmark">✓</span>
                  </div>
                </div>
                <div className="option-content">
                  <div className="option-title">Visual Learner</div>
                  <div className="option-description">
                    For students who need images to study better.
                  </div>
                </div>
              </div>

              <div className="learning-option active" data-option="adhd">
                <div className="checkbox-container">
                  <div className="custom-checkbox checked">
                    <span className="checkmark">✓</span>
                  </div>
                </div>
                <div className="option-content">
                  <div className="option-title">ADHD Learning Strategies</div>
                  <div className="option-description">
                    For students who need ADHD learning strategies.
                  </div>
                </div>
              </div>

              <div className="learning-option active" data-option="due-dates">
                <div className="checkbox-container">
                  <div className="custom-checkbox checked">
                    <span className="checkmark">✓</span>
                  </div>
                </div>
                <div className="option-content">
                  <div className="option-title">Due Dates</div>
                  <div className="option-description">
                    An alarm or calendar to promote pressure induced learning.
                  </div>
                </div>
              </div>
            </div>

            <button className="btn-confirm" id="confirmBtn">
              Confirm
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}

export default Home;
