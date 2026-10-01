import { useState, useEffect } from "react";
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
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

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

const WORK_TYPE_OPTIONS = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const SOURCE_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "indeed", label: "Indeed" },
  { value: "naukri", label: "Naukri" },
  { value: "company-website", label: "Company Website" },
  { value: "referral", label: "Referral" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "angel-list", label: "AngelList" },
  { value: "other", label: "Other" },
];

const EMPTY_FORM = {
  company: "",
  jobTitle: "",
  jobUrl: "",
  location: "",
  workType: "onsite",
  employmentType: "full-time",
  salaryMin: "",
  salaryMax: "",
  jobDescription: "",
  status: "saved",
  priority: "medium",
  source: "other",
  appliedDate: "",
  deadline: "",
  recruiterName: "",
  recruiterEmail: "",
  recruiterPhone: "",
  resumeUsed: "",
  coverLetter: "",
  tags: "",
  followUpDate: "",
};

function applicationToForm(application) {
  if (!application) return EMPTY_FORM;

  return {
    company: application.company || "",
    jobTitle: application.jobTitle || "",
    jobUrl: application.jobUrl || "",
    location: application.location || "",
    workType: application.workType || "onsite",
    employmentType: application.employmentType || "full-time",
    salaryMin: application.salaryMin ?? "",
    salaryMax: application.salaryMax ?? "",
    jobDescription: application.jobDescription || "",
    status: application.status || "saved",
    priority: application.priority || "medium",
    source: application.source || "other",
    appliedDate: application.appliedDate
      ? new Date(application.appliedDate).toISOString().split("T")[0]
      : "",
    deadline: application.deadline
      ? new Date(application.deadline).toISOString().split("T")[0]
      : "",
    recruiterName: application.recruiterName || "",
    recruiterEmail: application.recruiterEmail || "",
    recruiterPhone: application.recruiterPhone || "",
    resumeUsed: application.resumeUsed || "",
    coverLetter: application.coverLetter || "",
    tags: (application.tags || []).join(", "),
    followUpDate: application.followUpDate
      ? new Date(application.followUpDate).toISOString().split("T")[0]
      : "",
  };
}

function Icon({ name, size = 20 }) {
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
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export default function ApplicationForm({
  open,
  editing,
  saving,
  error,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(() => applicationToForm(editing));

  useEffect(() => {
    setForm(applicationToForm(editing));
  }, [editing, open]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      salaryMin: form.salaryMin === "" ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax === "" ? null : Number(form.salaryMax),
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      appliedDate: form.appliedDate || null,
      deadline: form.deadline || null,
      followUpDate: form.followUpDate || null,
    };

    onSave(payload);
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ className: "application-dialog form-dialog" }}
    >
      <DialogTitle className="dialog-title-row">
        <Box>
          <span className="dialog-eyebrow">
            {editing ? "Update opportunity" : "New opportunity"}
          </span>
          <Typography component="h2" className="dialog-title">
            {editing ? "Edit application" : "Add an application"}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          disabled={saving}
          aria-label="Close application form"
        >
          <Icon name="close" />
        </IconButton>
      </DialogTitle>

      <DialogContent className="dialog-content">
        <Stack component="form" id="application-form" spacing={2.2} onSubmit={handleSubmit}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box className="form-row">
            <TextField
              id="company"
              label="Company name"
              placeholder="e.g. Google"
              value={form.company}
              onChange={updateField("company")}
              autoFocus
              required
              fullWidth
              inputProps={{ maxLength: 150 }}
            />
            <TextField
              id="job-title"
              label="Job title"
              placeholder="e.g. Software Engineer"
              value={form.jobTitle}
              onChange={updateField("jobTitle")}
              required
              fullWidth
              inputProps={{ maxLength: 150 }}
            />
          </Box>

          <TextField
            id="job-url"
            label="Job URL"
            placeholder="https://..."
            value={form.jobUrl}
            onChange={updateField("jobUrl")}
            fullWidth
            inputProps={{ type: "url" }}
          />

          <Box className="form-row">
            <TextField
              id="location"
              label="Location"
              placeholder="e.g. Bengaluru"
              value={form.location}
              onChange={updateField("location")}
              fullWidth
              inputProps={{ maxLength: 100 }}
            />
            <TextField
              select
              id="work-type"
              label="Work type"
              value={form.workType}
              onChange={updateField("workType")}
              fullWidth
            >
              {WORK_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box className="form-row">
            <TextField
              select
              id="employment-type"
              label="Employment type"
              value={form.employmentType}
              onChange={updateField("employmentType")}
              fullWidth
            >
              {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              id="status"
              label="Status"
              value={form.status}
              onChange={updateField("status")}
              fullWidth
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box className="form-row">
            <TextField
              id="salary-min"
              label="Salary min (LPA)"
              type="number"
              value={form.salaryMin}
              onChange={updateField("salaryMin")}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
            />
            <TextField
              id="salary-max"
              label="Salary max (LPA)"
              type="number"
              value={form.salaryMax}
              onChange={updateField("salaryMax")}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
            />
          </Box>

          <Box className="form-row">
            <TextField
              select
              id="priority"
              label="Priority"
              value={form.priority}
              onChange={updateField("priority")}
              fullWidth
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              id="source"
              label="Source"
              value={form.source}
              onChange={updateField("source")}
              fullWidth
            >
              {SOURCE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box className="form-row">
            <TextField
              id="applied-date"
              label="Applied date"
              type="date"
              value={form.appliedDate}
              onChange={updateField("appliedDate")}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              id="deadline"
              label="Application deadline"
              type="date"
              value={form.deadline}
              onChange={updateField("deadline")}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <TextField
            id="job-description"
            label="Job description"
            placeholder="Paste the job description or key requirements..."
            value={form.jobDescription}
            onChange={updateField("jobDescription")}
            fullWidth
            multiline
            rows={3}
          />

          <Box className="form-row">
            <TextField
              id="recruiter-name"
              label="Recruiter name"
              value={form.recruiterName}
              onChange={updateField("recruiterName")}
              fullWidth
            />
            <TextField
              id="recruiter-email"
              label="Recruiter email"
              type="email"
              value={form.recruiterEmail}
              onChange={updateField("recruiterEmail")}
              fullWidth
            />
          </Box>

          <Box className="form-row">
            <TextField
              id="recruiter-phone"
              label="Recruiter phone"
              value={form.recruiterPhone}
              onChange={updateField("recruiterPhone")}
              fullWidth
            />
            <TextField
              id="follow-up-date"
              label="Follow-up date"
              type="date"
              value={form.followUpDate}
              onChange={updateField("followUpDate")}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box className="form-row">
            <TextField
              id="resume-used"
              label="Resume used"
              placeholder="e.g. Resume_v2.pdf"
              value={form.resumeUsed}
              onChange={updateField("resumeUsed")}
              fullWidth
            />
            <TextField
              id="cover-letter"
              label="Cover letter"
              placeholder="e.g. CoverLetter_Google.pdf"
              value={form.coverLetter}
              onChange={updateField("coverLetter")}
              fullWidth
            />
          </Box>

          <TextField
            id="tags"
            label="Tags (comma separated)"
            placeholder="e.g. dream, urgent, referral"
            value={form.tags}
            onChange={updateField("tags")}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <Button onClick={onClose} disabled={saving} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          form="application-form"
          variant="contained"
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={17} color="inherit" /> : null
          }
        >
          {saving ? "Saving..." : editing ? "Save changes" : "Add application"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
