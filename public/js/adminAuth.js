// ==========================
// API URL
// ==========================
const API_URL = "/api/admin";
const ADMIN_TOKEN_KEY = "admin_token";

// ==========================
// DOM ELEMENTS
// ==========================
const loginForm = document.getElementById("admin-login-form");
const signupForm = document.getElementById("admin-signup-form");
const otpForm = document.getElementById("admin-otp-form");

// ==========================
// LOADER HANDLER
// ==========================
function showLoader(message = "Please wait...") {
	const loader = document.getElementById("loader");
	const loaderText = loader.querySelector(".loader-text");
	if (loader && loaderText) {
		loaderText.textContent = message;
		loader.style.display = "flex";
		document.querySelectorAll(".auth-form").forEach((form) => {
			form.classList.add("form-hidden");
		});
	}
}

function hideLoader() {
	const loader = document.getElementById("loader");
	if (loader) {
		loader.style.display = "none";
		document.querySelectorAll(".auth-form").forEach((form) => {
			form.classList.remove("form-hidden");
		});
	}
}

// ==========================
// MESSAGE HANDLER
// ==========================
function showMessage(elementId, message, type = "error") {
	const messageElement = document.getElementById(elementId);
	if (messageElement) {
		messageElement.textContent = message;
		messageElement.className = `auth-message ${type}`;
		messageElement.style.display = "block";
	}
}

// ==========================
// LOGIN
// ==========================
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("login-email");
        const passwordInput = document.getElementById("login-password");
        const loginBtn = document.getElementById("login-btn");
        const originalBtnText = loginBtn.innerHTML;

        try {
            showLoader("Signing in...");
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';

            const res = await fetch(`${API_URL}/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value,
                }),
            });

            const data = await res.json();
            
            if (res.status === 403 && data.data?.email) {
                // Account unverified
                localStorage.setItem("pending_admin_email", data.data.email);
                window.location.href = "/admin-verify-otp.html";
                return;
            }

            if (!res.ok) throw new Error(data.message);

            localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
            if (data.data?.admin) {
                localStorage.setItem("admin_user", JSON.stringify(data.data.admin));
            }

            window.location.href = "/admin.html";
        } catch (err) {
            showMessage("login-message", err.message);
        } finally {
            hideLoader();
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalBtnText;
        }
    });
}

// ==========================
// SIGNUP
// ==========================
if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nameInput = document.getElementById("signup-name");
        const emailInput = document.getElementById("signup-email");
        const passwordInput = document.getElementById("signup-password");
        const confirmPasswordInput = document.getElementById("signup-confirm-password");
        const signupBtn = document.getElementById("signup-btn");
        const originalBtnText = signupBtn.innerHTML;

        try {
            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }

            if (password.length < 8) {
                throw new Error("Password must be at least 8 characters long");
            }

            showLoader("Creating Admin Account...");
            signupBtn.disabled = true;
            signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

            const res = await fetch(`${API_URL}/register`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Store email for OTP verification
            if (data.data?.email) {
                localStorage.setItem("pending_admin_email", data.data.email);
                window.location.href = "/admin-verify-otp.html";
            } else {
                // Fallback (should not happen with new logic)
                window.location.href = "/admin-login.html";
            }

        } catch (err) {
            showMessage("signup-message", err.message);
        } finally {
            hideLoader();
            signupBtn.disabled = false;
            signupBtn.innerHTML = originalBtnText;
        }
    });
}

// ==========================
// OTP VERIFICATION
// ==========================
if (otpForm) {
    // Check if we have a pending email
    const pendingEmail = localStorage.getItem("pending_admin_email");
    if (!pendingEmail) {
        alert("No pending verification found. Please login or signup again.");
        window.location.href = "/admin-login.html";
    }

    otpForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        
        const otpInput = document.getElementById("otp-input");
        const verifyBtn = document.getElementById("verify-btn");
        const originalBtnText = verifyBtn.innerHTML;

        try {
            const otp = otpInput.value.trim();
            if (otp.length !== 6) throw new Error("Please enter a valid 6-digit OTP");

            showLoader("Verifying...");
            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            const res = await fetch(`${API_URL}/verify-otp`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: pendingEmail,
                    otp
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Success! Store token
            localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
            if (data.data?.admin) {
                localStorage.setItem("admin_user", JSON.stringify(data.data.admin));
            }
            localStorage.removeItem("pending_admin_email");

            window.location.href = "/admin.html";
        } catch (err) {
            showMessage("otp-message", err.message);
        } finally {
            hideLoader();
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = originalBtnText;
        }
    });
}
