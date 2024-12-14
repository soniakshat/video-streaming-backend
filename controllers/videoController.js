const fs = require("fs");
const path = require("path");
const Video = require("../models/Video");
const User = require("../models/User");

// Get all videos
exports.getAllVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

exports.refreshVideoLibrary = async (req, res) => {
  const videoDir = path.join(__dirname, "../videos");

  try {
    // Step 1: Get all current videos in the directory
    const videoFiles = fs.readdirSync(videoDir).filter(
      (file) => file.endsWith(".mp4") // Adjust for other formats as needed
    );

    // Step 2: Fetch all current video records from the database
    const existingVideos = await Video.find({});
    const existingFilePaths = existingVideos.map((video) => video.filePath);

    // Step 3: Delete old video records that are no longer in the directory
    const deletedVideoIds = existingVideos
      .filter((video) => !videoFiles.includes(path.basename(video.filePath)))
      .map((video) => video._id);

    await Video.deleteMany({ _id: { $in: deletedVideoIds } });

    // Step 4: Remove deleted video references from user watch histories
    await User.updateMany(
      {},
      { $pull: { watchHistory: { videoId: { $in: deletedVideoIds } } } }
    );

    // Step 5: Add new video entries to the database
    const promises = videoFiles.map(async (file) => {
      const filePath = `videos/${file}`;
      const existingVideo = await Video.findOne({ filePath });

      if (!existingVideo) {
        return Video.create({
          title: path.basename(file, path.extname(file)), // Use filename as the default title
          filePath,
        });
      }
    });

    await Promise.all(promises);

    const updatedVideos = await Video.find();
    res.json({
      message: "Video library refreshed successfully",
      videos: updatedVideos,
    });
  } catch (err) {
    console.error("Failed to refresh video library:", err);
    res.status(500).json({ error: "Failed to refresh video library" });
  }
};

// Edit video details
exports.editVideoDetails = async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  try {
    const video = await Video.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );

    if (!video) return res.status(404).json({ error: "Video not found" });

    res.json({
      message: "Video details updated successfully",
      video,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update video details" });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const { id } = req.params; // Get the video ID from request params
    const video = await Video.findById(id); // Fetch video by ID

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json(video); // Respond with the video details
  } catch (err) {
    console.error("Error fetching video by ID:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
