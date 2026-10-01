import { useState, useEffect, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import api, { TOKEN_KEY } from "../api";
import DashboardHome from "./DashboardHome";
import ApplicationsList from "./ApplicationsList";
import KanbanBoard from "./KanbanBoard";
import ApplicationDetails from "./ApplicationDetails";
import Statistics from "./Statistics";

function getEmailFromToken() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return "";
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload)).email || "";
  } catch {
    return "";
  }
}

function getInitials(text) {
  return String(text || "Job")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Icon({ name, size = 20, className = "" }) {
  const icons = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="3" />
        <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
        <path d="M3 12h18M10 12v2h4v-2" />
      </>
    ),
    kanban: (
      <>
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="10" y="3" width="5" height="12" rx="1" />
        <rect x="17" y="3" width="5" height="8" rx="1" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        <path d="M14 8l4 4-4 4M18 12H8" />
      </>
    ),
  };

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || null}
    </svg>
  );
}

const NAV_ITEMS = [
  { path: "/dashboard", label: "Overview", icon: "overview", exact: true },
  { path: "/dashboard/applications", label: "My Applications", icon: "briefcase" },
  { path: "/dashboard/kanban", label: "Kanban Board", icon: "kanban" },
  { path: "/dashboard/statistics", label: "Statistics", icon: "chart" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState({ email: getEmailFromToken() });
  const [appCount, setAppCount] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await api.get("/user/me");
      setProfile(data.user);
    } catch {
      // Token may be expired; interceptor handles redirect
    }
  }, []);

  const loadAppCount = useCallback(async () => {
    try {
      const { data } = await api.get("/application", { params: { limit: 1 } });
      setAppCount(data.pagination?.total || 0);
    } catch {
      // Silently fail for count
    }
  }, []);

  useEffect(() => {
    loadProfile();
    loadAppCount();
  }, [loadProfile, loadAppCount]);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new Event("auth:changed"));
    navigate("/login", { replace: true });
  };

  const emailName = profile.email?.split("@")[0] || "there";
  const displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

  const isActive = (path, exact) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand-wrap">
          <div className="brand dashboard-brand">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>JobTracker</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <span className="sidebar-label">Workspace</span>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`sidebar-link ${isActive(item.path, item.exact) ? "active" : ""}`}
              type="button"
              onClick={() => navigate(item.path)}
            >
              <Icon name={item.icon} />
              {item.label}
              {item.path === "/dashboard/applications" && appCount > 0 && (
                <span className="sidebar-count">{appCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-tip">
          <span className="tip-icon">
            <Icon name="chart" size={18} />
          </span>
          <strong>Keep the momentum</strong>
          <p>Update each application as your search progresses.</p>
        </div>

        <div className="sidebar-account">
          <div className="avatar avatar-small">{getInitials(displayName)}</div>
          <div className="account-copy">
            <strong>{displayName}</strong>
            <span>{profile.email || "Account"}</span>
          </div>
          <button
            type="button"
            className="sidebar-logout"
            onClick={logout}
            aria-label="Log out"
            title="Log out"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </aside>

      <div className="dashboard-workspace">
        <header className="dashboard-topbar">
          <div className="mobile-dashboard-brand">
            <div className="brand dashboard-brand">
              <span className="brand-mark" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>JobTracker</span>
            </div>
          </div>
          <div className="topbar-context">
            <span>Workspace</span>
            <strong>/</strong>
            <span>
              {NAV_ITEMS.find((item) => isActive(item.path, item.exact))?.label || "Dashboard"}
            </span>
          </div>
          <div className="topbar-account">
            <div className="account-copy">
              <strong>{displayName}</strong>
              <span>{profile.email || "Account"}</span>
            </div>
            <div className="avatar">{getInitials(displayName)}</div>
          </div>
        </header>

        <main className="dashboard-content">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/applications" element={<ApplicationsList />} />
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/statistics" element={<Statistics />} />
            <Route path="/application/:id" element={<ApplicationDetails />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
