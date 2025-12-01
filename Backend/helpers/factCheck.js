const MODEL_ORDER = ["deepseek", "mistral", "gpt", "gemini"];

/**
 * Get the two neighboring models to use as fact-checkers for a given main model.
 * Uses a circular ordering of models defined in MODEL_ORDER.
 *
 * @param {string} mainModel - The primary AI model being used (e.g., 'deepseek', 'mistral', 'gpt', 'gemini')
 * @returns {string[]} Array of two model names to use as fact-checkers
 *
 * @example
 * getFactCheckModels('gpt'); // might return ['mistral', 'gemini']
 * getFactCheckModels('unknown'); // returns default ['mistral', 'gpt']
 */
// helper to pick fact checkers around main model
function getFactCheckModels(mainModel) {
  const index = MODEL_ORDER.indexOf(mainModel);
  if (index === -1) return ["mistral", "gpt"]; // default
  const left = MODEL_ORDER[(index - 1 + MODEL_ORDER.length) % MODEL_ORDER.length];
  const right = MODEL_ORDER[(index + 1) % MODEL_ORDER.length];
  return [left, right];
}

module.exports = { getFactCheckModels };