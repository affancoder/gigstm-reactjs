console.log("userform.js loaded");

// Function to toggle password visibility
function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === "password" ? "text" : "password";
    const icon = document.querySelector(`[data-target="#${inputId}"] i`);
    if (icon) {
      icon.classList.toggle("fa-eye");
      icon.classList.toggle("fa-eye-slash");
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded");

  function updateProgressBar() {
    const sections = [
      { name: "Personal Details", panelId: "step1-panel" },
      { name: "Experience", panelId: "step2-panel" },
      // { name: "KYC Details", panelId: "kyc-panel" },
    ];

    let totalRequiredFields = 0;
    let completedRequiredFields = 0;

    // Define Step 2 required fields that are missing the 'required' attribute in HTML
    const step2RequiredIds = [
      "experienceYears",
      "experienceMonths",
      "employmentType",
      "occupation",
      "jobRequirement",
      "heardAbout",
      "interestType",
    ];

    sections.forEach((section) => {
      const panel = document.getElementById(section.panelId);
      if (!panel) return;

      const fields = panel.querySelectorAll("input, select, textarea");

      fields.forEach((field) => {
        // Check if field is required via attribute OR if it's in our manual list
        const isRequired = field.required || step2RequiredIds.includes(field.id);
        
        if (!isRequired) return;
        if (field.disabled) return;
        
        // REMOVED: Visibility check (offsetParent) to ensure fields in hidden steps are counted
        // if (field.type !== "file" && field.offsetParent === null) return;

        totalRequiredFields++;

        let isFilled = false;

        if (field.type === "file") {
          if (field.files && field.files.length > 0) {
            isFilled = true;
          } else {
            const statusElement = document.getElementById(
              field.id + "-status"
            );
            if (
              statusElement &&
              statusElement.textContent &&
              statusElement.textContent.trim() !== "No file chosen"
            ) {
              isFilled = true;
            }
          }
        } else if (field.value && field.value.trim() !== "") {
          isFilled = true;
        }

        if (isFilled) {
          completedRequiredFields++;
        }
      });
    });

    const percentage =
      totalRequiredFields > 0
        ? Math.round((completedRequiredFields / totalRequiredFields) * 100)
        : 0;

    const progressBar = document.getElementById("progress-bar");
    const progressPercentage = document.getElementById("progress-percentage");
    if (progressBar) {
      progressBar.style.width = percentage + "%";
    }
    if (progressPercentage) {
      progressPercentage.textContent = percentage + "%";
    }

    // Update unlock button state
    const unlockButton = document.getElementById("unlock-button");
    if (unlockButton) {
      if (percentage === 100 && document.getElementById("step2-panel").classList.contains("submitted")) {
        unlockButton.disabled = false;
        unlockButton.innerHTML =
          '<i class="fas fa-unlock"></i> Unlocked - Job Categories';
        unlockButton.title =
          "All fields completed! Click to proceed to job categories.";
      } else {
        unlockButton.disabled = true;
        unlockButton.innerHTML = `<i class="fas fa-lock"></i> ${percentage}% Complete`;
        unlockButton.title = `Complete all fields to unlock (${percentage}%)`;
      }
    }

    if (percentage === 100) {
      saveProfileData();
    }
  }

  // Function to save all form data
  async function saveProfileData() {
    try {
      // Collect all form data
      const formData = new FormData(document.getElementById("user-profile"));

      // Save profile data
      const profileResponse = await fetch("/api/user/profile", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!profileResponse.ok) {
        console.error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }

  // Function to redirect to job-categories
  function goToJobCategories() {
    window.location.href = "/job-categories.html";
  }

  populateForm()
    .then(() => {
      updateProgressBar();
    })
    .catch(() => {
      updateProgressBar();
    });

  // Add click event listeners for all password toggle buttons
  document.addEventListener("click", function (e) {
    const toggleBtn = e.target.closest(".toggle-visibility");
    if (toggleBtn) {
      e.preventDefault();
      const targetId = toggleBtn.getAttribute("data-target").replace("#", "");
      togglePasswordVisibility(targetId);
    }
  });

  // Add click event listener for unlock button
  const unlockButton = document.getElementById("unlock-button");
  if (unlockButton) {
    unlockButton.addEventListener("click", function () {
      if (!this.disabled) {
        goToJobCategories();
      }
    });
  }

  // Get all tab links and panels
  const tabLinks = document.querySelectorAll(".tab-link");
  const tabPanels = document.querySelectorAll(".step-panel");

  console.log("Found tab links:", tabLinks.length);
  console.log("Found tab panels:", tabPanels.length);

  // Function to switch tabs
  function switchTab(clickedTab) {
    if (!clickedTab) return;

    console.log("Switching to tab:", clickedTab.textContent.trim());

    // Get the target panel ID from data-target attribute
    const targetId = clickedTab.getAttribute("data-target");
    console.log("Target panel ID:", targetId);

    if (targetId === "#step2-panel" && !document.getElementById("step1-panel").classList.contains("submitted")) return alert("Please submit Personal Details first.");


    if (!targetId) {
      console.error("No data-target attribute found on tab");
      return;
    }

    // Remove active class from all tabs and panels
    tabLinks.forEach((tab) => tab.classList.remove("active"));
    tabPanels.forEach((panel) => panel.classList.remove("active"));

    // Add active class to clicked tab
    clickedTab.classList.add("active");

    // Show the corresponding panel
    const targetPanel = document.querySelector(targetId);
    if (targetPanel) {
      console.log("Found target panel");
      targetPanel.classList.add("active");
    } else {
      console.error("Target panel not found:", targetId);
    }
  }

  // Add click event listeners to all tab links
  tabLinks.forEach((tab) => {
    tab.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Tab clicked:", this.textContent.trim());
      switchTab(this);
    });
  });

  // Initialize first tab as active if no tab is active
  const activeTab = document.querySelector(".tab-link.active");
  if (tabLinks.length > 0 && !activeTab) {
    console.log("No active tab found, activating first tab");
    tabLinks[0].classList.add("active");
    const firstPanel = document.querySelector(
      tabLinks[0].getAttribute("data-target")
    );
    if (firstPanel) {
      firstPanel.classList.add("active");
    }
  } else if (activeTab) {
    console.log("Active tab found:", activeTab.textContent.trim());
    // Make sure the corresponding panel is also active
    const targetId = activeTab.getAttribute("data-target");
    if (targetId) {
      const targetPanel = document.querySelector(targetId);
      if (targetPanel) {
        targetPanel.classList.add("active");
      }
    }
  }

  // Function to show loader
  function showLoader() {
    const loader = document.getElementById("loader-overlay");
    if (loader) {
      loader.style.display = "flex";
      document.body.style.overflow = "hidden"; // Prevent scrolling while loading
    }
  }

  const FIELD_INFO = {
    name: {
      section: "Personal Details",
      label: "Your name",
      requirement: "Enter your full name.",
    },
    email: {
      section: "Personal Details",
      label: "Email address",
      requirement: "Enter your email address.",
    },
    mobile: {
      section: "Personal Details",
      label: "Mobile number",
      requirement: "Enter your mobile number.",
    },
    "job-role": {
      section: "Personal Details",
      label: "Job role",
      requirement: "Enter the role you are interested in.",
    },
    gender: {
      section: "Personal Details",
      label: "Gender",
      requirement: "Choose your gender from the list.",
    },
    dob: {
      section: "Personal Details",
      label: "Date of birth",
      requirement: "Select your date of birth.",
    },
    aadhaar: {
      section: "Documents",
      label: "Aadhaar number",
      requirement: "Enter your Aadhaar card number.",
    },
    pan: {
      section: "Documents",
      label: "PAN number",
      requirement: "Enter your PAN card number.",
    },
    "profile-image": {
      section: "Documents",
      label: "Profile photo",
      requirement: "Upload a clear profile photo.",
    },
    "aadhaar-file": {
      section: "Documents",
      label: "Aadhaar card file",
      requirement: "Upload a clear Aadhaar card file.",
    },
    "pan-file": {
      section: "Documents",
      label: "PAN card file",
      requirement: "Upload a clear PAN card file.",
    },
    "resume-file": {
      section: "Documents",
      label: "Resume",
      requirement: "Upload your latest resume.",
    },
    country: {
      section: "Address",
      label: "Country",
      requirement: "Select your country.",
    },
    state: {
      section: "Address",
      label: "State",
      requirement: "Select your state.",
    },
    city: {
      section: "Address",
      label: "City",
      requirement: "Select your city.",
    },
    address1: {
      section: "Address",
      label: "Address line 1",
      requirement: "Enter your primary address line.",
    },
    address2: {
      section: "Address",
      label: "Address line 2",
      requirement: "Enter your additional address details.",
    },
    pincode: {
      section: "Address",
      label: "Pincode",
      requirement: "Enter your area pincode.",
    },
    about: {
      section: "Personal Details",
      label: "About you",
      requirement: "Write a short summary about yourself.",
    },
    experienceYears: {
      section: "Experience",
      label: "Experience years",
      requirement: "Select how many years of experience you have.",
    },
    experienceMonths: {
      section: "Experience",
      label: "Experience months",
      requirement: "Select additional months of experience.",
    },
    employmentType: {
      section: "Experience",
      label: "Employment type",
      requirement: "Enter your employment type.",
    },
    occupation: {
      section: "Experience",
      label: "Occupation",
      requirement: "Enter your current or last occupation.",
    },
    jobRequirement: {
      section: "Experience",
      label: "Job requirement",
      requirement: "Describe the type of work you are looking for.",
    },
    heardAbout: {
      section: "Experience",
      label: "How you heard about GigsTm",
      requirement: "Select how you heard about GigsTm.",
    },
    interestType: {
      section: "Experience",
      label: "Interest type",
      requirement: "Enter the type of work you are interested in.",
    },
    bankName: {
      section: "Account Info",
      label: "Bank name",
      requirement: "Enter the name of your bank.",
    },
    accountNumber: {
      section: "Account Info",
      label: "Account number",
      requirement: "Enter your bank account number.",
    },
    ifscCode: {
      section: "Account Info",
      label: "IFSC code",
      requirement: "Enter the IFSC code of your bank branch.",
    },
    aadhaarFront: {
      section: "KYC Documents",
      label: "Aadhaar card front",
      requirement: "Upload the front side of your Aadhaar card.",
    },
    aadhaarBack: {
      section: "KYC Documents",
      label: "Aadhaar card back",
      requirement: "Upload the back side of your Aadhaar card.",
    },
    panCardUpload: {
      section: "KYC Documents",
      label: "PAN card",
      requirement: "Upload a clear PAN card image or PDF.",
    },
    passbookUpload: {
      section: "KYC Documents",
      label: "Passbook or cheque",
      requirement: "Upload a passbook or cancelled cheque.",
    },
  };

  function getFieldMeta(formId, field) {
    const key = field.id || field.name || "";
    const info = FIELD_INFO[key] || {};
    let section = info.section;
    if (!section) {
      if (formId === "user-profile") {
        section = "Personal Details";
      } else if (formId === "user-experience") {
        section = "Experience";
      } else if (formId === "user-kyc") {
        section = "Account Info";
      } else {
        section = "Form";
      }
    }
    const label =
      info.label ||
      (field.labels?.[0]?.textContent?.replace("*", "").trim() ||
        field.name ||
        "This field");
    const requirement = info.requirement || "Please fill in this field.";
    return { section, label, requirement };
  }

  // Function to validate form fields
  function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    const requiredFields = form.querySelectorAll("[required]");
    const fieldErrors = [];

    requiredFields.forEach((field) => {
      if (field.offsetParent === null || field.disabled) return;

      if (!field.value.trim()) {
        const meta = getFieldMeta(formId, field);
        fieldErrors.push({
          section: meta.section,
          label: meta.label,
          message: meta.requirement,
        });
      }

      if (
        field.type === "email" &&
        field.value.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)
      ) {
        const meta = getFieldMeta(formId, field);
        fieldErrors.push({
          section: meta.section,
          label: meta.label,
          message: "Enter a valid email address, like name@example.com.",
        });
      }

      if (
        field.type === "tel" &&
        field.value.trim() &&
        !/^[0-9]{10,15}$/.test(field.value)
      ) {
        const meta = getFieldMeta(formId, field);
        fieldErrors.push({
          section: meta.section,
          label: meta.label,
          message:
            "Enter a valid mobile number using digits only (10–15 digits).",
        });
      }

      if (field.type === "file" && field.required && !field.files.length) {
        const meta = getFieldMeta(formId, field);
        fieldErrors.push({
          section: meta.section,
          label: meta.label,
          message: meta.requirement,
        });
      }
    });

    if (fieldErrors.length > 0) {
      showError(fieldErrors);
      return false;
    }

    return true;
  }

  function showError(fieldErrors) {
    if (!Array.isArray(fieldErrors) || fieldErrors.length === 0) {
      return;
    }
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.style.cssText =
        "position: fixed; top: 20px; right: 20px; z-index: 9999; max-width: 400px;";
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.className = "error-toast";
    toast.style.cssText = `
      background-color: #fff8e1;
      color: #4e342e;
      padding: 15px 20px;
      margin-bottom: 10px;
      border-radius: 4px;
      border-left: 4px solid #ffb300;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease-out;
      position: relative;
      overflow: hidden;
    `;

    // Add close button
    const closeButton = document.createElement("button");
    closeButton.innerHTML = "&times;";
    closeButton.style.cssText = `
      position: absolute;
      top: 5px;
      right: 5px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #6d4c41;
      padding: 0 5px;
    `;
    closeButton.onclick = function () {
      toast.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => toast.remove(), 300);
    };

    const groupedBySection = {};
    fieldErrors.forEach((err) => {
      const section = err.section || "Form";
      if (!groupedBySection[section]) {
        groupedBySection[section] = [];
      }
      groupedBySection[section].push(err);
    });

    let detailsHtml = "";
    Object.keys(groupedBySection).forEach((sectionName) => {
      const items = groupedBySection[sectionName];
      detailsHtml += `<div style="margin-top: 6px;"><div style="font-weight: 600; margin-bottom: 2px;">${sectionName}</div><ul style="margin: 0 0 0 18px; padding: 0;">`;
      items.forEach((item) => {
        detailsHtml += `<li style="margin-bottom: 2px;"><span style="font-weight: 600;">${item.label}</span> – ${item.message}</li>`;
      });
      detailsHtml += "</ul></div>";
    });

    const messageDiv = document.createElement("div");
    messageDiv.style.cssText = "padding-right: 20px;";
    messageDiv.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
        <i class="fas fa-info-circle" style="font-size: 20px; margin-top: 2px;"></i>
        <div>
          <h4 style="margin: 0 0 6px 0; font-size: 16px; color: #1b5e20;">Your form is almost complete</h4>
          <p style="margin: 0 0 8px 0; font-size: 14px;">
            Some required details are still missing or need a quick update.
            Please review the sections below, fill in the highlighted fields, and try submitting again.
          </p>
          <div style="margin-left: 0; font-size: 14px; line-height: 1.4;">${detailsHtml}</div>
        </div>
      </div>
    `;

    // Add progress bar
    const progressBar = document.createElement("div");
    progressBar.style.cssText = `
      height: 4px;
      background: rgba(255, 179, 0, 0.3);
      width: 100%;
      position: absolute;
      bottom: 0;
      left: 0;
      animation: progress 5s linear forwards;
    `;

    toast.appendChild(closeButton);
    toast.appendChild(messageDiv);
    toast.appendChild(progressBar);
    toastContainer.prepend(toast);

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      toast.style.animation = "fadeOut 0.3s ease-out";
      setTimeout(() => toast.remove(), 300);
    }, 5000);

    // Add CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        to { opacity: 0; transform: translateX(100%); }
      }
      @keyframes progress {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }

  // Function to hide loader
  function hideLoader() {
    const loader = document.getElementById("loader-overlay");
    if (loader) {
      loader.style.display = "none";
      document.body.style.overflow = "auto"; // Re-enable scrolling
    }
  }

  // profile form script
  document
    .getElementById("user-profile")
    .addEventListener("submit", async function (e) {
      e.preventDefault(); // Prevent default form submission

      // Validate form before submission
      if (!validateForm("user-profile")) {
        return; // Stop if validation fails
      }

      showLoader(); // Show loader when form is submitted

      const form = e.target;
      const formData = new FormData(form); // Collect all form fields including files

      // Get JWT token from localStorage
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        hideLoader(); // Hide loader on error
        alert("Authentication token missing. Please login.");
        return;
      }

      try {
        const response = await fetch("/api/user/profile", {
          method: "POST",
          credentials: "include",

          headers: {
            Authorization: `Bearer ${token}`, // Include JWT in Authorization header
            // 'Content-Type': 'multipart/form-data' // DO NOT set this manually; FormData handles it
          },
          body: formData,
        });

        const result = await response.json();
        hideLoader(); // Hide loader when request is complete

        if (response.ok) {
          document.getElementById("step1-panel").classList.add("submitted");
          alert("Profile submitted successfully!");
          // window.location.href = "/success.html";
          console.log(result);
        } else {
          alert("Error: " + (result.message || "Something went wrong"));
          console.error(result);
        }
      } catch (error) {
        hideLoader(); // Hide loader on error
        console.error("Fetch error:", error);
        alert("An error occurred while submitting the form.");
      }
    });

  // Optional: Update file input status when a file is chosen
  const fileInputs = [
    { inputId: "profile-image", statusId: "profile-status" },
    { inputId: "aadhaar-file", statusId: "aadhaar-status" },
    { inputId: "pan-file", statusId: "pan-status" },
    { inputId: "resume-file", statusId: "resume-status" },
  ];

  fileInputs.forEach(({ inputId, statusId }) => {
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);
    input.addEventListener("change", () => {
      status.textContent = input.files.length
        ? input.files[0].name
        : "No file chosen";
    });
  });

  // Handle STEP 2 form submission
  document
    .getElementById("user-experience")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // Validate form before submission
      if (!validateForm("user-experience")) {
        return; // Stop if validation fails
      }

      showLoader(); // Show loader when form is submitted

      const form = e.target;
      const formData = new FormData(form);

      // Get JWT token
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        hideLoader(); // Hide loader on error
        alert("Authentication token missing. Please login.");
        return;
      }

      try {
        const response = await fetch("/api/user/experience", {
          method: "POST",
          credentials: "include",

          headers: {
            Authorization: `Bearer ${token}`,
            // DO NOT SET Content-Type manually
          },
          body: formData,
        });

        const result = await response.json();
        hideLoader(); // Hide loader when request is complete

        if (response.ok) {
          document.getElementById("step2-panel").classList.add("submitted"); updateProgressBar();
          alert("Experience details saved successfully!");
          console.log(result);
          // window.location.href = "/success.html";
        } else {
          alert("Error: " + (result.message || "Something went wrong"));
          console.error(result);
        }
      } catch (error) {
        hideLoader(); // Hide loader on error
        console.error("Fetch error:", error);
        alert("An error occurred while submitting the form.");
      }
    });

  // Update file label for Resume Step 2
  const resumeInput = document.getElementById("resumeStep2");
  const resumeStatus = document.getElementById("resumeStep2-status");

  if (resumeInput && resumeStatus) {
    resumeInput.addEventListener("change", () => {
      resumeStatus.textContent = resumeInput.files.length
        ? resumeInput.files[0].name
        : "No file chosen";
    });
  }

  // Handle STEP 3 - KYC FORM submission
  document
    .getElementById("user-kyc")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      // Validate form before submission
      if (!validateForm("user-kyc")) {
        return; // Stop if validation fails
      }

      showLoader();

      const form = e.target;
      const formData = new FormData(form);

      // Get JWT Token
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        hideLoader();
        alert("Authentication token missing. Please login again.");
        window.location.href = "/login.html";
        return;
      }

      try {
        // Use the correct endpoint for KYC submission
        const response = await fetch("/api/user/kyc", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Let the browser set Content-Type with boundary for FormData
          },
          body: formData,
          credentials: "include", // Important for cookies/sessions if used
        });

        const result = await response.json();
        hideLoader();

        if (response.ok) {
          alert("KYC details saved successfully!");
          console.log("KYC Response:", result);
          // Optionally redirect or update UI
          if (result.redirect) {
            window.location.href = result.redirect;
          }
        } else {
          throw new Error(result.message || "Failed to save KYC details");
        }
      } catch (error) {
        console.error("KYC submission error:", error);
        alert(
          error.message ||
            "An error occurred while saving KYC details. Please try again."
        );
      } finally {
        hideLoader();
      }
    });

  // ===========================
  // Update Filename Preview
  // ===========================

  const kycFileInputs = [
    { inputId: "aadhaarFront", statusId: "aadhaarFront-status" },
    { inputId: "aadhaarBack", statusId: "aadhaarBack-status" },
    { inputId: "panCardUpload", statusId: "panCardUpload-status" },
    { inputId: "passbookUpload", statusId: "passbookUpload-status" },
  ];

  kycFileInputs.forEach(({ inputId, statusId }) => {
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);

    if (input && status) {
      input.addEventListener("change", () => {
        status.textContent = input.files.length
          ? input.files[0].name
          : "No file chosen";
      });
    }
  });

  // ------------------------------
  // Change Password Button Handler
  // ------------------------------
  const toggleButtons = document.querySelectorAll(".toggle-visibility");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      const targetInput = document.querySelector(btn.dataset.target);
      if (targetInput.type === "password") {
        targetInput.type = "text";
        btn.querySelector("i").classList.remove("fa-eye");
        btn.querySelector("i").classList.add("fa-eye-slash");
      } else {
        targetInput.type = "password";
        btn.querySelector("i").classList.remove("fa-eye-slash");
        btn.querySelector("i").classList.add("fa-eye");
      }
    });
  });

  // ===== Handle Change Password Form Submission =====
  document
    .getElementById("change-password-btn")
    .addEventListener("click", async function () {
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;

      // Validate fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill in all password fields.");
        return;
      }

      if (newPassword.length < 6) {
        alert("New password must be at least 6 characters long.");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
      }

      // Get JWT Token
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        alert("Authentication token missing. Please login again.");
        window.location.href = "/login.html";
        return;
      }

      try {
        showLoader();
        const response = await fetch("/api/v1/auth/change-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
        });

        const result = await response.json();
        hideLoader();

        if (response.ok) {
          alert(
            "Password changed successfully! Please login again with your new password."
          );
          // Clear token and redirect to login
          localStorage.removeItem("jwt_token");
          window.location.href = "/login.html";
        } else {
          throw new Error(result.message || "Failed to change password");
        }
      } catch (error) {
        console.error("Password change error:", error);
        alert(
          error.message ||
            "An error occurred while changing password. Please try again."
        );
      }
    });

  // ==========================================
  // IFSC Auto-Fill Logic
  // ==========================================
  const bankSelect = document.getElementById('bankName');
  const ifscInput = document.getElementById('ifscCode');
  const ifscStatus = document.getElementById('ifsc-status');
  
  if (bankSelect && ifscInput) {
    // 1. Reset IFSC when Bank Name changes (to prevent mismatch)
    bankSelect.addEventListener('change', function() {
      ifscInput.value = "";
      if (ifscStatus) {
        ifscStatus.textContent = "";
        ifscStatus.className = "form-text text-muted";
      }
    });

    // 2. Validate IFSC on Blur/Change
    const validateIfsc = async function() {
      const ifsc = ifscInput.value.toUpperCase().trim();
      const selectedBank = bankSelect.value;

      if (!selectedBank) {
        // If no bank selected, we can't validate match
        return;
      }

      // Reset status
      if (ifscStatus) {
         ifscStatus.textContent = "";
         ifscStatus.className = "form-text text-muted";
      }

      if (!ifsc) return;

      if (ifsc.length !== 11) {
         if (ifscStatus) {
             ifscStatus.textContent = "❌ Invalid IFSC Code length";
             ifscStatus.style.color = "red";
         }
         return;
      }

      if (ifscStatus) {
          ifscStatus.textContent = "Verifying...";
          ifscStatus.style.color = "#666";
      }

      try {
        const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
        if (response.ok) {
          const data = await response.json();
          
          // Normalize names for comparison
          const apiBank = (data.BANK || "").toLowerCase().replace(/ limited$/, "").replace(/ bank$/, "").trim();
          const userBank = (selectedBank || "").toLowerCase().replace(/ limited$/, "").replace(/ bank$/, "").trim();

          // Check if IFSC belongs to the selected bank
          // Using simplified inclusion/match to handle naming variations
          // e.g. "State Bank of India" vs "STATE BANK OF INDIA"
          // e.g. "HDFC" vs "HDFC Bank"
          
          const isMatch = apiBank === userBank || apiBank.includes(userBank) || userBank.includes(apiBank);

          if (isMatch) {
             if (ifscStatus) {
                 ifscStatus.textContent = `✅ Verified: ${data.BRANCH}, ${data.CITY}`;
                 ifscStatus.style.color = "green";
             }
          } else {
             if (ifscStatus) {
                 ifscStatus.textContent = `❌ IFSC belongs to ${data.BANK}, not ${selectedBank}`;
                 ifscStatus.style.color = "red";
             }
             ifscInput.value = ""; // Clear invalid input
          }
        } else {
           if (ifscStatus) {
               ifscStatus.textContent = "❌ Invalid IFSC Code (Not found)";
               ifscStatus.style.color = "red";
           }
           ifscInput.value = ""; // Clear invalid input
        }
      } catch (error) {
        console.error("IFSC API Error:", error);
        if (ifscStatus) {
            ifscStatus.textContent = "⚠️ Validation failed (Network error)";
            ifscStatus.style.color = "orange";
        }
      }
    };

    ifscInput.addEventListener('blur', validateIfsc);
    ifscInput.addEventListener('change', validateIfsc);
  }

  // ==========================================
  // Persistent Form Filling Logic
  // ==========================================

  function setFieldValue(id, value) {
    if (value === undefined || value === null) return;
    const element = document.getElementById(id);
    if (element) {
      element.value = value;
    }
  }

  // function setFileStatus(id, path) {
  //   const element = document.getElementById(id);
  //   if (element && path) {
  //     // Extract filename from path
  //     const filename = path.split(/[\\/]/).pop();
  //     element.textContent = "Uploaded: " + filename;
  //     element.style.color = "green";
  //     element.style.fontWeight = "bold";
  //   }
  // }

  function setFileStatus(id, path) {
    const element = document.getElementById(id);
    const fileInput = document.getElementById(
      id.replace("-status", "") + "-file"
    ); // Assuming file input has similar ID

    const profileImage = document.getElementById("profile-image");

    if (element && path) {
      // Extract filename from path
      const filename = path.split(/[\\/]/).pop();

      element.textContent = "Uploaded: " + filename;
      element.style.color = "green";
      element.style.fontWeight = "bold";

      // ✅ REMOVE required attribute if file already exists
      if (fileInput) {
        fileInput.removeAttribute("required");
      }
      if (profileImage && id === "profile-status") {
        profileImage.removeAttribute("required");
      }
    }
  }

  async function populateForm() {
    const token = localStorage.getItem("jwt_token");
    if (!token) return;

    try {
      showLoader();

      const response = await fetch("/api/user/me/combined", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const result = await response.json();
      const { user, profile, experience, kyc } = result.data || {};

      console.log("Fetched user data:", result.data);

      // Auto-redirect: Check if Step 1 and Step 2 are 100% complete
      try {
        const isStep1Complete = (() => {
          if (!profile) return false;
          // Required text fields based on HTML
          const requiredFields = [
            "name",
            "email",
            "mobile",
            "jobRole",
            "gender",
            "dob",
            "aadhaar",
            "pan",
            "country",
            "state",
            "city",
            "address1",
            "address2",
            "pincode",
            "about",
          ];
          const hasTextData = requiredFields.every((key) => !!profile[key]);

          // Required file uploads
          const hasFiles =
            !!profile.profileImage &&
            !!profile.aadhaarFile &&
            !!profile.panFile &&
            !!profile.resumeFile;

          return hasTextData && hasFiles;
        })();

        const isStep2Complete = (() => {
          if (!experience) return false;
          // Required fields based on populateForm mapping
          const requiredFields = [
            "experienceYears",
            "experienceMonths",
            "employmentType",
            "occupation",
            "jobRequirement",
            "heardAbout",
            "interestType",
          ];
          return requiredFields.every((key) => !!experience[key]);
        })();

        const urlParams = new URLSearchParams(window.location.search);
        const isEditMode = urlParams.get('mode') === 'edit';

        if (isStep1Complete && isStep2Complete && !isEditMode) {
          console.log("Steps 1 & 2 complete. Redirecting to job categories...");
          window.location.href = "/job-categories.html";
          return; // Stop form population
        }
      } catch (err) {
        console.error("Error in auto-redirect check:", err);
      }

      // 1. Populate Profile
      if (profile) {
        document.getElementById("step1-panel").classList.add("submitted");
        setFieldValue("name", profile.name);
        setFieldValue("email", profile.email || user?.email);
        setFieldValue("mobile", profile.mobile);
        setFieldValue("job-role", profile.jobRole);
        setFieldValue("gender", profile.gender);

        if (profile.dob) {
          const dobDate = new Date(profile.dob);
          if (!isNaN(dobDate)) {
            setFieldValue("dob", dobDate.toISOString().split("T")[0]);
          }
        }

        setFieldValue("aadhaar", profile.aadhaar);
        setFieldValue("pan", profile.pan);
        setFieldValue("country", profile.country);
        setFieldValue("state", profile.state);
        setFieldValue("city", profile.city);
        setFieldValue("address1", profile.address1);
        setFieldValue("address2", profile.address2);
        setFieldValue("pincode", profile.pincode);
        setFieldValue("about", profile.about);

        // Files
        if (profile.profileImage) {
          setFileStatus("profile-status", profile.profileImage);
          const avatar = document.getElementById("user-photo");
          if (avatar) avatar.src = profile.profileImage;
        }
        if (profile.aadhaarFile)
          setFileStatus("aadhaar-status", profile.aadhaarFile);
        if (profile.panFile) setFileStatus("pan-status", profile.panFile);
        if (profile.resumeFile)
          setFileStatus("resume-status", profile.resumeFile);

        // Sidebar email
        const emailDisplay = document.getElementById("user-email");
        if (emailDisplay)
          emailDisplay.textContent = profile.email || user?.email;
      } else if (user) {
        setFieldValue("name", user.name);
        setFieldValue("email", user.email);
        const emailDisplay = document.getElementById("user-email");
        if (emailDisplay) emailDisplay.textContent = user.email;
      }

      // 2. Populate Experience
      if (experience) {
        document.getElementById("step2-panel").classList.add("submitted");
        setFieldValue("experienceYears", experience.experienceYears);
        setFieldValue("experienceMonths", experience.experienceMonths);
        setFieldValue("employmentType", experience.employmentType);
        setFieldValue("occupation", experience.occupation);
        setFieldValue("jobRequirement", experience.jobRequirement);
        setFieldValue("heardAbout", experience.heardAbout);
        setFieldValue("interestType", experience.interestType);

        if (experience.resumeStep2)
          setFileStatus("resumeStep2-status", experience.resumeStep2);
      }

      // 3. Populate KYC
      if (kyc) {
        setFieldValue("bankName", kyc.bankName);
        setFieldValue("accountNumber", kyc.accountNumber);
        setFieldValue("ifscCode", kyc.ifscCode);

        if (kyc.aadhaarFront)
          setFileStatus("aadhaarFront-status", kyc.aadhaarFront);
        if (kyc.aadhaarBack)
          setFileStatus("aadhaarBack-status", kyc.aadhaarBack);
        if (kyc.panCardUpload)
          setFileStatus("panCardUpload-status", kyc.panCardUpload);
        if (kyc.passbookUpload)
          setFileStatus("passbookUpload-status", kyc.passbookUpload);
      }
    } catch (error) {
      console.error("Error fetching user data for pre-fill:", error);
    } finally {
      hideLoader();
    }
  }

  const form = document.getElementById("user-profile");
  if (form) {
    const sections = ["step1-panel", "step2-panel"];
    sections.forEach((sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        const fields = section.querySelectorAll(
          'input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea'
        );
        fields.forEach((field) => {
          field.addEventListener("input", updateProgressBar);
          field.addEventListener("change", updateProgressBar);
        });
      }
    });
  }
});
