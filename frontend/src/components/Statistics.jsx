import { useState, useEffect, useMemo } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import api, { getErrorMessage } from "../api";

const STATUS_META = {
  saved: { label: "Saved", color: "#8b95a8" },
  applied: { label: "Applied", color: "#4f73ca" },
  screening: { label: "Screening", color: "#b27720" },
  interview: { label: "Interview", color: "#7654c7" },
  technical: { label: "Technical", color: "#c754a0" },
  final: { label: "Final Round", color: "#25885f" },
  offer: { label: "Offer", color: "#1a9e6c" },
  accepted: { label: "Accepted", color: "#0d7a52" },
  rejected: { label: "Rejected", color: "#d5515e" },
  withdrawn: { label: "Withdrawn", color: "#9aa3b2" },
};

export default function Statistics() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadStatistics = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await api.get("/application/statistics");
      setStatistics(data.statistics);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load statistics."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  const maxMonthlyCount = useMemo(() => {
    if (!statistics?.byMonth?.length) return 1;
    return Math.max(...statistics.byMonth.map((m) => m.count), 1);
  }, [statistics]);

  const maxSourceCount = useMemo(() => {
    if (!statistics?.bySource) return 1;
    return Math.max(...Object.values(statistics.bySource), 1);
  }, [statistics]);

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="stats-loading">
          <Skeleton variant="rounded" width="60%" height={40} />
          <Skeleton variant="rounded" width="40%" height={20} />
          <div className="stats-grid">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={126} />
            ))}
          </div>
          <Skeleton variant="rounded" height={300} />
        </div>
      </div>
    );
  }

  if (loadError || !statistics) {
    return (
      <div className="statistics-page">
        <Alert severity="error" className="dashboard-alert">
          {loadError || "Failed to load statistics."}
        </Alert>
        <Button variant="outlined" onClick={loadStatistics}>
          Retry
        </Button>
      </div>
    );
  }

  const conversionRates = statistics.conversionRates || {};
  const total = statistics.total || 0;

  return (
    <div className="statistics-page">
      <section className="welcome-section">
        <div>
          <span className="dashboard-eyebrow">Analytics</span>
          <Typography component="h1" className="dashboard-title">
            Statistics
          </Typography>
          <Typography className="dashboard-subtitle">
            Insights from your job search activity.
          </Typography>
        </div>
        <Button variant="outlined" className="secondary-action" onClick={loadStatistics}>
          Refresh
        </Button>
      </section>

      <section className="stats-grid" aria-label="Key metrics">
        <article className="stat-card">
          <div className="stat-icon stat-blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="18" height="13" rx="3" />
              <path d="M8 7V5.5A2.5 2.5 0 0 1 10.5 3h3A2.5 2.5 0 0 1 16 5.5V7" />
            </svg>
          </div>
          <div className="stat-copy">
            <span>Total Applications</span>
            <strong>{total}</strong>
            <small>All time</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-violet">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17 10 11l4 4 6-8" />
              <path d="M15 7h5v5" />
            </svg>
          </div>
          <div className="stat-copy">
            <span>Interview Rate</span>
            <strong>{conversionRates.interviewRate || 0}%</strong>
            <small>Of active applications</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16 9" />
            </svg>
          </div>
          <div className="stat-copy">
            <span>Offer Rate</span>
            <strong>{conversionRates.offerRate || 0}%</strong>
            <small>Of active applications</small>
          </div>
        </article>

        <article className="stat-card">
          <div className="stat-icon stat-amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>
          <div className="stat-copy">
            <span>Rejection Rate</span>
            <strong>{conversionRates.rejectionRate || 0}%</strong>
            <small>Of total applications</small>
          </div>
        </article>
      </section>

      <div className="charts-grid">
        <section className="chart-panel">
          <div className="panel-heading">
            <div>
              <Typography component="h2" className="panel-title">
                Applications by Status
              </Typography>
              <Typography className="panel-subtitle">
                Distribution across all stages
              </Typography>
            </div>
          </div>
          <div className="chart-content">
            {Object.entries(statistics.byStatus || {}).map(([status, count]) => {
              const meta = STATUS_META[status];
              if (!meta) return null;
              const percentage = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={status} className="chart-bar-row">
                  <div className="chart-bar-label">
                    <span
                      className="chart-bar-dot"
                      style={{ background: meta.color }}
                    />
                    {meta.label}
                  </div>
                  <div className="chart-bar-track">
                    <div
                      className="chart-bar-fill"
                      style={{
                        width: `${percentage}%`,
                        background: meta.color,
                      }}
                    />
                  </div>
                  <div className="chart-bar-value">{count}</div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="chart-panel">
          <div className="panel-heading">
            <div>
              <Typography component="h2" className="panel-title">
                Applications by Month
              </Typography>
              <Typography className="panel-subtitle">
                Last 12 months
              </Typography>
            </div>
          </div>
          <div className="chart-content">
            {(statistics.byMonth || []).length === 0 ? (
              <p className="empty-chart">No data available</p>
            ) : (
              <div className="monthly-chart">
                {(statistics.byMonth || [])
                  .slice()
                  .reverse()
                  .map((item) => {
                    const height = (item.count / maxMonthlyCount) * 100;
                    return (
                      <div key={item.month} className="monthly-bar-wrapper">
                        <div className="monthly-bar-track">
                          <div
                            className="monthly-bar-fill"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="monthly-bar-label">
                          {item.month.slice(5)}
                        </span>
                        <span className="monthly-bar-value">{item.count}</span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </section>

        <section className="chart-panel">
          <div className="panel-heading">
            <div>
              <Typography component="h2" className="panel-title">
                Applications by Source
              </Typography>
              <Typography className="panel-subtitle">
                Where you found opportunities
              </Typography>
            </div>
          </div>
          <div className="chart-content">
            {Object.entries(statistics.bySource || {}).length === 0 ? (
              <p className="empty-chart">No data available</p>
            ) : (
              Object.entries(statistics.bySource).map(([source, count]) => {
                const percentage = (count / maxSourceCount) * 100;
                return (
                  <div key={source} className="chart-bar-row">
                    <div className="chart-bar-label">
                      <span className="chart-bar-dot" style={{ background: "#4f73ca" }} />
                      {source}
                    </div>
                    <div className="chart-bar-track">
                      <div
                        className="chart-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          background: "#4f73ca",
                        }}
                      />
                    </div>
                    <div className="chart-bar-value">{count}</div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="chart-panel">
          <div className="panel-heading">
            <div>
              <Typography component="h2" className="panel-title">
                Applications by Work Type
              </Typography>
              <Typography className="panel-subtitle">
                Remote vs Hybrid vs On-site
              </Typography>
            </div>
          </div>
          <div className="chart-content">
            {Object.entries(statistics.byWorkType || {}).length === 0 ? (
              <p className="empty-chart">No data available</p>
            ) : (
              Object.entries(statistics.byWorkType).map(([type, count]) => {
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={type} className="chart-bar-row">
                    <div className="chart-bar-label">
                      <span className="chart-bar-dot" style={{ background: "#7654c7" }} />
                      {type}
                    </div>
                    <div className="chart-bar-track">
                      <div
                        className="chart-bar-fill"
                        style={{
                          width: `${percentage}%`,
                          background: "#7654c7",
                        }}
                      />
                    </div>
                    <div className="chart-bar-value">{count}</div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
