const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { createPrediction } = require("../js/createPrediction");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
// Increase the limit for file uploads
app.use(bodyParser.json({ limit: '50mb' }));

console.log("FLOWISE_API_KEY from env:", process.env.FLOWISE_API_KEY)

// ✅ Enhanced endpoint with file handling
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId, userId, chatHistory = [], files = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("Received files:", files.length);
    if (files.length > 0) {
      console.log("File details:", files.map(f => ({ 
        name: f.name, 
        type: f.type, 
        size: f.size,
        contentType: f.contentType 
      })));
    }

    const response = await createPrediction(
      message,
      sessionId,
      userId,
      process.env.FLOWISE_API_KEY,
      chatHistory,
      files // Pass files to createPrediction
    );

    res.json({ success: true, response });
   
  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});