const axios = require("axios");
const { buildFactCheckerPrompt, buildRevisionPrompt, buildSocraticPrompt } = require("./prompts");

const BASE_URL = "http://localhost:3000";

async function askModel(model, prompt) {
  try {
    const res = await axios.post(`${BASE_URL}/api/ask/${model}`, { prompt });
    return res.data.output || res.data.answer || res.data;
  } catch (err) {
    console.error("Error calling model:", model, err.response?.data || err.message);
    throw err;
  }
}

async function runFactCheck({ topic, aiOutput, detailLevel = "in depth" }) {
  const prompt = buildFactCheckerPrompt({
    topic,
    output: aiOutput,
    detail_level: detailLevel,
  });
  return await askModel("gpt", prompt);
}

async function runRevision({ topic, originalOutput, feedback, revisionLevel = "minor corrections" }) {
  const prompt = buildRevisionPrompt({
    topic,
    original_output: originalOutput,
    feedback,
    revision_level: revisionLevel,
  });
  return await askModel("gpt", prompt);
}

async function runSocratic({ topic, level = "High School", style = "gentle" }) {
  const prompt = buildSocraticPrompt({ topic, level, style });
  return await askModel("gpt", prompt);
}

async function runFullCycle({ topic, level = "Undergraduate", style = "philosophical" }) {
  const result = {};

  console.log("Step 1: Asking model");
  result.initial = await askModel("gpt", `Explain ${topic} simply.`);

  console.log("Step 2: Fact checking");
  result.feedback = await runFactCheck({ topic, aiOutput: result.initial });

  console.log("Step 3: Revising");
  result.revision = await runRevision({
    topic,
    originalOutput: result.initial,
    feedback: result.feedback,
  });

  console.log("Step 4: Socratic questioning");
  result.hint = await runSocratic({ topic, level, style });

  return result;
}

async function test() {
  const topic = "machine learning";
  const results = await runFullCycle({ topic });
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) test();

module.exports = {
  askModel,
  runFactCheck,
  runRevision,
  runSocratic,
  runFullCycle,
};
