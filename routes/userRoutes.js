const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Get all users (optional: restrict this route to authorized users, e.g., admins)
router.get("/", protect, adminOnly, userController.getAllUsers);

// User signup
router.post("/signup", userController.signup);

// User login
router.post("/login", userController.login);

// Edit user profile
router.put("/profile", protect, userController.editProfile);

// Last viewed Video
router.get("/last-viewed", protect, userController.getLastViewedVideo);

// Update watch history
router.post("/watch-history", protect, userController.updateWatchHistory);

// Route to get watch history by video ID
router.get(
  "/watch-history/:videoId",
  protect,
  userController.getWatchHistoryByVideoId
);

module.exports = router;
