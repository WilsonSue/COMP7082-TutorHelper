const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json()); // parse JSON bodies

// Example route: call an AI API
app.post('/api/ask', async (req, res) => {
  try {
    const { question } = req.body;

    // Example: calling HuggingFace Inference API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/gpt2',
      { inputs: question },
      { headers: { Authorization: `Bearer ${process.env.HF_TOKEN}` } }
    );

    res.json({ answer: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});