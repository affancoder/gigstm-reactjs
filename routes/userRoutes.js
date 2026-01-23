const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();
const upload = require("../utils/multerCloudinary");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// Auth Routes
router.post(
	"/profile",
	protect,
	upload.fields([
		{ name: "profile-image", maxCount: 1 },
		{ name: "aadhaar-file", maxCount: 1 },
		{ name: "pan-file", maxCount: 1 },
		{ name: "resume-file", maxCount: 1 },
	]),
	userController.profile
);

router.post(
    "/experience",
    protect,
    upload.fields([
        { name: "resumeStep2", maxCount: 1 }
    ]),
    userController.experience
);

// KYC routes
router.post(
	"/kyc",
	protect,
	upload.fields([
		{ name: "aadhaarFront", maxCount: 1 },
		{ name: "aadhaarBack", maxCount: 1 },
		{ name: "panCardUpload", maxCount: 1 },
		{ name: "passbookUpload", maxCount: 1 }
	]),
	userController.kyc
);
router.get("/admin/users", protect, restrictTo("admin"), userController.getCombinedUsers);
router.get("/me", protect, userController.getMe);
router.get("/me/combined", protect, userController.getMyCombined);
router.get("/profile-completion", protect, userController.getProfileCompletion);
module.exports = router;
