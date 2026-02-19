import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginApi } from "@/core/api/authApi";
import { useAuth } from "@/providers/authProvider";

export default function LoginPage() {
  const { login: saveAuth } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const data = await loginApi({ username, password });

      saveAuth({
        token: data.access_token,
        refreshToken: data.refresh_token ?? null,
        username: data.username,
        name: data.name,
        userType: data.user_type,
        coop: data.coop_list ?? [],
      });

      navigate("/", { replace: true });
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        placeholder="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="password"
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
