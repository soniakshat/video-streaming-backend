const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");

// Get all videos
router.get("/", videoController.getAllVideos);

// Refresh video library
router.post("/refresh", videoController.refreshVideoLibrary);

// Edit video details
router.put("/:id", videoController.editVideoDetails);

// Route to get video details by ID
router.get("/:id", videoController.getVideoById);

module.exports = router;
