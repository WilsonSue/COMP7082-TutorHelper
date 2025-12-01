const axios = require("axios");
const { 
  buildStartingPrompt, 
  buildFactCheckerPrompt, 
  buildRevisionPrompt, 
  buildSocraticPrompt 
} = require("./prompts");

const BASE_URL = "http://localhost:3000";

/**
 * Calls a backend model API with a given prompt.
 * @param {string} model - Model identifier (e.g., 'deepseek', 'gpt', 'gemini').
 * @param {string} prompt - The prompt string to send to the model.
 * @returns {Promise<string>} The model's text output.
 * @throws Will throw an error if the API request fails.
 */
async function askModel(model, prompt) {
  try {
    const res = await axios.post(`${BASE_URL}/api/ask/${model}`, { prompt });
    return res.data.output;
  } catch (err) {
    console.error("Error calling model", model, err.response?.data || err.message);
    throw err;
  }
}

/**
 * Generates the initial topic explanation using the main AI model.
 * @param {Object} params
 * @param {string} params.topic - The topic to start.
 * @param {string} [params.level='Undergraduate'] - Education level (Grade 7, High School, Undergraduate, Graduate).
 * @param {string} [params.style='gentle'] - Style/tone of explanation (gentle, scientific, etc.).
 * @param {string} params.mainModel - The model to use for generating the explanation.
 * @returns {Promise<{model: string, output: string}>} Model name and output text.
 */
async function startTopic({ topic, level = "Undergraduate", style = "gentle", mainModel }) {
  const prompt = buildStartingPrompt({ topic, level, style });
  const output = await askModel(mainModel, prompt);
  return { model: mainModel, output };
}

/**
 * Asks a question to the main model and runs fact-checking and revision.
 * @param {Object} params
 * @param {string} params.topic - The topic context.
 * @param {string} params.question - User's question.
 * @param {string} params.mainModel - The main AI model.
 * @param {string[]} params.factCheckModels - List of models for fact-checking.
 * @returns {Promise<{model: string, initial: string, factChecks: Array<{model: string, check: string}>, revised: string}>} 
 *          Contains main output, fact-checks, and revised output.
 */
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

/**
 * Generates a Socratic hint for a given topic using the main model.
 * @param {Object} params
 * @param {string} params.topic - The topic context.
 * @param {string} [params.level='Undergraduate'] - Education level.
 * @param {string} [params.style='gentle'] - Style/tone of Socratic questioning.
 * @param {string} params.mainModel - The AI model to use.
 * @returns {Promise<{model: string, hint: string}>} Model name and Socratic hint text.
 */
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
