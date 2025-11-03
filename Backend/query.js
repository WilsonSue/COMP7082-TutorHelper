const axios = require("axios");
const { 
  buildStartingPrompt, 
  buildFactCheckerPrompt, 
  buildRevisionPrompt, 
  buildSocraticPrompt 
} = require("./prompts");

const BASE_URL = "http://localhost:3000";

async function askModel(model, prompt) {
  try {
    const res = await axios.post(`${BASE_URL}/api/ask/${model}`, { prompt });
    return res.data.output;
  } catch (err) {
    console.error("Error calling model", model, err.response?.data || err.message);
    throw err;
  }
}

async function startTopic({ topic, level = "Undergraduate", style = "gentle", mainModel }) {
  const prompt = buildStartingPrompt({ topic, level, style });
  const output = await askModel(mainModel, prompt);
  return { model: mainModel, output };
}

async function askQuestion({ topic, question, mainModel, factCheckModels }) {
  const mainPrompt = `${topic ? `Topic ${topic}\n` : ""}User question ${question}`;
  const mainOutput = await askModel(mainModel, mainPrompt);
  // console.log(`[askQuestion] Main model output (${mainModel}):\n`, mainOutput);

  const checks = await Promise.all(
    factCheckModels.map(async (m) => {
      const prompt = buildFactCheckerPrompt({ topic, original_ai_output: mainOutput });
      console.log(`fact check prompt (${m}):\n`, prompt);
      const check = await askModel(m, prompt);
      return { model: m, check };
    })
  );

  const combinedFeedback = checks.map(c => `${c.model} ${c.check}`).join("\n\n");
  const revisionPrompt = buildRevisionPrompt({
    topic,
    originalOutput: mainOutput,
    feedback: combinedFeedback,
    revision_level: "moderate improvements"
  });

  const revised = await askModel(mainModel, revisionPrompt);

  return {
    model: mainModel,
    initial: mainOutput,
    factChecks: checks,
    revised
  };
}

async function getHint({ topic, level = "Undergraduate", style = "gentle", mainModel }) {
  const prompt = buildSocraticPrompt({ topic, level, style });
  const output = await askModel(mainModel, prompt);
  return { model: mainModel, hint: output };
}

module.exports = {
  askModel,
  startTopic,
  askQuestion,
  getHint
};
