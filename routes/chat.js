// Import Express framework to create API routes
const express = require("express");

// Import Node.js path module to safely build file system paths
const path = require("path");

// Import Node.js file system module to check if files exist
const fs = require("fs");

// Import pathToFileURL to correctly convert file paths into file:// URLs for import()
const { pathToFileURL } = require("url");

// Create a router object to define routes separately from server.js
const router = express.Router();

// Store the loaded chat engine module so we only import it once
let engineModule = null;

// Async function to load Developer 1's chat engine (ES Module)
async function getChatEngine() {
  if (engineModule) return engineModule;

  // Project root where you run `npm run dev`
  const root = process.cwd();

  // Candidate locations (common structures)
  const candidates = [
    path.join(root, "Luton_chat_engine", "chatbot", "chatEngine.js"),
    path.join(root, "Luton_chat_engine", "chatbot", "chatEngine.js"),
    path.join(root, "Luton_chat_engine", "chatbot", "chatEngine.js"),
  ];

  // Try each candidate and pick the first one that exists
  let enginePath = candidates.find((p) => fs.existsSync(p));

  // If not found, search the whole project for chatEngine.js
  if (!enginePath) {
    const stack = [root];
    while (stack.length) {
      const dir = stack.pop();
      let entries = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules to avoid slow search
          if (entry.name === "node_modules") continue;
          stack.push(full);
        } else if (entry.isFile() && entry.name === "chatEngine.js") {
          enginePath = full;
          break;
        }
      }
      if (enginePath) break;
    }
  }

  console.log("Engine path:", enginePath);

  // If still not found, throw a clear error
  if (!enginePath) {
    throw new Error("Could not locate chatEngine.js anywhere in the project.");
  }

  console.log("Engine file exists:", fs.existsSync(enginePath));

  const engineUrl = pathToFileURL(enginePath).href;
  engineModule = await import(engineUrl);
  return engineModule;
}

// Define POST endpoint for /chat
router.post("/", async (req, res) => {
  // Extract message field from request body
  const { message } = req.body;

  // Validate: message must exist, must be a string, and must not be empty
  if (!message || typeof message !== "string" || !message.trim()) {
    // Return 400 Bad Request if validation fails
    return res.status(400).json({
      ok: false,
      error: "Invalid message. Please send a non-empty string."
    });
  }

  try {
    // Load the Dev1 engine module
    const engine = await getChatEngine();

    // Support both export styles:
    // 1) export function handleMessage() {}
    // 2) export default { handleMessage }
    const handleMessage = engine.handleMessage || engine.default?.handleMessage;

    // If handleMessage is missing, throw a clear error
    if (typeof handleMessage !== "function") {
      throw new Error("handleMessage was not found in chatEngine exports.");
    }

    // Call the chat engine with the cleaned message
    const reply = await handleMessage(message.trim());

    // Return the chatbot reply as JSON
    return res.json({
      ok: true,
      reply
    });
  } catch (err) {
    // Log the full error so you can see the real cause in the terminal
    console.error("Chat route error:", err);

    // Return 500 to the client in a clean format
    return res.status(500).json({
      ok: false,
      error: "Chatbot crashed while handling the message."
    });
  }
});

// Export the router to be used in server.js
module.exports = router;