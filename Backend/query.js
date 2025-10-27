const axios = require("axios");
const { buildFactCheckerPrompt, buildRevisionPrompt, buildSocraticPrompt } = require("./prompts");

const BASE_URL = "http://localhost:3000";

async function askModel(model, prompt) {
  try {
    const res = await axios.post(`${BASE_URL}/api/ask/${model}`, { prompt });
    return res.data.output || res.data.answer;
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

async function test() {
  const topic = "machine learning";

  console.log("Step 1: Asking model");
  const initial = await askModel("gpt", `Explain ${topic} simply.`);
  console.log(initial);

  console.log("\nStep 2: Fact checking");
  const feedback = await runFactCheck({ topic, aiOutput: initial });
  console.log(feedback);

  console.log("\nStep 3: Revising");
  const revision = await runRevision({ topic, originalOutput: initial, feedback });
  console.log(revision);

  console.log("\nStep 4: Socratic prompt");
  const hint = await runSocratic({ topic, level: "Undergraduate", style: "philosophical" });
  console.log(hint);
}

if (require.main === module) test();

module.exports = { askModel, runFactCheck, runRevision, runSocratic };
S