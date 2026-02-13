import React, { useMemo, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { OverlayPanel } from "primereact/overlaypanel";
import { Button } from "primereact/button";
import { Divider } from "primereact/divider";

import { useAuth } from "../providers/authProvider";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const { name, logout } = useAuth();
  const op = useRef(null);

  // ✅ path ให้เหมือนเว็บหลัก
  const menus = useMemo(
    () => [
      { label: "บันทึกการชั่งน้ำหนัก", to: "/truck-weighing", icon: "pi pi-pencil" },
      {
        label: "บันทึกการชั่งน้ำหนักแบบ Manual",
        to: "/truck-weighing/manual",
        icon: "pi pi-pencil",
      },
    ],
    []
  );

  const handleLogout = async () => {
    op.current?.hide();

    const result = await Swal.fire({
      title: "ต้องการออกจากระบบใช่ไหม?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ออกจากระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#d33",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="mrs-nav">
      <div className="mrs-nav__card">
        {/* LEFT */}
        <div className="mrs-left" onClick={() => navigate("/")}>
          <i className="pi pi-home mrs-home" />
          <div className="mrs-title" title="RFID - Milk Receiving System for MSC">
            RFID - Milk Receiving System for MSC
          </div>
        </div>

        {/* CENTER */}
        <nav className="mrs-center" aria-label="Main navigation">
          {menus.map((m, idx) => (
            <React.Fragment key={m.to}>
              <NavLink
                to={m.to}
                className={({ isActive }) =>
                  `mrs-menuItem ${isActive ? "is-active" : ""}`
                }
              >
                <i className={m.icon} />
                <span>{m.label}</span>
              </NavLink>

              {idx !== menus.length - 1 && <span className="mrs-vline" />}
            </React.Fragment>
          ))}
        </nav>

        {/* RIGHT */}
        <div className="mrs-right">
          <button
            className="mrs-userChip"
            onClick={(e) => op.current?.toggle(e)}
            type="button"
            aria-label="User menu"
          >
            <span className="mrs-userChip__icon">
              <i className="pi pi-user" />
            </span>
          </button>

          <OverlayPanel ref={op} className="mrs-op" dismissable>
            <div className="mrs-op__head">
              <div className="mrs-op__meta">
                <div className="mrs-op__name">{name || "User"}</div>
                <div className="mrs-op__sub">Signed in</div>
              </div>
            </div>

            <Divider />

            <div className="mrs-op__actions">
              <Button
                label="ออกจากระบบ"
                icon="pi pi-sign-out"
                severity="danger"
                text
                className="w-full justify-content-start"
                onClick={handleLogout}
              />
            </div>
          </OverlayPanel>
        </div>
      </div>
    </header>
  );
}
