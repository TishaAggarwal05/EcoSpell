import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const Landing = () => {
    const navigate = useNavigate();
    return (
        <div className="landing-container">
            <Navbar />

            {/* Main Content */}
            <div className="landing-content">
                <header className="landing-header">
                    <h1>Welcome to EchoSpell</h1>
                    <p>Your journey starts here. Explore and enjoy!</p>
                    <button>Get Started</button>
                </header>

                {/* Features Section */}
                <section className="features-section">
                    <h2 className="features-heading">FEATURES</h2>
                    <div className="features-container">
                        <div className="feature-box">🪄 Spell-Based Speech Exercises</div>
                        <div className="feature-box">📜 Personalized Learning Paths</div>
                        <div className="feature-box">🎤 AI-Powered Pronunciation Check</div>
                    </div>
                </section>

                {/* Storyline Section */}
                <section className="storyline-section">
                    <h2 className="section-heading">STORYLINE</h2>
                    <p className="storyline-text">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque non justo id ligula tempus
                        venenatis. Integer lacinia sapien sit amet lorem pharetra, at vulputate mauris placerat.
                        Morbi auctor felis nec justo facilisis, nec euismod nunc pulvinar. Nulla facilisi.
                    </p>
                </section>


                {/* HOW IT WORKS Section */}
                <section className="how-it-works">
                    {/* Bookmark-like elements on the left */}
                    <div className="steps-container">
                        <div className="step-box red">Step 1: GET STARTED</div>
                        <div className="step-box blue">Step 2: GIVE ASSESSMENT</div>
                        <div className="step-box yellow">Step 3: PRACTICE EXERCISES</div>
                        <div className="step-box green">Step 4: IMPROVE AND MASTER</div>
                    </div>

                    {/* Title on the right */}
                    <div className="how-it-works-text">
                        <h2>HOW IT WORKS?</h2>
                    </div>
                </section>
            </div>

            <Footer />
        </div>
    );
};

export default Landing;
