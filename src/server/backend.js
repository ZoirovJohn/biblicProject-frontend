const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { createPrediction } = require("../js/createPrediction"); // no `.js` needed in CommonJS

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

console.log("FLOWISE_API_KEY from env:", process.env.FLOWISE_API_KEY)

// ✅ Actual endpoint using createPrediction
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId, userId, chatHistory = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await createPrediction(
      message,
      sessionId,
      userId,
      process.env.FLOWISE_API_KEY,
      chatHistory
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
