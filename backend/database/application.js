const mongoose = require("mongoose");
const {
  APPLICATION_STATUSES,
  WORK_TYPES,
  EMPLOYMENT_TYPES,
  PRIORITIES,
  INTERVIEW_TYPES,
  INTERVIEW_RESULTS,
  INTERVIEW_STATUSES,
  SOURCES,
} = require("../utils/constants");

const timelineEventSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        "created",
        "status_changed",
        "interview_scheduled",
        "interview_updated",
        "follow_up_added",
        "notes_updated",
        "offer_received",
        "rejected",
        "withdrawn",
        "application_updated",
      ],
    },
    description: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const interviewSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: INTERVIEW_TYPES,
      default: "video",
    },
    date: { type: Date, required: true },
    interviewer: { type: String, default: "" },
    meetingLink: { type: String, default: "" },
    prepNotes: { type: String, default: "" },
    result: {
      type: String,
      enum: INTERVIEW_RESULTS,
      default: "pending",
    },
    status: {
      type: String,
      enum: INTERVIEW_STATUSES,
      default: "scheduled",
    },
  },
  { timestamps: true },
);

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: 150,
    },
    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: 150,
    },
    jobUrl: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    workType: {
      type: String,
      enum: WORK_TYPES,
      default: "onsite",
    },
    employmentType: {
      type: String,
      enum: EMPLOYMENT_TYPES,
      default: "full-time",
    },
    salaryMin: { type: Number, min: 0, default: null },
    salaryMax: { type: Number, min: 0, default: null },
    jobDescription: { type: String, default: "" },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: "saved",
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "medium",
    },
    source: {
      type: String,
      enum: SOURCES,
      default: "other",
    },
    appliedDate: { type: Date, default: null },
    deadline: { type: Date, default: null },
    recruiterName: { type: String, trim: true, default: "" },
    recruiterEmail: { type: String, trim: true, default: "" },
    recruiterPhone: { type: String, trim: true, default: "" },
    resumeUsed: { type: String, trim: true, default: "" },
    coverLetter: { type: String, trim: true, default: "" },
    tags: [{ type: String, trim: true }],
    followUpDate: { type: Date, default: null },
    interviews: [interviewSchema],
    notes: [noteSchema],
    timeline: [timelineEventSchema],
  },
  { timestamps: true },
);

applicationSchema.index({ user: 1, createdAt: -1 });
applicationSchema.index({ user: 1, status: 1 });
applicationSchema.index({ user: 1, company: 1 });
applicationSchema.index({ user: 1, appliedDate: -1 });
applicationSchema.index({ user: 1, followUpDate: 1 });

module.exports =
  mongoose.models.Application || mongoose.model("Application", applicationSchema);
