const APPLICATION_STATUSES = [
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

const STATUS_LABELS = {
  saved: "Saved",
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  technical: "Technical Interview",
  final: "Final Interview",
  offer: "Offer",
  accepted: "Accepted",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const WORK_TYPES = ["remote", "hybrid", "onsite"];

const EMPLOYMENT_TYPES = [
  "full-time",
  "part-time",
  "contract",
  "internship",
  "freelance",
];

const PRIORITIES = ["low", "medium", "high", "urgent"];

const INTERVIEW_TYPES = [
  "phone",
  "video",
  "onsite",
  "technical",
  "behavioral",
  "final",
  "hr",
];

const INTERVIEW_RESULTS = ["pending", "pass", "fail", "no-show"];

const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "no-show"];

const SOURCES = [
  "linkedin",
  "indeed",
  "naukri",
  "company-website",
  "referral",
  "glassdoor",
  "angel-list",
  "other",
];

module.exports = {
  APPLICATION_STATUSES,
  STATUS_LABELS,
  WORK_TYPES,
  EMPLOYMENT_TYPES,
  PRIORITIES,
  INTERVIEW_TYPES,
  INTERVIEW_RESULTS,
  INTERVIEW_STATUSES,
  SOURCES,
};
