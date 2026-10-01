import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import api, { getErrorMessage } from "../api";
import ApplicationForm from "./ApplicationForm";

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

const STATUS_ORDER = [
  "saved",
  "applied",
  "screening",
  "interview",
  "technical",
  "final",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
];

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
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
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    edit: (
      <>
        <path d="M4 20h4l11-11-4-4L4 16v4Z" />
        <path d="m13.5 6.5 4 4" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" />
        <path d="M10 11v6M14 11v6" />
      </>
    ),
    location: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
    empty: (
      <>
        <path d="M4 7h6l2 2h8v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" />
        <path d="M9 15h6" />
      </>
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

export default function ApplicationsList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workTypeFilter, setWorkTypeFilter] = useState("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const params = {
        page: page.toString(),
        limit: "20",
        sortBy,
      };

      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (workTypeFilter !== "all") params.workType = workTypeFilter;
      if (employmentTypeFilter !== "all") params.employmentType = employmentTypeFilter;

      const { data } = await api.get("/application", { params });
      setApplications(data.applications || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load applications."));
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, search, statusFilter, workTypeFilter, employmentTypeFilter]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setEditing(null);
      setFormOpen(true);
      searchParams.delete("new");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const activeFilterCount =
    Number(statusFilter !== "all") +
    Number(workTypeFilter !== "all") +
    Number(employmentTypeFilter !== "all") +
    Number(Boolean(search));

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setWorkTypeFilter("all");
    setEmploymentTypeFilter("all");
    setPage(1);
  };

  const openCreateDialog = () => {
    setEditing(null);
    setFormError("");
    setFormOpen(true);
  };

  const openEditDialog = (application) => {
    setEditing(application);
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setFormError("");
  };

  const saveApplication = async (values) => {
    setSaving(true);
    setFormError("");

    try {
      const response = editing
        ? await api.patch(`/application/${editing._id}`, values)
        : await api.post("/application", values);

      const savedApplication = response.data.application;

      if (editing) {
        setApplications((current) =>
          current.map((item) =>
            item._id === savedApplication._id ? savedApplication : item,
          ),
        );
      } else {
        setApplications((current) => [savedApplication, ...current]);
      }

      setFormOpen(false);
      setEditing(null);
      setToast({
        message: editing
          ? "Application updated successfully."
          : "Application added successfully.",
        severity: "success",
      });
    } catch (error) {
      setFormError(getErrorMessage(error, "Unable to save this application."));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.delete(`/application/${deleteTarget._id}`);
      setApplications((current) =>
        current.filter((item) => item._id !== deleteTarget._id),
      );
      setDeleteTarget(null);
      setToast({
        message: "Application deleted successfully.",
        severity: "success",
      });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Unable to delete this application."),
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="applications-list-page">
      <section className="welcome-section">
        <div>
          <span className="dashboard-eyebrow">Applications</span>
          <Typography component="h1" className="dashboard-title">
            My Applications
          </Typography>
          <Typography className="dashboard-subtitle">
            Search, filter, and manage all your job applications.
          </Typography>
        </div>
        <Button
          variant="contained"
          className="primary-action"
          startIcon={<Icon name="plus" size={19} />}
          onClick={openCreateDialog}
        >
          Add Application
        </Button>
      </section>

      <section className="applications-panel">
        <div className="panel-heading">
          <div>
            <Typography component="h2" className="panel-title">
              All Applications
            </Typography>
            <Typography className="panel-subtitle">
              {loading
                ? "Loading..."
                : `${pagination.total} total applications`}
            </Typography>
          </div>
        </div>

        <div className="application-toolbar">
          <label className="search-field">
            <Icon name="search" size={19} />
            <span className="sr-only">Search applications</span>
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by title, company, location..."
            />
          </label>

          <div className="toolbar-filters">
            <label className="select-field">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {Object.entries(STATUS_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="select-field">
              <span>Work Type</span>
              <select
                value={workTypeFilter}
                onChange={(event) => {
                  setWorkTypeFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by work type"
              >
                <option value="all">All types</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </label>

            <label className="select-field">
              <span>Employment</span>
              <select
                value={employmentTypeFilter}
                onChange={(event) => {
                  setEmploymentTypeFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by employment type"
              >
                <option value="all">All types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </label>

            <label className="select-field sort-field">
              <span>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => {
                  setSortBy(event.target.value);
                  setPage(1);
                }}
                aria-label="Sort applications"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="company">Company A-Z</option>
                <option value="appliedDate">Applied date</option>
                <option value="deadline">Deadline</option>
              </select>
            </label>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div className="active-filter-row">
            <span>
              {activeFilterCount} active filter{activeFilterCount > 1 ? "s" : ""}
            </span>
            <button type="button" onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

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

        {loading ? (
          <div className="loading-table" aria-label="Loading applications">
            <div className="loading-head">
              <Skeleton width="28%" height={34} />
              <Skeleton width="18%" height={34} />
              <Skeleton width="14%" height={34} />
              <Skeleton width="18%" height={34} />
              <Skeleton width="12%" height={34} />
            </div>
            {[1, 2, 3].map((row) => (
              <div className="loading-row" key={row}>
                <Skeleton variant="rounded" width="58" height={58} />
                <Skeleton width="32%" height={38} />
                <Skeleton width="18%" height={38} />
                <Skeleton width="14%" height={38} />
                <Skeleton width="18%" height={38} />
                <Skeleton width="70" height={38} />
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Icon name="empty" size={30} />
            </span>
            <Typography component="h3">
              {pagination.total === 0
                ? "Your application list is ready"
                : "No applications found"}
            </Typography>
            <Typography>
              {pagination.total === 0
                ? "Add your first opportunity and start tracking your progress."
                : "Try changing your search or clearing the active filters."}
            </Typography>
            {pagination.total === 0 ? (
              <Button
                variant="contained"
                className="primary-action"
                startIcon={<Icon name="plus" size={18} />}
                onClick={openCreateDialog}
              >
                Add first application
              </Button>
            ) : (
              <Button variant="outlined" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="applications-table-wrap">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>Company / Role</th>
                    <th>Location</th>
                    <th>Work Type</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr
                      key={application._id}
                      onClick={() =>
                        navigate(`/dashboard/application/${application._id}`)
                      }
                      className="clickable-row"
                    >
                      <td>
                        <div className="application-role">
                          <div className="role-avatar role-avatar-it">
                            {getInitials(application.company)}
                          </div>
                          <div>
                            <strong>{application.jobTitle}</strong>
                            <span>{application.company}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-meta">
                          <Icon name="location" size={16} />
                          {application.location || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="table-meta">
                          {application.workType || "—"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={application.status} />
                      </td>
                      <td>
                        <span className="date-value">
                          <Icon name="calendar" size={16} />
                          {formatDate(application.appliedDate || application.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditDialog(application);
                            }}
                            aria-label={`Edit ${application.jobTitle}`}
                            title="Edit application"
                          >
                            <Icon name="edit" size={17} />
                          </button>
                          <button
                            type="button"
                            className="delete-action"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(application);
                            }}
                            aria-label={`Delete ${application.jobTitle}`}
                            title="Delete application"
                          >
                            <Icon name="trash" size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="applications-mobile-list">
              {applications.map((application) => (
                <article
                  className="application-mobile-card"
                  key={application._id}
                  onClick={() =>
                    navigate(`/dashboard/application/${application._id}`)
                  }
                >
                  <div className="mobile-card-heading">
                    <div className="application-role">
                      <div className="role-avatar role-avatar-it">
                        {getInitials(application.company)}
                      </div>
                      <div>
                        <strong>{application.jobTitle}</strong>
                        <span>{application.company}</span>
                      </div>
                    </div>
                    <StatusBadge status={application.status} />
                  </div>
                  <div className="mobile-card-details">
                    <span>
                      <Icon name="location" size={16} /> {application.location || "—"}
                    </span>
                    <span>
                      <Icon name="calendar" size={16} />{" "}
                      {formatDate(application.appliedDate || application.createdAt)}
                    </span>
                  </div>
                  <div className="mobile-card-actions">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditDialog(application);
                      }}
                    >
                      <Icon name="edit" size={17} /> Edit
                    </button>
                    <button
                      type="button"
                      className="delete-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(application);
                      }}
                    >
                      <Icon name="trash" size={17} /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            {pagination.pages > 1 && (
              <div className="pagination">
                <Button
                  variant="outlined"
                  size="small"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {formOpen && (
        <ApplicationForm
          open={formOpen}
          editing={editing}
          saving={saving}
          error={formError}
          onClose={closeForm}
          onSave={saveApplication}
        />
      )}

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={deleting ? undefined : () => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "delete-dialog" }}
      >
        <DialogTitle>Delete application?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently remove{" "}
            <strong>{deleteTarget?.company} — {deleteTarget?.jobTitle}</strong>{" "}
            from your tracker. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            color="inherit"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Keep application
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDelete}
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={16} color="inherit" /> : null
            }
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

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
