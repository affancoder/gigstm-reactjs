const express = require("express");
const gigController = require("../controllers/gigController");

const router = express.Router();

router.get("/", gigController.listPublic);
router.post("/apply", gigController.applyGig);
router.get("/:id", gigController.getPublic);

module.exports = router;
