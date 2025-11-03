const outputBox = document.getElementById("output");

// ordered model list
const MODEL_ORDER = ["deepseek", "mistral", "gpt", "gemini"];
let MAIN_MODEL = "gpt";
let FACTCHECK_MODELS = ["mistral", "gemini"];

function setModels(selected) {
  const index = MODEL_ORDER.indexOf(selected);
  if (index === -1) {
    console.warn("Selected model not in list, keeping default");
    return;
  }
  MAIN_MODEL = selected;
  const left = MODEL_ORDER[(index - 1 + MODEL_ORDER.length) % MODEL_ORDER.length];
  const right = MODEL_ORDER[(index + 1) % MODEL_ORDER.length];
  FACTCHECK_MODELS = [left, right];
}

async function postData(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function display(data) {
  outputBox.textContent = JSON.stringify(data, null, 2);
}

// Update models when the dropdown changes
document.getElementById("modelSelect").addEventListener("change", (e) => {
  setModels(e.target.value);
});

// start topic
document.getElementById("startBtn").addEventListener("click", async () => {
  const topic = document.getElementById("topic").value.trim();
  const model = document.getElementById("modelSelect").value;
  if (!topic) return alert("Enter a topic");

  try {
    const data = await postData("/api/startTopic", { topic, model });
    display(data);
  } catch (err) {
    display({ error: err.message });
  }
});

// ask question
document.getElementById("askBtn").addEventListener("click", async () => {
  const topic = document.getElementById("topic").value.trim();
  const question = document.getElementById("question").value.trim();
  const model = document.getElementById("modelSelect").value;
  if (!topic || !question) return alert("Enter a topic and question");

  try {
    const data = await postData("/api/askQuestion", { topic, question, model });
    display(data);
  } catch (err) {
    display({ error: err.message });
  }
});

// hint
document.getElementById("hintBtn").addEventListener("click", async () => {
  const topic = document.getElementById("topic").value.trim();
  const model = document.getElementById("modelSelect").value;
  if (!topic) return alert("Enter a topic first");

  try {
    const data = await postData("/api/hint", { topic, model });
    display(data);
  } catch (err) {
    display({ error: err.message });
  }
});
