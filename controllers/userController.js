const User = require("../models/User");
const Video = require("../models/Video");

const jwt = require("jsonwebtoken");

// Generate a JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords from the response
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// User signup
exports.signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create a new user
    const newUser = await User.create({ name, email, password });

    // Return the JWT token
    res.status(201).json({
      message: "User created successfully",
      token: generateToken(newUser._id),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
};

// User login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify the password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // User without password
    const { password: _, ...userWithoutPassword } = user.toObject();

    // Return the JWT token
    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to login" });
  }
};

// Edit user profile
exports.editProfile = async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id; // Assumes user ID is in the request after JWT verification

  try {
    // Update the user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// Get the user's last viewed video
exports.getLastViewedVideo = async (req, res) => {
  try {
    // Find the user by their ID and populate the video details
    const user = await User.findById(req.user.id).populate({
      path: "watchHistory.videoId",
      model: Video, // Specify the Video model
      select: "title filePath description", // Fetch only the required fields
    });

    if (!user || user.watchHistory.length === 0) {
      return res.json({ message: "No watch history available", videoId: null });
    }

    // Sort the watchHistory by timestamp in descending order
    const mostRecentView = user.watchHistory.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )[0]; // Most recent item

    if (!mostRecentView.videoId) {
      return res.status(404).json({ error: "Video not found" });
    }

    console.log("Video ID: ", mostRecentView.videoId._id);
    console.log("Title: ", mostRecentView.videoId.title);
    console.log("FilePath: ", mostRecentView.videoId.filePath);
    console.log("Position: ", mostRecentView.lastPosition);
    console.log("Description: ", mostRecentView.videoId.description);

    res.json({
      videoId: mostRecentView.videoId._id,
      title: mostRecentView.videoId.title,
      filePath: mostRecentView.videoId.filePath,
      lastPosition: mostRecentView.lastPosition,
      description: mostRecentView.videoId.description,
    });
  } catch (err) {
    console.error("Failed to fetch last viewed video:", err);
    res.status(500).json({ error: "Failed to fetch last viewed video" });
  }
};

// Update user's watch history
exports.updateWatchHistory = async (req, res) => {
  const { videoId, lastPosition, timestamp } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the video is already in the user's watch history
    const historyItem = user.watchHistory.find(
      (item) => item.videoId.toString() === videoId
    );
    if (historyItem) {
      // Update the timestamp
      historyItem.lastPosition = lastPosition;
      historyItem.timestamp = timestamp;
    } else {
      // Add a new history entry
      user.watchHistory.push({ videoId, lastPosition, timestamp });
    }

    await user.save();
    res.json({ message: "Watch history updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update watch history" });
  }
};

exports.getWatchHistoryByVideoId = async (req, res) => {
  try {
    const { videoId } = req.params; // Get the video ID from request params
    const userId = req.user.id; // Get the authenticated user's ID from req.user

    // Find the user by ID and filter watch history for the given video ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const watchHistoryEntry = user.watchHistory.find(
      (entry) => entry.videoId.toString() === videoId
    );

    if (!watchHistoryEntry) {
      return res
        .status(404)
        .json({ message: "No watch history for this video" });
    }

    res.json({
      videoId: watchHistoryEntry.videoId,
      lastPosition: watchHistoryEntry.lastPosition,
      timestamp: watchHistoryEntry.timestamp,
    });
  } catch (err) {
    console.error("Error fetching watch history:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
