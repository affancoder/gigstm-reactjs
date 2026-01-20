import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-header-inner">
          <div className="brand-logo">
            <button
              type="button"
              className="logo-button"
              onClick={() => navigate("/")}
            >
              <span className="logo-text">GigsTm</span>
            </button>
          </div>
          <nav className="home-nav">
            <button
              type="button"
              className="nav-link-button"
              onClick={() => window.open("https://gigstm.com/gigs-categories")}
            >
              Gigs Categories
            </button>
          </nav>
          <div className="header-actions">
            <button
              type="button"
              className="btn btn-transparent"
              onClick={() => navigate("/login")}
            >
              Log in
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/signup")}
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Find on <span className="highlight">GigsTM</span>
            </h1>
            <p className="hero-subtitle">
              We do not post jobs. We build projects.
            </p>
            <button
              type="button"
              className="get-started-btn"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </button>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Why Join GigsTM Early?</h2>
          <div className="section-grid">
            <div className="section-card">
              <h3>First Access to Gigs</h3>
              <p>
                Get exclusive early access to gigs across e-commerce, fintech,
                ed-tech, logistics, and more.
              </p>
            </div>
            <div className="section-card">
              <h3>Grow with Us</h3>
              <p>
                Be part of a platform designed around real user needs and help
                shape the future of GigsTM.
              </p>
            </div>
            <div className="section-card">
              <h3>Skill-Building Opportunities</h3>
              <p>
                Get priority for training, certifications, and gigs that boost
                income and career.
              </p>
            </div>
            <div className="section-card">
              <h3>Community and Recognition</h3>
              <p>
                Early adopters earn featured badges, rewards, and recognition as
                community builders.
              </p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">What is GigsTM?</h2>
          <p className="section-text">
            GigsTM is a task-based work platform where businesses list flexible
            gigs and you pick and complete them based on your schedule and
            skills.
          </p>
          <ul className="section-list">
            <li>No long contracts.</li>
            <li>No complicated processes.</li>
            <li>Work, earn, and grow in a simple and transparent way.</li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title">What You Can Do</h2>
          <p className="section-text">
            Choose projects that fit your skills, schedule, and city whether
            part-time, full-time, or weekend-only.
          </p>
          <ul className="section-list">
            <li>Support e-commerce sellers.</li>
            <li>Generate leads and do field visits.</li>
            <li>Assist in product launches.</li>
            <li>Join proctoring or marketing gigs.</li>
            <li>Work in remote calling roles.</li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title">How It Works</h2>
          <ol className="steps-list">
            <li>Sign up and fill your basic details.</li>
            <li>Browse gigs based on your skills and location.</li>
            <li>Apply for a matching gig.</li>
            <li>Get trained if needed.</li>
            <li>Do the task at your pace.</li>
            <li>Submit and wait for approval.</li>
            <li>Get paid and repeat to grow.</li>
          </ol>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-column">
            <h4>Contact us at</h4>
            <p>support@gigstm.com</p>
            <p>+91-7081266668</p>
          </div>
          <div className="footer-column">
            <h4>Company</h4>
            <p>Who We Are</p>
            <p>How GigsTM Works</p>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <p>Privacy Policy</p>
            <p>Terms &amp; Conditions</p>
          </div>
        </div>
        <p className="footer-copy">
          Copyright © 2025 gigstm.com | All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

export default HomePage;

