const outputBox = document.getElementById("output");
const model = document.getElementById("modelSelect").value;

async function postData(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

// =====================
// OUTPUT FORMATTING
// =====================

// Nicely format output objects from the backend
function formatOutput(data) {
  // If response contains AI results (object), build readable sections
  if (typeof data === "object" && data !== null) {
    let formatted = "";

    for (const key in data) {
      const value = data[key];
      const title = key.replace(/([A-Z])/g, " $1").toUpperCase();

      formatted += `=== ${title.trim()} ===\n`;

      if (typeof value === "string") {
        formatted += wrapText(value) + "\n\n";
      } else if (Array.isArray(value)) {
        formatted += value
          .map((v, i) => {
            if (typeof v === "object") {
              return `#${i + 1}: ${v.model ? `[${v.model}] ` : ""}${wrapText(JSON.stringify(v.check || v, null, 2))}`;
            } else {
              return `#${i + 1}: ${wrapText(String(v))}`;
            }
          })
          .join("\n\n");
        formatted += "\n\n";
      } else if (typeof value === "object" && value !== null) {
        formatted += JSON.stringify(value, null, 2) + "\n\n";
      } else {
        formatted += String(value) + "\n\n";
      }
    }

    return formatted.trim();
  }

  // Otherwise just return wrapped text
  return wrapText(String(data));
}

// Helper to wrap text to readable width
function wrapText(text, width = 80) {
  const words = text.split(/\s+/);
  let lines = [];
  let current = "";

  for (const word of words) {
    if ((current + word).length > width) {
      lines.push(current.trim());
      current = "";
    }
    current += word + " ";
  }
  if (current) lines.push(current.trim());

  return lines.join("\n");
}

function display(data) {
  outputBox.textContent = formatOutput(data);
}

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
