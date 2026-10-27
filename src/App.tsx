import { useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CrowdEntries from "./pages/CrowdEntries";
import ProtectedRoute from "./components/ProtectedRoute";
import { logout } from "./services/api";

function Workspace({ onLogout }: { onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Header onMenuClick={() => setSidebarOpen(true)} onLogout={onLogout} />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/entries" element={<CrowdEntries />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(
    () => Boolean(sessionStorage.getItem("crowd_access_token")),
  );

  function handleLogout() {
    logout();
    setAuthenticated(false);
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={authenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => setAuthenticated(true)} />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<Workspace onLogout={handleLogout} />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
