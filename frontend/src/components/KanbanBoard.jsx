import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import api, { getErrorMessage } from "../api";

const COLUMNS = [
  { status: "saved", label: "Saved", color: "#8b95a8" },
  { status: "applied", label: "Applied", color: "#4f73ca" },
  { status: "screening", label: "Screening", color: "#b27720" },
  { status: "interview", label: "Interview", color: "#7654c7" },
  { status: "technical", label: "Technical", color: "#c754a0" },
  { status: "final", label: "Final Round", color: "#25885f" },
  { status: "offer", label: "Offer", color: "#1a9e6c" },
  { status: "accepted", label: "Accepted", color: "#0d7a52" },
  { status: "rejected", label: "Rejected", color: "#d5515e" },
  { status: "withdrawn", label: "Withdrawn", color: "#9aa3b2" },
];

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
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

export default function KanbanBoard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await api.get("/application", {
        params: { limit: 100, sortBy: "newest" },
      });
      setApplications(data.applications || []);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load applications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleDragStart = (event, application) => {
    setDraggedItem(application);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", application._id);
  };

  const handleDragOver = (event, status) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (event, newStatus) => {
    event.preventDefault();
    setDragOverColumn(null);

    if (!draggedItem) return;

    const oldStatus = draggedItem.status;
    if (oldStatus === newStatus) {
      setDraggedItem(null);
      return;
    }

    setUpdatingId(draggedItem._id);

    // Optimistic update
    setApplications((current) =>
      current.map((app) =>
        app._id === draggedItem._id ? { ...app, status: newStatus } : app,
      ),
    );

    try {
      const { data } = await api.patch(`/application/${draggedItem._id}/status`, {
        status: newStatus,
      });

      setApplications((current) =>
        current.map((app) =>
          app._id === draggedItem._id ? data.application : app,
        ),
      );

      setToast({
        message: `Moved to ${COLUMNS.find((c) => c.status === newStatus)?.label}`,
        severity: "success",
      });
    } catch (error) {
      // Revert on error
      setApplications((current) =>
        current.map((app) =>
          app._id === draggedItem._id ? { ...app, status: oldStatus } : app,
        ),
      );
      setToast({
        message: getErrorMessage(error, "Failed to update status."),
        severity: "error",
      });
    } finally {
      setDraggedItem(null);
      setUpdatingId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const getColumnApplications = (status) => {
    return applications.filter((app) => app.status === status);
  };

  if (loading) {
    return (
      <div className="kanban-page">
        <div className="kanban-loading">
          <div className="kanban-loading-columns">
            {COLUMNS.slice(0, 5).map((col) => (
              <div key={col.status} className="kanban-loading-column">
                <Skeleton width="80%" height={24} />
                <Skeleton variant="rounded" height={80} />
                <Skeleton variant="rounded" height={80} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kanban-page">
      <section className="welcome-section">
        <div>
          <span className="dashboard-eyebrow">Pipeline</span>
          <Typography component="h1" className="dashboard-title">
            Kanban Board
          </Typography>
          <Typography className="dashboard-subtitle">
            Drag and drop applications between stages to update their status.
          </Typography>
        </div>
        <Button
          variant="outlined"
          className="secondary-action"
          onClick={loadApplications}
        >
          Refresh
        </Button>
      </section>

      {loadError && (
        <Alert
          severity="error"
          className="dashboard-alert"
          action={
            <Button color="inherit" size="small" onClick={loadApplications}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      <div className="kanban-board">
        {COLUMNS.map((column) => {
          const columnApps = getColumnApplications(column.status);
          const isDragOver = dragOverColumn === column.status;

          return (
            <div
              key={column.status}
              className={`kanban-column ${isDragOver ? "kanban-column-dragover" : ""}`}
              onDragOver={(e) => handleDragOver(e, column.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="kanban-column-header">
                <span
                  className="kanban-column-dot"
                  style={{ background: column.color }}
                />
                <span className="kanban-column-title">{column.label}</span>
                <span className="kanban-column-count">{columnApps.length}</span>
              </div>

              <div className="kanban-cards">
                {columnApps.length === 0 ? (
                  <div className="kanban-empty-column">
                    <p>No applications</p>
                  </div>
                ) : (
                  columnApps.map((app) => (
                    <div
                      key={app._id}
                      className={`kanban-card ${
                        draggedItem?._id === app._id ? "kanban-card-dragging" : ""
                      } ${updatingId === app._id ? "kanban-card-updating" : ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app)}
                      onDragEnd={handleDragEnd}
                      onClick={() =>
                        navigate(`/dashboard/application/${app._id}`)
                      }
                    >
                      <div className="kanban-card-header">
                        <div className="kanban-card-company">
                          {getInitials(app.company)}
                        </div>
                        <div className="kanban-card-info">
                          <strong>{app.company}</strong>
                          <span>{app.jobTitle}</span>
                        </div>
                      </div>

                      <div className="kanban-card-meta">
                        {app.location && (
                          <span className="kanban-card-tag">
                            {app.location}
                          </span>
                        )}
                        {app.priority && (
                          <span
                            className={`kanban-card-priority priority-${app.priority}`}
                          >
                            {app.priority}
                          </span>
                        )}
                      </div>

                      <div className="kanban-card-footer">
                        <span className="kanban-card-date">
                          {formatDate(app.appliedDate || app.createdAt)}
                        </span>
                        {app.interviews?.length > 0 && (
                          <span className="kanban-card-interviews">
                            {app.interviews.length} interview
                            {app.interviews.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
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
