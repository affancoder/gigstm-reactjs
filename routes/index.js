const express = require("express");
const path = require("path");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const adminAuthController = require("../controllers/adminAuthController");
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
router.get(
  "/private/admin.html",
  (req, res, next) => {
    // Basic session check as requested
    if (!req.session || !req.session.admin) {
        return res.redirect("/admin-login.html");
    }
    next();
  },
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "private", "admin.html")
    );
  }
);

// Alias /admin to the same file (legacy support)
router.get(
  "/admin",
  protect,
  restrictTo("admin"),
  (req, res) => {
    res.sendFile(
      path.join(__dirname, "..", "private", "admin.html")
    );
  }
);

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
