document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.querySelector(".profile-toggle-btn");
  const sidebar = document.getElementById("userSidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const closeBtn = document.querySelector(".sidebar-close-btn");
  const body = document.body;

  // Focus Trap Variables
  const focusableElements =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let firstFocusableElement;
  let lastFocusableElement;

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add("active");
    overlay.classList.add("active");
    sidebar.setAttribute("aria-hidden", "false");
    toggleBtn.setAttribute("aria-expanded", "true");
    body.style.overflow = "hidden"; // Prevent background scrolling

    // Setup Focus Trap
    const focusableContent = sidebar.querySelectorAll(focusableElements);
    if (focusableContent.length > 0) {
      firstFocusableElement = focusableContent[0];
      lastFocusableElement = focusableContent[focusableContent.length - 1];

      // Focus the close button first
      setTimeout(() => {
        if (closeBtn) closeBtn.focus();
      }, 100);
    }

    document.addEventListener("keydown", handleTabKey);
    document.addEventListener("keydown", handleEscKey);
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("active");
    if (overlay) overlay.classList.remove("active");
    sidebar.setAttribute("aria-hidden", "true");
    toggleBtn.setAttribute("aria-expanded", "false");
    body.style.overflow = ""; // Restore scrolling

    document.removeEventListener("keydown", handleTabKey);
    document.removeEventListener("keydown", handleEscKey);

    // Return focus to toggle button
    toggleBtn.focus();
  }

  function handleTabKey(e) {
    if (e.key === "Tab") {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          e.preventDefault();
          lastFocusableElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          e.preventDefault();
          firstFocusableElement.focus();
        }
      }
    }
  }

  function handleEscKey(e) {
    if (e.key === "Escape") {
      closeSidebar();
    }
  }

  // Event Listeners
  if (toggleBtn) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent immediate closing if clicking the button triggers document click
      openSidebar();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeSidebar);
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  // Close on outside click (optional backup for overlay)
  document.addEventListener("click", (e) => {
    if (
      sidebar && 
      toggleBtn &&
      sidebar.classList.contains("active") &&
      !sidebar.contains(e.target) &&
      !toggleBtn.contains(e.target)
    ) {
      closeSidebar();
    }
  });

  // Logout Logic
  const logoutLink = document.querySelector(".logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault();

      // Visual feedback
      const originalText = logoutLink.innerHTML;
      logoutLink.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Logging out...';
      logoutLink.style.pointerEvents = "none"; // Prevent double clicks

      try {
        // 1. Call Backend Logout (to clear HttpOnly cookie)
        // We use a short timeout to prevent hanging if the server is slow
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        await fetch("/api/v1/auth/logout", {
          method: "GET",
          signal: controller.signal,
        }).catch((err) =>
          console.warn("Backend logout failed or timed out", err),
        );

        clearTimeout(timeoutId);
      } catch (err) {
        console.error("Logout error:", err);
      } finally {
        // 2. Clear Client State (Always do this)
        localStorage.removeItem("jwt_token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();

        // 3. Redirect and Replace History
        window.location.replace("index.html");
      }
    });
  }

  // Load User Profile from LocalStorage
  const userJson = localStorage.getItem("user");
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      const sidebarAvatar = document.querySelector(".sidebar-avatar-large");
      const sidebarInfo = document.querySelector(".sidebar-user-info");

      // Update Avatar
      if (sidebarAvatar) {
        // Function to generate and display initials
        const setInitials = () => {
          const name = (user.name || "").trim();
          if (!name) {
            // Fallback to generic icon if name is missing
            sidebarAvatar.innerHTML = '<i class="fas fa-user"></i>';
            return;
          }

          // Generate initials (First Last -> FL)
          const parts = name.split(/\s+/);
          let initials = parts[0].charAt(0);
          if (parts.length > 1) {
            initials += parts[parts.length - 1].charAt(0);
          }

          sidebarAvatar.innerHTML = ""; // Clear any existing content
          sidebarAvatar.textContent = initials.toUpperCase();
        };

        if (user.avatar && user.avatar.trim() !== "") {
          // Try to show uploaded avatar
          const img = document.createElement("img");
          img.src = user.avatar;
          img.alt = user.name || "User Avatar";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = "cover";
          img.style.borderRadius = "50%";

          // Fallback to initials if image fails to load
          img.onerror = () => {
            console.warn(
              "Avatar image failed to load, falling back to initials.",
            );
            setInitials();
          };

          sidebarAvatar.innerHTML = "";
          sidebarAvatar.appendChild(img);
        } else {
          // No avatar image, show initials
          setInitials();
        }
      }

      // Update Info
      if (sidebarInfo) {
        sidebarInfo.innerHTML = ""; // Clear existing content

        if (user.name) {
          const nameEl = document.createElement("h4");
          nameEl.textContent = user.name;
          sidebarInfo.appendChild(nameEl);
        }

        if (user.email) {
          const emailEl = document.createElement("p");
          emailEl.className = "user-email";
          emailEl.textContent = user.email;
          sidebarInfo.appendChild(emailEl);
        }
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  }
});
