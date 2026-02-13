const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "mrs-backend" });
});

app.listen(3333, () => {
  console.log("Backend running at http://localhost:3333");
});
