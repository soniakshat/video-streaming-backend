const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  title: String,
  description: String,
  filePath: String, // Relative path to the video file
});

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;
