import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../providers/authProvider";

export default function Navbar() {
  const navigate = useNavigate();
  const { name, logout } = useAuth();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "ต้องการออกจากระบบใช่ไหม?",
      text: "คุณจะต้องเข้าสู่ระบบใหม่อีกครั้ง",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      logout();

      await Swal.fire({
        title: "ออกจากระบบแล้ว",
        icon: "success",
        timer: 900,
        showConfirmButton: false,
      });

      navigate("/login", { replace: true });
    }
  };

  return (
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        borderBottom: "1px solid #eee",
      }}
    >
      <div style={{ fontWeight: 700 }}>MRS</div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 14 }}>{name || ""}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}
