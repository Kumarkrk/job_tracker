import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import api, { getErrorMessage } from "../api";

const STATUS_META = {
  saved: { label: "Saved", className: "status-saved" },
  applied: { label: "Applied", className: "status-applied" },
  screening: { label: "Screening", className: "status-screening" },
  interview: { label: "Interview", className: "status-interview" },
  technical: { label: "Technical", className: "status-technical" },
  final: { label: "Final Round", className: "status-final" },
  offer: { label: "Offer", className: "status-offer" },
  accepted: { label: "Accepted", className: "status-accepted" },
  rejected: { label: "Rejected", className: "status-rejected" },
  withdrawn: { label: "Withdrawn", className: "status-withdrawn" },
};

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.applied;
  return (
    <span className={`status-badge ${meta.className}`}>
      <span />
      {meta.label}
    </span>
  );
}

function Icon({ name, size = 20 }) {
  const icons = {
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="3" />
        <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
        <path d="M3 12h18M10 12v2h4v-2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    trend: (
      <>
        <path d="M4 17 10 11l4 4 6-8" />
        <path d="M15 7h5v5" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    star: (
      <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6.01L12 16.77l-5.4 2.84 1.03-6.01-4.36-4.25 6.03-.88L12 3Z" />
    ),
  };

  return (
    <svg
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

export default function DashboardHome() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get("/application", { params: { limit: 100 } }),
        api.get("/application/statistics"),
      ]);

      setApplications(appsRes.data.applications || []);
      setStatistics(statsRes.data.statistics);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load dashboard data."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(() => {
    if (!statistics) return [];

    const byStatus = statistics.byStatus || {};
    const total = statistics.total || 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const thisWeek = applications.filter(
      (a) => new Date(a.createdAt) >= weekAgo,
    ).length;
    const thisMonth = applications.filter(
      (a) => new Date(a.createdAt) >= monthAgo,
    ).length;

    return [
      {
        label: "Total Applications",
        value: total,
        detail: `${thisMonth} this month`,
        icon: "briefcase",
        tone: "blue",
      },
      {
        label: "Active Pipeline",
        value:
          (byStatus.applied || 0) +
          (byStatus.screening || 0) +
          (byStatus.interview || 0) +
          (byStatus.technical || 0) +
          (byStatus.final || 0),
        detail: "In progress",
        icon: "trend",
        tone: "violet",
      },
      {
        label: "Interviews",
        value:
          (byStatus.interview || 0) +
          (byStatus.technical || 0) +
          (byStatus.final || 0),
        detail: "Scheduled or completed",
        icon: "clock",
        tone: "amber",
      },
      {
        label: "Offers",
        value: (byStatus.offer || 0) + (byStatus.accepted || 0),
        detail: `${byStatus.accepted || 0} accepted`,
        icon: "check",
        tone: "green",
      },
    ];
  }, [statistics, applications]);

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return applications
      .flatMap((app) =>
        (app.interviews || [])
          .filter(
            (iv) =>
              new Date(iv.date) >= now && iv.status === "scheduled",
          )
          .map((iv) => ({ ...iv, application: app })),
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [applications]);

  const upcomingFollowUps = useMemo(() => {
    const now = new Date();
    return applications
      .filter(
        (app) =>
          app.followUpDate &&
          new Date(app.followUpDate) >= now &&
          !["rejected", "withdrawn", "accepted"].includes(app.status),
      )
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate))
      .slice(0, 5);
  }, [applications]);

  const recentApplications = useMemo(() => {
    return [...applications]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [applications]);

  const statusDistribution = useMemo(() => {
    if (!statistics) return [];
    const byStatus = statistics.byStatus || {};
    return Object.entries(byStatus)
      .filter(([key]) => !["rejected", "withdrawn"].includes(key))
      .map(([key, value]) => ({
        status: key,
        label: STATUS_META[key]?.label || key,
        count: value,
        className: STATUS_META[key]?.className || "status-applied",
      }));
  }, [statistics]);

  const maxStatusCount = Math.max(...statusDistribution.map((s) => s.count), 1);

  if (loading) {
    return (
      <div className="dashboard-home">
        <div className="home-loading">
          <Skeleton variant="rounded" width="60%" height={40} />
          <Skeleton variant="rounded" width="40%" height={20} />
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={126} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <section className="welcome-section">
        <div>
          <span className="dashboard-eyebrow">{getGreeting()}</span>
          <Typography component="h1" className="dashboard-title">
            Application Overview
          </Typography>
          <Typography className="dashboard-subtitle">
            Track every opportunity and see your job-search progress at a glance.
          </Typography>
        </div>
        <Button
          variant="contained"
          className="primary-action"
          startIcon={<Icon name="plus" size={19} />}
          onClick={() => navigate("/dashboard/applications?new=true")}
        >
          Add Application
        </Button>
      </section>

      {loadError && (
        <Alert
          severity="error"
          className="dashboard-alert"
          action={
            <Button color="inherit" size="small" onClick={loadData}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      <section className="stats-grid" aria-label="Application statistics">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <div className={`stat-icon stat-icon-${stat.tone}`}>
              <Icon name={stat.icon} size={22} />
            </div>
            <div className="stat-copy">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.detail}</small>
            </div>
          </article>
        ))}
      </section>

      <div className="home-grid">
        <section className="home-panel">
          <div className="panel-heading">
            <div>
              <Typography component="h2" className="panel-title">
                Status Distribution
              </Typography>
              <Typography className="panel-subtitle">
                Your pipeline at a glance
              </Typography>
            </div>
          </div>
          <div className="status-distribution">
            {statusDistribution.length === 0 ? (
              <div className="empty-distribution">
                <p>No applications yet. Add your first one!</p>
              </div>
            ) : (
              statusDistribution.map((item) => (
                <div className="distribution-row" key={item.status}>
                  <span className={`status-badge ${item.className}`}>
                    <span />
                    {item.label}
                  </span>
                  <div className="distribution-bar">
                    <div
                      className="distribution-fill"
                      style={{
                        width: `${(item.count / maxStatusCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="distribution-count">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="home-panel">
          <div className="panel-heading">
            <div>
              <Typography component="h2" className="panel-title">
                Upcoming Interviews
              </Typography>
              <Typography className="panel-subtitle">
                Your next scheduled interviews
              </Typography>
            </div>
          </div>
          <div className="upcoming-list">
            {upcomingInterviews.length === 0 ? (
              <div className="empty-distribution">
                <p>No upcoming interviews scheduled.</p>
              </div>
            ) : (
              upcomingInterviews.map((interview) => (
                <button
                  key={interview._id}
                  className="upcoming-item"
                  onClick={() =>
                    navigate(
                      `/dashboard/application/${interview.application._id}`,
                    )
                  }
                >
                  <div className="upcoming-date">
                    <span className="upcoming-day">
                      {new Date(interview.date).getDate()}
                    </span>
                    <span className="upcoming-month">
                      {new Date(interview.date).toLocaleDateString("en", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="upcoming-info">
                    <strong>{interview.application.company}</strong>
                    <span>{interview.application.jobTitle}</span>
                    <small>
                      {new Date(interview.date).toLocaleTimeString("en", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {interview.type}
                    </small>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="home-grid">
        <section className="home-panel">
          <div className="panel-heading">
            <div>
              <Typography component="h2" className="panel-title">
                Recent Applications
              </Typography>
              <Typography className="panel-subtitle">
                Your latest additions
              </Typography>
            </div>
            <Button
              variant="text"
              size="small"
              onClick={() => navigate("/dashboard/applications")}
            >
              View all
            </Button>
          </div>
          <div className="recent-list">
            {recentApplications.length === 0 ? (
              <div className="empty-distribution">
                <p>No applications yet.</p>
              </div>
            ) : (
              recentApplications.map((app) => (
                <button
                  key={app._id}
                  className="recent-item"
                  onClick={() => navigate(`/dashboard/application/${app._id}`)}
                >
                  <div className="recent-info">
                    <strong>{app.company}</strong>
                    <span>{app.jobTitle}</span>
                  </div>
                  <div className="recent-meta">
                    <StatusBadge status={app.status} />
                    <small>{formatDate(app.createdAt)}</small>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="home-panel">
          <div className="panel-heading">
            <div>
              <Typography component="h2" className="panel-title">
                Follow-ups
              </Typography>
              <Typography className="panel-subtitle">
                Upcoming follow-up reminders
              </Typography>
            </div>
          </div>
          <div className="upcoming-list">
            {upcomingFollowUps.length === 0 ? (
              <div className="empty-distribution">
                <p>No upcoming follow-ups.</p>
              </div>
            ) : (
              upcomingFollowUps.map((app) => (
                <button
                  key={app._id}
                  className="upcoming-item"
                  onClick={() => navigate(`/dashboard/application/${app._id}`)}
                >
                  <div className="upcoming-date">
                    <span className="upcoming-day">
                      {new Date(app.followUpDate).getDate()}
                    </span>
                    <span className="upcoming-month">
                      {new Date(app.followUpDate).toLocaleDateString("en", {
                        month: "short",
                      })}
                    </span>
                  </div>
                  <div className="upcoming-info">
                    <strong>{app.company}</strong>
                    <span>{app.jobTitle}</span>
                    <small>Follow up</small>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>
      </div>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast?.severity || "success"}
          variant="filled"
          onClose={() => setToast(null)}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
