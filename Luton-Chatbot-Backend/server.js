// Import Express framework
const express = require("express");

// Import CORS middleware to allow browser requests
const cors = require("cors");

// Import chat routes
const chatRoutes = require("./routes/chat");

// Create Express application
const app = express();

// Enable CORS for all incoming requests
app.use(cors());

// Allow server to parse JSON request bodies
app.use(express.json());

// Root route to verify server is running
app.get("/", (req, res) => {
  res.send("Chatbot API is running ✅");
});

// Register /chat endpoint
// All chatbot requests go through routes/chat.js
app.use("/chat", chatRoutes);

// Global error handler as a safety fallback
app.use((err, req, res, next) => {

  // Log the error for debugging purposes
  console.error("Server error:", err);

  // Send generic error response
  res.status(500).json({
    ok: false,
    error: "Server error"
  });
});

// Start the server on port 5000
app.listen(5000, () => {

  // Log message when server starts successfully
  console.log("Server running on http://localhost:5000");
});