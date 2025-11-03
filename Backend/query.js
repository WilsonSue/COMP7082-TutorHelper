const axios = require("axios");
const { 
  buildStartingPrompt, 
  buildFactCheckerPrompt, 
  buildRevisionPrompt, 
  buildSocraticPrompt 
} = require("./prompts");

const BASE_URL = "http://localhost:3000";

// ordered model list
const MODEL_ORDER = ["deepseek", "mistral", "gpt", "gemini"];

// default selection
let MAIN_MODEL = "gpt";
let FACTCHECK_MODELS = ["mistral", "gemini"];

function setModels(selected) {
  const index = MODEL_ORDER.indexOf(selected);
  if (index === -1) {
    console.warn("Selected model not in list, keeping default");
    return;
  }

  MAIN_MODEL = selected;

  // pick previous and next in the list, wrapping around
  const left = MODEL_ORDER[(index - 1 + MODEL_ORDER.length) % MODEL_ORDER.length];
  const right = MODEL_ORDER[(index + 1) % MODEL_ORDER.length];
  FACTCHECK_MODELS = [left, right];
}

async function askModel(model, prompt) {
  try {
    const res = await axios.post(`${BASE_URL}/api/ask/${model}`, { prompt });
    return res.data.output || res.data.answer || res.data;
  } catch (err) {
    console.error("Error calling model", model, err.response?.data || err.message);
    throw err;
  }
}

async function startTopic({ topic, level = "Undergraduate", style = "gentle" }) {
  const prompt = buildStartingPrompt({ topic, level, style });
  const output = await askModel(MAIN_MODEL, prompt);
  return { model: MAIN_MODEL, output };
}

async function askQuestion({ topic, question }) {
  const mainPrompt = `${topic ? `Topic ${topic}\n` : ""}User question ${question}`;
  const mainOutput = await askModel(MAIN_MODEL, mainPrompt);

  const checks = await Promise.all(
    FACTCHECK_MODELS.map(async (m) => {
      const prompt = buildFactCheckerPrompt({ topic, output: mainOutput });
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

  const revised = await askModel(MAIN_MODEL, revisionPrompt);

  return {
    model: MAIN_MODEL,
    initial: mainOutput,
    factChecks: checks,
    revised
  };
}

async function getHint({ topic, level = "Undergraduate", style = "gentle" }) {
  const prompt = buildSocraticPrompt({ topic, level, style });
  const output = await askModel(MAIN_MODEL, prompt);
  return { model: MAIN_MODEL, hint: output };
}

module.exports = {
  setModels,
  askModel,
  startTopic,
  askQuestion,
  getHint
};
