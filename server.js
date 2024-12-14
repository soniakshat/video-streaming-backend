const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const videoRoutes = require("./routes/videoRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Serve video files
app.use("/videos", express.static("videos"));

// Routes
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Local Video Streaming Backend");
});

// Start the server
const PORT = process.env.PORT || 3201;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
