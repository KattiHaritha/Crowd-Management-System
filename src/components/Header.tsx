import { Bell, Menu, Search, LogOut, X } from "lucide-react";
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

type HeaderProps = { onMenuClick: () => void; onLogout: () => void };

export default function Header({ onMenuClick, onLogout }: HeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState(searchParams.get("search") ?? "");
  const title = location.pathname === "/entries" ? "Crowd Entries" : "Overview Dashboard";

  useEffect(() => {
    setQuery(searchParams.get("search") ?? "");
  }, [searchParams]);

  function applySearch(value: string) {
    const term = value.trim();
    navigate(term ? `/entries?search=${encodeURIComponent(term)}` : "/entries");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    applySearch(query);
    setSearchOpen(false);
  }

  function changeSearch(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setQuery(value);
    applySearch(value);
  }

  return <header className="top-header">
    <div className="header-left"><button className="icon-button menu-button" onClick={onMenuClick} aria-label="Open navigation"><Menu size={21} /></button><div><h1>{title}</h1><p>Monitor crowd activity and venue analytics</p></div></div>
    <div className="header-actions">
      {searchOpen && <form className="header-search" onSubmit={submitSearch}><Search size={17} /><input autoFocus value={query} onChange={changeSearch} placeholder="Search visitors" aria-label="Search visitors" /><button type="button" onClick={() => { setQuery(""); applySearch(""); setSearchOpen(false); }} aria-label="Clear search"><X size={17} /></button></form>}
      <button className="icon-button search-button" onClick={() => { setNotificationsOpen(false); setSearchOpen((open) => !open); }} aria-label="Search" title="Search visitors"><Search size={20} /></button>
      <div className="notification-menu"><button className="icon-button" onClick={() => { setSearchOpen(false); setNotificationsOpen((open) => !open); }} aria-label="Notifications" aria-expanded={notificationsOpen} title="Notifications"><Bell size={20} /></button>{notificationsOpen && <div className="notification-popover" role="status"><strong>Live crowd alerts</strong><p>New entry, exit, and occupancy alerts appear on the dashboard.</p><button type="button" onClick={() => { setNotificationsOpen(false); navigate("/dashboard"); }}>View alerts</button></div>}</div>
      <div className="avatar" title="Signed-in user">U</div>
      <button className="icon-button logout-button" onClick={() => { onLogout(); navigate("/login"); }} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
    </div>
  </header>;
}
