document.getElementById("submitBtn").addEventListener("click", async () => {
  const topic = document.getElementById("topic").value;
  if (!topic) return alert("Enter a topic");

  try {
    const response = await fetch("/api/fullcycle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, level: "Undergraduate", style: "gentle" })
    });

    const data = await response.json();
    document.getElementById("output").textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    console.error("Error fetching data:", err);
    document.getElementById("output").textContent = "Error: " + err.message;
  }
});