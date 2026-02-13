import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers/authProvider";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setToken, setRefreshToken, setName, setUserType, setCoop } = useAuth();

  const apiUrl = import.meta.env.VITE_API_URL;
  const path = apiUrl + "/authen/login";

  const handleSubmit = async (e) => {
  e.preventDefault();
  const logIn = { username, password };

  // ✅ จุดที่ 1
  if (!navigator.onLine) {
    Swal.fire({
      title: "ไม่มีอินเทอร์เน็ต",
      icon: "warning",
      text: "ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อเข้าสู่ระบบ",
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#03A14C",
    });
    return;
  }

  try {
    const response = await axios.post(path, logIn);

    const { access_token, refresh_token, name, user_type, coop_list } = response.data;

    setToken(access_token);
    setRefreshToken(refresh_token);
    setName(name);
    setUserType(user_type);
    setCoop(coop_list);

    navigate("/", { replace: true });

    Swal.fire({
      title: "สำเร็จ",
      icon: "success",
      confirmButtonText: "ตกลง",
      confirmButtonColor: "#03A14C",
      timer: 1000,
    });

  } catch (error) {

    // ✅ จุดที่ 2
    if (!navigator.onLine || error.message === "Network Error") {
      Swal.fire({
        title: "ไม่มีอินเทอร์เน็ต",
        icon: "warning",
        text: "ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อเข้าสู่ระบบ",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#03A14C",
      });
      return;
    }

    const errorStatus = error?.response?.status;

    if (errorStatus === 400 || errorStatus === 401) {
      Swal.fire({
        title: "ไม่สำเร็จ",
        icon: "error",
        text: "ชื่อผู้ใช้ หรือ รหัสผ่านไม่ถูกต้อง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#03A14C",
      });
    } else {
      Swal.fire({
        title: "เชื่อมต่อระบบไม่ได้",
        icon: "error",
        text: "กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง",
        confirmButtonColor: "#03A14C",
      });
    }
  }
};


  return (
    <div style={{ padding: 24 }}>
      <h2>MRS Login</h2>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 320 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
