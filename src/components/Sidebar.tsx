import { NavLink } from "react-router-dom";
import { Activity, LayoutDashboard, Users, ShieldCheck, X } from "lucide-react";

type SidebarProps = { open: boolean; onClose: () => void };

export default function Sidebar({ open, onClose }: SidebarProps) {
  const links = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/entries", label: "Crowd Entries", icon: Users },
  ];

  return (
    <>
      {open && <button className="sidebar-overlay" aria-label="Close navigation" onClick={onClose} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon"><Activity size={23} /></div>
          <div className="brand-copy">
            <strong>CrowdSense</strong>
            <span>MANAGEMENT SYSTEM</span>
          </div>
          <button className="mobile-close" onClick={onClose} aria-label="Close sidebar"><X size={20} /></button>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-links">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
              <Icon size={19} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={19} />
          <div><strong>System Status</strong><span>Monitoring workspace</span></div>
        </div>
      </aside>
    </>
  );
}