(async function() {
    const token = localStorage.getItem("jwt_token");
    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch("/api/user/me/combined", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            // If unauthorized or other error, redirect to login or handle gracefully
            if (response.status === 401 || response.status === 403) {
                window.location.href = "/login.html";
            }
            return;
        }

        const result = await response.json();
        const { profile, experience } = result.data || {};

        // Logic copied from userform.js to ensure consistency
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

        if (!isStep1Complete || !isStep2Complete) {
            // If not complete, redirect to userform
            window.location.href = "/userform.html";
        }
        // If complete, stay on page.
    } catch (error) {
        console.error("Error checking profile status:", error);
        // Fallback: if we can't verify, redirect to userform to be safe? 
        // Or maybe let them stay if it's a transient network error?
        // Given the requirement "Block access... unless... 100% complete", blocking (redirecting) is safer.
        window.location.href = "/userform.html";
    }
})();
