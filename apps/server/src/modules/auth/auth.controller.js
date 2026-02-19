import { loginUser } from "./auth.service.js";

export const login = async (req, res) => {
  const { username, password } = req.body;
  const result = loginUser(username, password);
  return res.json(result);
};
