import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TOKEN_KEY = "jwt_token";
const API_URL = "/api";

function AuthPage({ initialTab = "login" }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("Please wait...");
  const [loginMessage, setLoginMessage] = useState({ text: "", type: "error" });
  const [signupMessage, setSignupMessage] = useState({
    text: "",
    type: "error",
  });
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState({ text: "", type: "" });
  const [passwordVisibility, setPasswordVisibility] = useState({
    login: false,
    signup: false,
    signupConfirm: false,
  });

  useEffect(() => {
    if (initialTab === "signup") {
      setActiveTab("signup");
    }
  }, [initialTab]);

  const togglePassword = (field) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const showLoader = (message) => {
    setLoaderMessage(message || "Please wait...");
    setLoading(true);
  };

  const hideLoader = () => {
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginMessage({ text: "", type: "error" });

    try {
      showLoader("Signing in...");
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      if (data.data && data.data.user) {
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      navigate("/userform");
    } catch (err) {
      setLoginMessage({
        text: err.message || "Unable to login. Please try again.",
        type: "error",
      });
    } finally {
      hideLoader();
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setSignupMessage({ text: "", type: "error" });

    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const password = signupPassword;
    const confirmPassword = signupConfirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      setSignupMessage({
        text: "All fields are required",
        type: "error",
      });
      return;
    }

    if (password !== confirmPassword) {
      setSignupMessage({
        text: "Passwords do not match",
        type: "error",
      });
      return;
    }

    if (password.length < 8) {
      setSignupMessage({
        text: "Password must be at least 8 characters long",
        type: "error",
      });
      return;
    }

    try {
      const signupBtnMessage = "Creating your account...";
      showLoader(signupBtnMessage);

      const signupResponse = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          passwordConfirm: confirmPassword,
        }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        const errorMsg =
          signupData.message || "Signup failed. Please try again.";
        throw new Error(errorMsg);
      }

      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok && loginData.token) {
        localStorage.setItem(TOKEN_KEY, loginData.token);
        if (loginData.data && loginData.data.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(loginData.data.user)
          );
        }
      }

      setSignupMessage({
        text: "Signup successful. Redirecting to profile form...",
        type: "success",
      });

      navigate("/userform");
    } catch (err) {
      setSignupMessage({
        text:
          err.message ||
          "An error occurred during signup. Please try again.",
        type: "error",
      });
    } finally {
      hideLoader();
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      setResetMessage({
        text: "Please enter your email address",
        type: "error",
      });
      return;
    }

    try {
      showLoader("Sending reset link...");
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to send reset link. Please try again."
        );
      }

      setResetMessage({
        text: data.message || "Reset link sent successfully!",
        type: "success",
      });
    } catch (error) {
      setResetMessage({
        text:
          error.message ||
          "Failed to send reset link. Please try again.",
        type: "error",
      });
    } finally {
      hideLoader();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("user");
    navigate("/");
  };

  const renderMessage = (message) => {
    if (!message.text) return null;
    const className =
      message.type === "success"
        ? "auth-message success"
        : "auth-message error";
    return <div className={className}>{message.text}</div>;
  };

  return (
    <div className="auth-page">
      {loading && (
        <div className="loader-overlay">
          <div className="loader-circle" />
          <div className="loader-text">{loaderMessage}</div>
        </div>
      )}

      <header className="site-header">
        <div className="brand-logo">
          <button
            type="button"
            className="logo-button"
            onClick={() => navigate("/")}
          >
            <span className="logo-text">GigsTm</span>
          </button>
        </div>
        <div className="header-btns">
          <button
            type="button"
            className="btn btn-transparent"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <main>
        <div className="auth-container">
          <h4 className="auth-title">
            Welcome back! Let’s get you signed in.
          </h4>

          <div className="auth-tabs">
            <button
              type="button"
              className={
                activeTab === "login" ? "auth-tab active" : "auth-tab"
              }
              onClick={() => setActiveTab("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={
                activeTab === "signup" ? "auth-tab active" : "auth-tab"
              }
              onClick={() => setActiveTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {activeTab === "login" && (
            <form className="auth-form" onSubmit={handleLogin}>
              {renderMessage(loginMessage)}
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <input
                  type="email"
                  id="login-email"
                  placeholder="Enter your email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="password-input-container">
                  <input
                    type={passwordVisibility.login ? "text" : "password"}
                    id="login-password"
                    placeholder="Enter your password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePassword("login")}
                  >
                    {passwordVisibility.login ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button type="submit" className="auth-button">
                Login
              </button>
              <p className="auth-footer-text">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setShowResetModal(true)}
                >
                  Forgot password?
                </button>
              </p>
            </form>
          )}

          {activeTab === "signup" && (
            <form className="auth-form" onSubmit={handleSignUp}>
              {renderMessage(signupMessage)}
              <div className="form-group">
                <label htmlFor="signup-email">
                  Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="signup-email"
                  placeholder="Enter your email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-name">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="signup-name"
                  placeholder="Enter your full name"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="signup-password">
                  Password <span className="required">*</span>
                </label>
                <div className="password-input-container">
                  <input
                    type={passwordVisibility.signup ? "text" : "password"}
                    id="signup-password"
                    placeholder="Create a password"
                    required
                    minLength={8}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePassword("signup")}
                  >
                    {passwordVisibility.signup ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="signup-confirm-password">
                  Confirm Password <span className="required">*</span>
                </label>
                <div className="password-input-container">
                  <input
                    type={
                      passwordVisibility.signupConfirm ? "text" : "password"
                    }
                    id="signup-confirm-password"
                    placeholder="Confirm your password"
                    required
                    value={signupConfirmPassword}
                    onChange={(e) =>
                      setSignupConfirmPassword(e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => togglePassword("signupConfirm")}
                  >
                    {passwordVisibility.signupConfirm ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <button type="submit" className="auth-button">
                Create Account
              </button>
              <p className="auth-footer-text">
                Already have an account?{" "}
                <button
                  type="button"
                  className="link-button"
                  onClick={() => setActiveTab("login")}
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </main>

      {showResetModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">Forgot Password?</h3>
            <p className="modal-description">
              Enter your email address and we&apos;ll send you a link to
              reset your password.
            </p>

            {resetMessage.text && (
              <div
                className={
                  resetMessage.type === "success"
                    ? "auth-message success"
                    : "auth-message error"
                }
              >
                {resetMessage.text}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reset-email">Email Address</label>
              <input
                type="email"
                id="reset-email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowResetModal(false);
                  setResetEmail("");
                  setResetMessage({ text: "", type: "" });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePasswordReset}
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Copyright © 2025 gigstm.com | All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AuthPage;

