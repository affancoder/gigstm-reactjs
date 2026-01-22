// ==========================
// API URL
// ==========================
// const API_URL = "https://gigstm-az6v.onrender.com/api";
const API_URL = "/api";
const TOKEN_KEY = "jwt_token";

// ==========================
// DOM ELEMENTS
// ==========================
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");

const signupName = document.getElementById("signup-name");
const signupEmail = document.getElementById("signup-email");
const signupPassword = document.getElementById("signup-password");
const signupConfirmPassword = document.getElementById(
	"signup-confirm-password"
);

// ==========================
// LOADER HANDLER
// ==========================
function showLoader(message = "Please wait...") {
	const loader = document.getElementById("loader");
	const loaderText = loader.querySelector(".loader-text");
	if (loader && loaderText) {
		loaderText.textContent = message;
		loader.style.display = "flex";
		// Add form-hidden class to all forms
		document.querySelectorAll(".auth-form").forEach((form) => {
			form.classList.add("form-hidden");
		});
	}
}

function hideLoader() {
	const loader = document.getElementById("loader");
	if (loader) {
		loader.style.display = "none";
		// Remove form-hidden class from all forms
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
async function handleLogin(event) {
	event.preventDefault();

	const loginBtn = document.getElementById("login-btn");
	const originalBtnText = loginBtn.innerHTML;

	try {
		// Show loader and disable button
		showLoader("Signing in...");
		loginBtn.disabled = true;
		loginBtn.innerHTML =
			'<i class="fas fa-spinner fa-spin"></i> Signing in...';
		const res = await fetch(`${API_URL}/auth/login`, {
			method: "POST",  credentials: "include",

			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: loginEmail.value,
				password: loginPassword.value,
			}),
		});

		const data = await res.json();
		if (!res.ok) throw new Error(data.message);

		localStorage.setItem(TOKEN_KEY, data.token);
		if (data.data?.user)
			localStorage.setItem("user", JSON.stringify(data.data.user));

		// Redirect to job categories
		window.location.href = "/job-categories.html";
	} catch (err) {
		showMessage("login-message", err.message);
	} finally {
		// Always hide loader and reset button state
		hideLoader();
		if (loginBtn) {
			loginBtn.disabled = false;
			loginBtn.innerHTML = originalBtnText;
		}
	}
}

// ==========================
// SIGNUP
// ==========================
async function handleSignUp(event) {
	event.preventDefault();

	try {
		// Get form values
		const name = signupName?.value.trim();
		const email = signupEmail?.value.trim().toLowerCase();
		const password = signupPassword?.value;
		const confirmPassword = signupConfirmPassword?.value;

		// Validation
		if (!name || !email || !password || !confirmPassword) {
			return showMessage("signup-message", "All fields are required");
		}

		if (password !== confirmPassword) {
			return showMessage("signup-message", "Passwords do not match");
		}

		if (password.length < 8) {
			return showMessage(
				"signup-message",
				"Password must be at least 8 characters long"
			);
		}

		console.log("Attempting to sign up with:", { name, email });

		// Show loading state
		const signupBtn = document.getElementById("signup-btn");
		const originalBtnText = signupBtn.innerHTML;
		signupBtn.disabled = true;
		signupBtn.innerHTML =
			'<i class="fas fa-spinner fa-spin"></i> Creating Account...';
		showLoader("Creating your account...");

		// Make signup request
		const signupResponse = await fetch(`${API_URL}/auth/register`, {
			method: "POST",  credentials: "include",

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
		console.log("Signup response:", signupData);

		if (!signupResponse.ok) {
			const errorMsg =
				signupData.message || "Signup failed. Please try again.";
			if (signupData.errors) {
				const errorDetails = Object.values(signupData.errors).join(" ");
				throw new Error(`${errorMsg} ${errorDetails}`);
			}
			throw new Error(errorMsg);
		}

		// Auto login after successful signup
		console.log("Signup successful, attempting auto-login...");
		const loginResponse = await fetch(`${API_URL}/auth/login`, {
			method: "POST",  credentials: "include",

			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		const loginData = await loginResponse.json();
		console.log("Login response:", loginData);

		if (!loginResponse.ok) {
			// Only show error message if auto-login fails, but don't block the success flow
			console.warn(
				"Auto-login failed, but signup was successful. User can log in manually."
			);
		} else {
			// Store token and redirect if auto-login is successful
			localStorage.setItem(TOKEN_KEY, loginData.token);
			if (loginData.data?.user) {
				localStorage.setItem(
					"user",
					JSON.stringify(loginData.data.user)
				);
			}

			// Redirect to job categories
			window.location.href = "/job-categories.html";
		}

		// Show success message for failed auto-login
		const successMessage =
			"Signup successful! " +
			(loginResponse.ok
				? "You have been logged in."
				: "Please log in with your new credentials.");
		sessionStorage.setItem("signupSuccess", successMessage);
		
		if (!loginResponse.ok) {
			window.location.href = "/login.html";
		}
	} catch (err) {
		console.error("Signup error:", err);
		showMessage(
			"signup-message",
			err.message || "An error occurred during signup. Please try again."
		);

		// Reset button state and hide loader
		hideLoader();
		const signupBtn = document.getElementById("signup-btn");
		if (signupBtn) {
			signupBtn.disabled = false;
			signupBtn.innerHTML = "Create Account";
		}
	}
}

// ==========================
// PASSWORD RESET
// ==========================
const resetBtn = document.getElementById("reset-password-btn");
async function handlePasswordReset() {
	const email = document.getElementById("reset-email").value.trim();
	const resetMessage = document.getElementById("reset-message");
	const originalBtnText = resetBtn.innerHTML;

	if (!email) {
		resetMessage.textContent = "Please enter your email address";
		resetMessage.className = "auth-message error";
		return;
	}

	try {
		// Show loading state
		resetBtn.disabled = true;
		resetBtn.innerHTML =
			'<i class="fas fa-spinner fa-spin"></i> Sending...';
		showLoader("Sending reset link...");

		const response = await fetch(`${API_URL}/auth/reset-password`, {
			method: "POST",  credentials: "include",

			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ email }),
		});

		const data = await response.json();
		console.log("Password reset response:", data);

		if (!response.ok) {
			throw new Error(
				data.message || "Failed to send reset link. Please try again."
			);
		}

		resetMessage.textContent = "Reset link sent successfully!";
		resetMessage.className = "auth-message success";
	} catch (error) {
		console.error("Password reset error:", error);
		resetMessage.textContent =
			error.message || "Failed to send reset link. Please try again.";
		resetMessage.className = "auth-message error";
	} finally {
		// Reset button state and hide loader
		hideLoader();
		if (resetBtn) {
			resetBtn.disabled = false;
			resetBtn.innerHTML = originalBtnText;
		}
	}
}

// ==========================
// LOGOUT
// ==========================
function handleLogout() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem("user");
	window.location.href = "/index.html";
}

// ==========================
// TAB SWITCHING
// ==========================
function showTab(tabName, event) {
	if (event) event.preventDefault();

	document
		.querySelectorAll(".auth-form")
		.forEach((f) => (f.style.display = "none"));
	document
		.querySelectorAll(".auth-tab")
		.forEach((t) => t.classList.remove("active"));

	document.getElementById(`${tabName}-form`).style.display = "block";
	document
		.querySelector(`.auth-tab[onclick*="${tabName}"]`)
		?.classList.add("active");
}

window.showTab = showTab; // FIX showTab not defined

// Show success message after signup redirect
function checkForSuccessMessage() {
	const signupSuccess = sessionStorage.getItem("signupSuccess");
	if (signupSuccess) {
		showMessage("login-message", signupSuccess, "success");
		sessionStorage.removeItem("signupSuccess"); // Clear the message after showing
	}
}

function showPasswordReset(event) {
  event.preventDefault();
  document.getElementById("forgot-password-modal").style.display = "flex";
}

// ==========================
// EVENT LISTENERS
// ==========================
document.addEventListener("DOMContentLoaded", () => {
	// Check for success message after signup
	checkForSuccessMessage();

	// Set up form event listeners
	if (loginForm) loginForm.addEventListener("submit", handleLogin);
	if (signupForm) signupForm.addEventListener("submit", handleSignUp);
	if (resetBtn) resetBtn.addEventListener("click", handlePasswordReset);

	const logoutBtn =
		document.getElementById("logout-btn") ||
		document.getElementById("logout-button");
	if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

    // Password visibility toggle
    document.querySelectorAll(".toggle-password").forEach((toggle) => {
        toggle.addEventListener("click", function () {
            const targetId = this.dataset.target;
            const passwordInput = document.getElementById(targetId);

            // Toggle the type attribute
            const type =
                passwordInput.getAttribute("type") === "password"
                    ? "text"
                    : "password";
            passwordInput.setAttribute("type", type);

            // Toggle the eye icon
            this.classList.toggle("fa-eye");
            this.classList.toggle("fa-eye-slash");
        });
    });
});

// ==========================
// PASSWORD RESET
// ==========================
async function handlePasswordReset() {
	const email = document.getElementById("reset-email").value.trim();
	const resetMessage = document.getElementById("reset-message");
	const resetBtn = document.getElementById("reset-password-btn");
	const originalBtnText = resetBtn.innerHTML;

	if (!email) {
		resetMessage.textContent = "Please enter your email address";
		resetMessage.className = "auth-message error";
		return;
	}

	try {
		// Show loading state
		resetBtn.disabled = true;
		resetBtn.innerHTML =
			'<i class="fas fa-spinner fa-spin"></i> Sending...';
		showLoader("Sending reset link...");

		// FIXED: Changed endpoint from /reset-password to /forgot-password
		const response = await fetch(`${API_URL}/auth/forgot-password`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ email }),
		});

		const data = await response.json();
		console.log("Password reset response:", data);

		if (!response.ok) {
			throw new Error(
				data.message || "Failed to send reset link. Please try again."
			);
		}

		// Show success message
		resetMessage.textContent = data.message || "Reset link sent to your email!";
		resetMessage.className = "auth-message success";
		
		// Clear the email input
		document.getElementById("reset-email").value = "";
		
		// Close modal after 3 seconds
		setTimeout(() => {
			document.getElementById("forgot-password-modal").style.display = "none";
			resetMessage.textContent = "";
			resetMessage.className = "auth-message";
		}, 3000);

	} catch (error) {
		console.error("Password reset error:", error);
		resetMessage.textContent =
			error.message || "Failed to send reset link. Please try again.";
		resetMessage.className = "auth-message error";
	} finally {
		// Reset button state and hide loader
		hideLoader();
		if (resetBtn) {
			resetBtn.disabled = false;
			resetBtn.innerHTML = originalBtnText;
		}
	}
}

// Show success message after signup redirect or password reset
function checkForSuccessMessage() {
	const signupSuccess = sessionStorage.getItem("signupSuccess");
	const passwordResetSuccess = sessionStorage.getItem("passwordResetSuccess");
	
	if (signupSuccess) {
		showMessage("login-message", signupSuccess, "success");
		sessionStorage.removeItem("signupSuccess");
	}
	
	if (passwordResetSuccess) {
		showMessage("login-message", passwordResetSuccess, "success");
		sessionStorage.removeItem("passwordResetSuccess");
	}
}
