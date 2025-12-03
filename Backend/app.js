const express = require("express");
const path = require('path');
const cors = require("cors");

const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const app = express();
app.use(express.json());
app.use(cors());

const frontendPath = path.join(__dirname, '../Frontend/build');
app.use(express.static(frontendPath));

app.use("/api", aiRoutes);
app.use("/api", userRoutes);
app.use("/api", sessionRoutes);

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

module.exports = app;