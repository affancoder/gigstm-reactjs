const express = require("express");
const path = require("path");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const adminAuthController = require("../controllers/adminAuthController");
const adminController = require("../controllers/adminController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

const router = express.Router();

// API routes
router.use("/api/user", userRoutes);
router.use("/api/auth", authRoutes);

// Explicitly block/redirect the public admin.html BEFORE static middleware
router.get("/admin.html", (req, res) => {
  res.redirect("/admin-login.html");
});

// Admin Logout Route
router.get("/admin-logout", adminAuthController.logout);

// Static public files
router.use(express.static(path.join(__dirname, "..", "public")));

// Root
router.get("/", (req, res) => {
  res.redirect("/login.html");
});

// Admin (protected)
// Explicitly serve /private/admin.html as requested
const servePrivate = (page) => {
    return [
        (req, res, next) => {
            if (!req.session || !req.session.admin) {
                return res.redirect("/admin-login.html");
            }
            next();
        },
        (req, res) => {
            res.sendFile(path.join(__dirname, "..", "private", page));
        }
    ];
};

router.get("/private/admin.html", ...servePrivate("admin.html"));
router.get("/admin-signup.html", ...servePrivate("admin-signup.html"));
router.get("/private/gigs-admin.html", ...servePrivate("gigs-admin.html"));
router.get("/private/analytics.html", ...servePrivate("analytics.html"));
router.get("/private/user-verification.html", ...servePrivate("user-verification.html"));
router.get("/admin/claims", ...servePrivate("claimform.html"));

router.get("/admin/qna-validation", ...servePrivate("qna-validation.html"));

// Export CSV Route (Session Protected)
router.get("/admin/export-users-csv", (req, res, next) => {
    if (!req.session || !req.session.admin) {
        return res.redirect("/admin-login.html");
    }
    next();
}, adminController.exportUsersToCSV);

// Alias /admin to the same file (legacy support)
router.get("/admin", ...servePrivate("admin.html"));

// 404
router.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      status: "error",
      message: "API endpoint not found"
    });
  }

  res.status(404).send("Page not found");
});

module.exports = router;
