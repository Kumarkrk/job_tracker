import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
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

const STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "technical", label: "Technical Interview" },
  { value: "final", label: "Final Interview" },
  { value: "offer", label: "Offer" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const INTERVIEW_TYPE_OPTIONS = [
  { value: "phone", label: "Phone Screen" },
  { value: "video", label: "Video Call" },
  { value: "onsite", label: "On-site" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "final", label: "Final Round" },
  { value: "hr", label: "HR" },
];

const INTERVIEW_RESULT_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "pass", label: "Pass" },
  { value: "fail", label: "Fail" },
  { value: "no-show", label: "No Show" },
];

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
    back: <path d="M19 12H5M12 19l-7-7 7-7" />,
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
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    note: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    close: <path d="m6 6 12 12M18 6 6 18" />,
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

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [interviewForm, setInterviewForm] = useState({
    type: "video",
    date: "",
    interviewer: "",
    meetingLink: "",
    prepNotes: "",
  });
  const [interviewSaving, setInterviewSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const loadApplication = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await api.get(`/application/${id}`);
      setApplication(data.application);
    } catch (error) {
      setLoadError(getErrorMessage(error, "Failed to load application."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  const handleStatusChange = async () => {
    if (!newStatus) return;

    setStatusSaving(true);

    try {
      const { data } = await api.patch(`/application/${id}/status`, {
        status: newStatus,
      });
      setApplication(data.application);
      setStatusDialogOpen(false);
      setToast({ message: "Status updated successfully.", severity: "success" });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Failed to update status."),
        severity: "error",
      });
    } finally {
      setStatusSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setNoteSaving(true);

    try {
      const { data } = await api.post(`/application/${id}/notes`, {
        text: noteText.trim(),
      });
      setApplication(data.application);
      setNoteDialogOpen(false);
      setNoteText("");
      setToast({ message: "Note added successfully.", severity: "success" });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Failed to add note."),
        severity: "error",
      });
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const { data } = await api.delete(`/application/${id}/notes/${noteId}`);
      setApplication(data.application);
      setToast({ message: "Note deleted.", severity: "success" });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Failed to delete note."),
        severity: "error",
      });
    }
  };

  const handleAddInterview = async () => {
    if (!interviewForm.date) {
      setToast({ message: "Interview date is required.", severity: "error" });
      return;
    }

    setInterviewSaving(true);

    try {
      const { data } = await api.post(`/application/${id}/interviews`, {
        ...interviewForm,
        date: new Date(interviewForm.date).toISOString(),
      });
      setApplication(data.application);
      setInterviewDialogOpen(false);
      setInterviewForm({
        type: "video",
        date: "",
        interviewer: "",
        meetingLink: "",
        prepNotes: "",
      });
      setToast({ message: "Interview added successfully.", severity: "success" });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Failed to add interview."),
        severity: "error",
      });
    } finally {
      setInterviewSaving(false);
    }
  };

  const handleDeleteInterview = async (interviewId) => {
    try {
      const { data } = await api.delete(
        `/application/${id}/interviews/${interviewId}`,
      );
      setApplication(data.application);
      setToast({ message: "Interview deleted.", severity: "success" });
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Failed to delete interview."),
        severity: "error",
      });
    }
  };

  const handleDeleteApplication = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.delete(`/application/${deleteTarget._id}`);
      setToast({ message: "Application deleted.", severity: "success" });
      navigate("/dashboard/applications");
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Failed to delete application."),
        severity: "error",
      });
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="details-page">
        <div className="details-loading">
          <CircularProgress size={40} />
          <p>Loading application details...</p>
        </div>
      </div>
    );
  }

  if (loadError || !application) {
    return (
      <div className="details-page">
        <Alert severity="error" className="dashboard-alert">
          {loadError || "Application not found."}
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/dashboard/applications")}>
          Back to Applications
        </Button>
      </div>
    );
  }

  const timeline = [...(application.timeline || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const interviews = [...(application.interviews || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
  );

  const notes = [...(application.notes || [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  return (
    <div className="details-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <Icon name="back" size={18} />
        Back
      </button>

      <div className="details-header">
        <div className="details-header-main">
          <div className="details-company-avatar">{getInitials(application.company)}</div>
          <div>
            <Typography component="h1" className="details-title">
              {application.jobTitle}
            </Typography>
            <Typography className="details-subtitle">
              {application.company}
              {application.location && ` · ${application.location}`}
            </Typography>
          </div>
        </div>
        <div className="details-header-actions">
          <StatusBadge status={application.status} />
          <Button
            variant="outlined"
            size="small"
            startIcon={<Icon name="edit" size={16} />}
            onClick={() => navigate(`/dashboard/applications?edit=${application._id}`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<Icon name="trash" size={16} />}
            onClick={() => setDeleteTarget(application)}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="details-grid">
        <div className="details-main">
          <section className="details-section">
            <div className="details-section-header">
              <Typography component="h2" className="details-section-title">
                Overview
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setNewStatus(application.status);
                  setStatusDialogOpen(true);
                }}
              >
                Change Status
              </Button>
            </div>
            <div className="details-info-grid">
              <div className="info-item">
                <span className="info-label">Status</span>
                <StatusBadge status={application.status} />
              </div>
              <div className="info-item">
                <span className="info-label">Priority</span>
                <span className={`priority-badge priority-${application.priority}`}>
                  {application.priority}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Work Type</span>
                <span>{application.workType || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Employment Type</span>
                <span>{application.employmentType || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Source</span>
                <span>{application.source || "—"}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Applied Date</span>
                <span>{formatDate(application.appliedDate || application.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Deadline</span>
                <span>{formatDate(application.deadline)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Follow-up Date</span>
                <span>{formatDate(application.followUpDate)}</span>
              </div>
              {application.salaryMin && (
                <div className="info-item">
                  <span className="info-label">Salary Range</span>
                  <span>
                    {application.salaryMin} – {application.salaryMax || "?"} LPA
                  </span>
                </div>
              )}
            </div>
          </section>

          {application.jobDescription && (
            <section className="details-section">
              <Typography component="h2" className="details-section-title">
                Job Description
              </Typography>
              <Typography className="details-text">
                {application.jobDescription}
              </Typography>
            </section>
          )}

          {application.jobUrl && (
            <section className="details-section">
              <Typography component="h2" className="details-section-title">
                Job Link
              </Typography>
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="details-link"
              >
                <Icon name="link" size={16} />
                View Job Posting
              </a>
            </section>
          )}

          <section className="details-section">
            <div className="details-section-header">
              <Typography component="h2" className="details-section-title">
                Interviews ({interviews.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Icon name="plus" size={16} />}
                onClick={() => setInterviewDialogOpen(true)}
              >
                Add Interview
              </Button>
            </div>
            {interviews.length === 0 ? (
              <p className="details-empty">No interviews scheduled yet.</p>
            ) : (
              <div className="interview-list">
                {interviews.map((interview) => (
                  <div key={interview._id} className="interview-card">
                    <div className="interview-card-header">
                      <div>
                        <strong>{interview.type} Interview</strong>
                        <span>{formatDateTime(interview.date)}</span>
                      </div>
                      <div className="interview-card-actions">
                        <span className={`interview-status interview-status-${interview.status}`}>
                          {interview.status}
                        </span>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteInterview(interview._id)}
                          aria-label="Delete interview"
                        >
                          <Icon name="trash" size={16} />
                        </IconButton>
                      </div>
                    </div>
                    {interview.interviewer && (
                      <p className="interview-detail">
                        <strong>Interviewer:</strong> {interview.interviewer}
                      </p>
                    )}
                    {interview.meetingLink && (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="details-link"
                      >
                        <Icon name="link" size={14} />
                        Meeting Link
                      </a>
                    )}
                    {interview.prepNotes && (
                      <p className="interview-detail">
                        <strong>Prep Notes:</strong> {interview.prepNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="details-section">
            <div className="details-section-header">
              <Typography component="h2" className="details-section-title">
                Notes ({notes.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Icon name="plus" size={16} />}
                onClick={() => setNoteDialogOpen(true)}
              >
                Add Note
              </Button>
            </div>
            {notes.length === 0 ? (
              <p className="details-empty">No notes yet.</p>
            ) : (
              <div className="notes-list">
                {notes.map((note) => (
                  <div key={note._id} className="note-card">
                    <div className="note-card-content">
                      <p>{note.text}</p>
                      <small>{formatDate(note.createdAt)}</small>
                    </div>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteNote(note._id)}
                      aria-label="Delete note"
                    >
                      <Icon name="trash" size={14} />
                    </IconButton>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="details-sidebar">
          <section className="details-section">
            <Typography component="h2" className="details-section-title">
              Recruiter Info
            </Typography>
            <div className="recruiter-info">
              {application.recruiterName && (
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span>{application.recruiterName}</span>
                </div>
              )}
              {application.recruiterEmail && (
                <div className="info-item">
                  <span className="info-label">Email</span>
                  <a
                    href={`mailto:${application.recruiterEmail}`}
                    className="details-link"
                  >
                    <Icon name="mail" size={14} />
                    {application.recruiterEmail}
                  </a>
                </div>
              )}
              {application.recruiterPhone && (
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <a
                    href={`tel:${application.recruiterPhone}`}
                    className="details-link"
                  >
                    <Icon name="phone" size={14} />
                    {application.recruiterPhone}
                  </a>
                </div>
              )}
              {!application.recruiterName &&
                !application.recruiterEmail &&
                !application.recruiterPhone && (
                  <p className="details-empty">No recruiter information.</p>
                )}
            </div>
          </section>

          <section className="details-section">
            <Typography component="h2" className="details-section-title">
              Documents
            </Typography>
            <div className="documents-info">
              {application.resumeUsed && (
                <div className="info-item">
                  <span className="info-label">Resume</span>
                  <span>{application.resumeUsed}</span>
                </div>
              )}
              {application.coverLetter && (
                <div className="info-item">
                  <span className="info-label">Cover Letter</span>
                  <span>{application.coverLetter}</span>
                </div>
              )}
              {!application.resumeUsed && !application.coverLetter && (
                <p className="details-empty">No documents linked.</p>
              )}
            </div>
          </section>

          {application.tags && application.tags.length > 0 && (
            <section className="details-section">
              <Typography component="h2" className="details-section-title">
                Tags
              </Typography>
              <div className="tags-list">
                {application.tags.map((tag) => (
                  <span key={tag} className="tag-badge">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="details-section">
            <Typography component="h2" className="details-section-title">
              Timeline
            </Typography>
            <div className="timeline-list">
              {timeline.map((event, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot" />
                  <div className="timeline-content">
                    <p>{event.description}</p>
                    <small>{formatDateTime(event.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Status Change Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Change Status</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              fullWidth
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)} disabled={statusSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleStatusChange}
            disabled={statusSaving}
            startIcon={statusSaving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {statusSaving ? "Updating..." : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Add a note about this application..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)} disabled={noteSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddNote}
            disabled={noteSaving || !noteText.trim()}
            startIcon={noteSaving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {noteSaving ? "Adding..." : "Add Note"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Interview Dialog */}
      <Dialog
        open={interviewDialogOpen}
        onClose={() => setInterviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Interview</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Interview Type"
              value={interviewForm.type}
              onChange={(e) =>
                setInterviewForm((f) => ({ ...f, type: e.target.value }))
              }
              fullWidth
            >
              {INTERVIEW_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date & Time"
              type="datetime-local"
              value={interviewForm.date}
              onChange={(e) =>
                setInterviewForm((f) => ({ ...f, date: e.target.value }))
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Interviewer Name"
              value={interviewForm.interviewer}
              onChange={(e) =>
                setInterviewForm((f) => ({ ...f, interviewer: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Meeting Link"
              value={interviewForm.meetingLink}
              onChange={(e) =>
                setInterviewForm((f) => ({ ...f, meetingLink: e.target.value }))
              }
              fullWidth
              placeholder="https://..."
            />
            <TextField
              label="Preparation Notes"
              value={interviewForm.prepNotes}
              onChange={(e) =>
                setInterviewForm((f) => ({ ...f, prepNotes: e.target.value }))
              }
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewDialogOpen(false)} disabled={interviewSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAddInterview}
            disabled={interviewSaving}
            startIcon={interviewSaving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {interviewSaving ? "Adding..." : "Add Interview"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
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
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteApplication}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
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
