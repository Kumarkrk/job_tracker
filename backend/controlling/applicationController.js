const mongoose = require("mongoose");
const Application = require("../database/application");
const {
  APPLICATION_STATUSES,
  STATUS_LABELS,
} = require("../utils/constants");

const editableFields = [
  "company",
  "jobTitle",
  "jobUrl",
  "location",
  "workType",
  "employmentType",
  "salaryMin",
  "salaryMax",
  "jobDescription",
  "status",
  "priority",
  "source",
  "appliedDate",
  "deadline",
  "recruiterName",
  "recruiterEmail",
  "recruiterPhone",
  "resumeUsed",
  "coverLetter",
  "tags",
  "followUpDate",
];

function pickEditableFields(body = {}) {
  const input = body || {};
  return editableFields.reduce((result, field) => {
    if (input[field] !== undefined) {
      result[field] = input[field];
    }
    return result;
  }, {});
}

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function buildTimelineEvent(event, description) {
  return { event, description, createdAt: new Date() };
}

const create = async (req, res) => {
  const updates = pickEditableFields(req.body);

  if (!updates.company || !updates.company.trim()) {
    return res.status(400).json({ message: "Company name is required" });
  }
  if (!updates.jobTitle || !updates.jobTitle.trim()) {
    return res.status(400).json({ message: "Job title is required" });
  }

  const timeline = [
    buildTimelineEvent("created", "Application created"),
  ];

  if (updates.status && updates.status !== "saved") {
    timeline.push(
      buildTimelineEvent(
        "status_changed",
        `Status set to ${STATUS_LABELS[updates.status] || updates.status}`,
      ),
    );
  }

  const application = await Application.create({
    ...updates,
    user: req.user.sub,
    timeline,
  });

  return res.status(201).json({
    message: "Application added successfully",
    application,
  });
};

const get = async (req, res) => {
  const {
    search = "",
    status = "all",
    company = "all",
    workType = "all",
    employmentType = "all",
    location = "all",
    source = "all",
    priority = "all",
    sortBy = "newest",
    page = "1",
    limit = "20",
  } = req.query;

  const query = { user: req.user.sub };

  if (status !== "all") {
    if (!APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status filter" });
    }
    query.status = status;
  }

  if (company !== "all") {
    query.company = { $regex: company, $options: "i" };
  }

  if (workType !== "all") {
    query.workType = workType;
  }

  if (employmentType !== "all") {
    query.employmentType = employmentType;
  }

  if (location !== "all") {
    query.location = { $regex: location, $options: "i" };
  }

  if (source !== "all") {
    query.source = source;
  }

  if (priority !== "all") {
    query.priority = priority;
  }

  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: "i" };
    query.$or = [
      { jobTitle: searchRegex },
      { company: searchRegex },
      { location: searchRegex },
      { tags: searchRegex },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    company: { company: 1 },
    appliedDate: { appliedDate: -1 },
    deadline: { deadline: 1 },
    priority: { priority: 1 },
  };

  const sort = sortMap[sortBy] || sortMap.newest;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [applications, total] = await Promise.all([
    Application.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    Application.countDocuments(query),
  ]);

  return res.status(200).json({
    message: "Applications fetched successfully",
    applications,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
};

const getById = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(404).json({ message: "Application not found" });
  }

  const application = await Application.findOne({
    _id: id,
    user: req.user.sub,
  });

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  return res.status(200).json({
    message: "Application fetched successfully",
    application,
  });
};

const update = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(404).json({ message: "Application not found" });
  }

  const updates = pickEditableFields(req.body);

  if (updates.company !== undefined && !updates.company.trim()) {
    return res.status(400).json({ message: "Company name cannot be empty" });
  }
  if (updates.jobTitle !== undefined && !updates.jobTitle.trim()) {
    return res.status(400).json({ message: "Job title cannot be empty" });
  }

  const existing = await Application.findOne({ _id: id, user: req.user.sub });

  if (!existing) {
    return res.status(404).json({ message: "Application not found" });
  }

  const timelineUpdates = [];

  if (updates.status && updates.status !== existing.status) {
    timelineUpdates.push(
      buildTimelineEvent(
        "status_changed",
        `Status changed from ${STATUS_LABELS[existing.status] || existing.status} to ${STATUS_LABELS[updates.status] || updates.status}`,
      ),
    );
  }

  if (updates.followUpDate && updates.followUpDate !== existing.followUpDate) {
    timelineUpdates.push(
      buildTimelineEvent("follow_up_added", "Follow-up date updated"),
    );
  }

  const application = await Application.findOneAndUpdate(
    { _id: id, user: req.user.sub },
    {
      $set: updates,
      $push: { timeline: { $each: timelineUpdates } },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  return res.status(200).json({
    message: "Application updated successfully",
    application,
  });
};

const changeStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!isValidId(id)) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (!status || !APPLICATION_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  const existing = await Application.findOne({ _id: id, user: req.user.sub });

  if (!existing) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (existing.status === status) {
    return res.status(200).json({
      message: "Status unchanged",
      application: existing,
    });
  }

  const timelineEvent = buildTimelineEvent(
    "status_changed",
    `Status changed from ${STATUS_LABELS[existing.status] || existing.status} to ${STATUS_LABELS[status] || status}`,
  );

  const application = await Application.findOneAndUpdate(
    { _id: id, user: req.user.sub },
    {
      $set: { status },
      $push: { timeline: timelineEvent },
    },
    { returnDocument: "after", runValidators: true },
  );

  return res.status(200).json({
    message: "Status updated successfully",
    application,
  });
};

const remove = async (req, res) => {
  const { id } = req.params;

  if (!isValidId(id)) {
    return res.status(404).json({ message: "Application not found" });
  }

  const application = await Application.findOneAndDelete({
    _id: id,
    user: req.user.sub,
  });

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  return res.status(200).json({ message: "Application deleted successfully" });
};

const getStatistics = async (req, res) => {
  const userId = req.user.sub;

  const [
    statusStats,
    monthlyStats,
    sourceStats,
    workTypeStats,
    priorityStats,
    totalCount,
    upcomingInterviews,
    upcomingFollowUps,
  ] = await Promise.all([
    Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
    Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$source", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$workType", count: { $sum: 1 } } },
    ]),
    Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]),
    Application.countDocuments({ user: userId }),
    Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      { $unwind: "$interviews" },
      {
        $match: {
          "interviews.date": { $gte: new Date() },
          "interviews.status": "scheduled",
        },
      },
      { $sort: { "interviews.date": 1 } },
      { $limit: 5 },
    ]),
    Application.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $match: {
          followUpDate: { $gte: new Date() },
          status: { $nin: ["rejected", "withdrawn", "accepted"] },
        },
      },
      { $sort: { followUpDate: 1 } },
      { $limit: 5 },
    ]),
  ]);

  const statusCounts = {};
  APPLICATION_STATUSES.forEach((s) => {
    statusCounts[s] = 0;
  });
  statusStats.forEach((item) => {
    statusCounts[item._id] = item.count;
  });

  const monthlyData = monthlyStats.map((item) => ({
    month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
    count: item.count,
  }));

  const sourceCounts = {};
  sourceStats.forEach((item) => {
    sourceCounts[item._id] = item.count;
  });

  const workTypeCounts = {};
  workTypeStats.forEach((item) => {
    workTypeCounts[item._id] = item.count;
  });

  const priorityCounts = {};
  priorityStats.forEach((item) => {
    priorityCounts[item._id] = item.count;
  });

  const activeCount = ["applied", "screening", "interview", "technical", "final", "offer"].reduce(
    (sum, s) => sum + (statusCounts[s] || 0),
    0,
  );
  const rejectedCount = statusCounts.rejected || 0;
  const offerCount = (statusCounts.offer || 0) + (statusCounts.accepted || 0);
  const interviewCount =
    (statusCounts.interview || 0) +
    (statusCounts.technical || 0) +
    (statusCounts.final || 0);

  const interviewRate = activeCount > 0 ? ((interviewCount / activeCount) * 100).toFixed(1) : 0;
  const offerRate = activeCount > 0 ? ((offerCount / activeCount) * 100).toFixed(1) : 0;
  const rejectionRate = totalCount > 0 ? ((rejectedCount / totalCount) * 100).toFixed(1) : 0;

  return res.status(200).json({
    message: "Statistics fetched successfully",
    statistics: {
      total: totalCount,
      byStatus: statusCounts,
      byMonth: monthlyData,
      bySource: sourceCounts,
      byWorkType: workTypeCounts,
      byPriority: priorityCounts,
      conversionRates: {
        interviewRate: Number(interviewRate),
        offerRate: Number(offerRate),
        rejectionRate: Number(rejectionRate),
      },
      upcomingInterviews,
      upcomingFollowUps,
    },
  });
};

const addNote = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!isValidId(id)) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ message: "Note text is required" });
  }

  const application = await Application.findOneAndUpdate(
    { _id: id, user: req.user.sub },
    {
      $push: {
        notes: { text: text.trim() },
        timeline: buildTimelineEvent("notes_updated", "Note added"),
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  return res.status(200).json({
    message: "Note added successfully",
    application,
  });
};

const deleteNote = async (req, res) => {
  const { id, noteId } = req.params;

  if (!isValidId(id) || !isValidId(noteId)) {
    return res.status(404).json({ message: "Application or note not found" });
  }

  const application = await Application.findOneAndUpdate(
    { _id: id, user: req.user.sub },
    {
      $pull: { notes: { _id: noteId } },
      $push: {
        timeline: buildTimelineEvent("notes_updated", "Note deleted"),
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  return res.status(200).json({
    message: "Note deleted successfully",
    application,
  });
};

const addInterview = async (req, res) => {
  const { id } = req.params;
  const { type, date, interviewer, meetingLink, prepNotes } = req.body;

  if (!isValidId(id)) {
    return res.status(404).json({ message: "Application not found" });
  }

  if (!date) {
    return res.status(400).json({ message: "Interview date is required" });
  }

  const interview = {
    type: type || "video",
    date: new Date(date),
    interviewer: interviewer || "",
    meetingLink: meetingLink || "",
    prepNotes: prepNotes || "",
    status: "scheduled",
    result: "pending",
  };

  const application = await Application.findOneAndUpdate(
    { _id: id, user: req.user.sub },
    {
      $push: {
        interviews: interview,
        timeline: buildTimelineEvent(
          "interview_scheduled",
          `${type || "video"} interview scheduled for ${new Date(date).toLocaleDateString()}`,
        ),
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  return res.status(200).json({
    message: "Interview added successfully",
    application,
  });
};

const updateInterview = async (req, res) => {
  const { id, interviewId } = req.params;
  const updates = req.body;

  if (!isValidId(id) || !isValidId(interviewId)) {
    return res.status(404).json({ message: "Application or interview not found" });
  }

  const setFields = {};
  const allowedFields = ["type", "date", "interviewer", "meetingLink", "prepNotes", "result", "status"];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) {
      setFields[`interviews.$.${field}`] = updates[field];
    }
  });

  const application = await Application.findOneAndUpdate(
    { _id: id, user: req.user.sub, "interviews._id": interviewId },
    {
      $set: setFields,
      $push: {
        timeline: buildTimelineEvent("interview_updated", "Interview updated"),
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!application) {
    return res.status(404).json({ message: "Application or interview not found" });
  }

  return res.status(200).json({
    message: "Interview updated successfully",
    application,
  });
};

const deleteInterview = async (req, res) => {
  const { id, interviewId } = req.params;

  if (!isValidId(id) || !isValidId(interviewId)) {
    return res.status(404).json({ message: "Application or interview not found" });
  }

  const application = await Application.findOneAndUpdate(
    { _id: id, user: req.user.sub },
    {
      $pull: { interviews: { _id: interviewId } },
      $push: {
        timeline: buildTimelineEvent("interview_updated", "Interview removed"),
      },
    },
    { returnDocument: "after", runValidators: true },
  );

  if (!application) {
    return res.status(404).json({ message: "Application not found" });
  }

  return res.status(200).json({
    message: "Interview deleted successfully",
    application,
  });
};

module.exports = {
  create,
  get,
  getById,
  update,
  changeStatus,
  remove,
  getStatistics,
  addNote,
  deleteNote,
  addInterview,
  updateInterview,
  deleteInterview,
};
