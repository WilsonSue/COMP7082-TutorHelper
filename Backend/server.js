const express = require("express");
const { InferenceClient } = require("@huggingface/inference");
require("dotenv").config();

const app = express();
app.use(express.json()); // parse JSON bodies

const client = new InferenceClient(process.env.HF_TOKEN);

// Example route: call an AI API
app.post("/api/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Missing 'question' in request body." });
    }

    const chatCompletion = await client.chatCompletion({
      provider: "fireworks-ai",
      model: "deepseek-ai/DeepSeek-V3.1",
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = chatCompletion.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});