/* =====================================================
   SELLER ACQUISITION – PAGE ACCESS GUARD + FORM HANDLER
   File: seller-acquisition.js
===================================================== */

/* ---------- PAGE ACCESS GUARD ---------- */
(function () {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  // If user is NOT logged in → block access
  if (isLoggedIn !== "true") {
    window.location.replace("login.html");
    return;
  }
})();

/* ---------- FORM HANDLER ---------- */
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("sellerAcquisitionForm");
  const successMessage = document.getElementById("successMessage");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";

    const formData = new FormData(form);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value.trim();
    });

    console.log("Seller Acquisition Data:", data);

    setTimeout(() => {
      form.style.display = "none";
      successMessage.style.display = "block";

      form.reset();
      submitBtn.disabled = false;
      submitBtn.innerText = "Submit Application";
    }, 800);
  });
});
