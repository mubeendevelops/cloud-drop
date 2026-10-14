import { useEffect, useId, useRef, useState } from "react";
import GradientMesh from "./ui/GradientMesh.jsx";
import Logo from "./ui/Logo.jsx";

const getInitial = (user) =>
  (user?.name || user?.email || "?").trim().charAt(0).toUpperCase();

const UserMenu = ({ user, onSignOut }) => {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const firstItemRef = useRef(null);

  // Focus the first item on open; close on Escape, outside click, or focus
  // leaving the menu
  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    const handlePointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handleFocus = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("focusin", handleFocus);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("focusin", handleFocus);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="user-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="avatar" aria-hidden="true">
          {getInitial(user)}
        </span>
        <span className="user-menu-name">{user?.name}</span>
        <span className="visually-hidden">Account menu</span>
        <svg className="user-menu-chevron" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="user-menu-panel" id={menuId} role="menu" aria-label="Account">
          <div className="user-menu-info" role="presentation">
            <span className="user-menu-info-name">{user?.name}</span>
            {user?.email && <span className="user-menu-info-email">{user.email}</span>}
          </div>
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            className="user-menu-item"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

const AppHeader = ({ user, onSignOut }) => (
  <header className="app-header">
    <GradientMesh className="mesh-header" />
    <div className="app-header-inner">
      <Logo />
      <UserMenu user={user} onSignOut={onSignOut} />
    </div>
  </header>
);

export default AppHeader;
