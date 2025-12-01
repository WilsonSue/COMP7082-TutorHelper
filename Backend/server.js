const express = require("express");
const axios = require("axios");
const path = require('path');

const aiRoutes = require("./routes/aiRoutes");
const userRoutes = require("./routes/userRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const cors = require("cors");
const db = require("./database");
require("dotenv").config();

const port = process.env.PORT || 3000;

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

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});