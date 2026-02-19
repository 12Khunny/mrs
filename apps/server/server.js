import express from "express";
import cors from "cors";
import authRouter from "./src/modules/auth/auth.routes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", authRouter);

app.get("/api", (_req, res) => {
  res.json({ fruits: ["Apple", "Banana", "Cherry"] });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
