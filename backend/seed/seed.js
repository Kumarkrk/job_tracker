require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../database/user");
const Application = require("../database/application");

const DEMO_EMAIL = "demo@jobtracker.com";
const DEMO_PASSWORD = "demo1234";

const companies = [
  { name: "Google", roles: ["Software Engineer", "Product Manager", "Data Analyst"] },
  { name: "Microsoft", roles: ["Full Stack Developer", "Cloud Engineer", "DevOps Engineer"] },
  { name: "Amazon", roles: ["SDE I", "SDE II", "Frontend Developer"] },
  { name: "Infosys", roles: ["Systems Engineer", "Senior Systems Engineer"] },
  { name: "TCS", roles: ["Assistant System Engineer", "System Engineer"] },
  { name: "Accenture", roles: ["Software Engineer Analyst", "Senior Analyst"] },
  { name: "Deloitte", roles: ["Business Analyst", "Technology Consultant"] },
  { name: "IBM", roles: ["Associate Developer", "Consultant"] },
  { name: "Wipro", roles: ["Project Engineer", "Senior Project Engineer"] },
  { name: "Flipkart", roles: ["Software Development Engineer", "Product Analyst"] },
  { name: "Zomato", roles: ["Backend Engineer", "Mobile Developer"] },
  { name: "Razorpay", roles: ["Full Stack Developer", "QA Engineer"] },
];

const locations = ["Bengaluru", "Hyderabad", "Pune", "Chennai", "Mumbai", "Noida", "Remote"];
const workTypes = ["remote", "hybrid", "onsite"];
const employmentTypes = ["full-time", "contract", "internship"];
const sources = ["linkedin", "indeed", "naukri", "company-website", "referral", "glassdoor"];
const priorities = ["low", "medium", "high", "urgent"];
const statuses = ["saved", "applied", "screening", "interview", "technical", "final", "offer", "accepted", "rejected", "withdrawn"];
const interviewTypes = ["phone", "video", "onsite", "technical", "behavioral", "final", "hr"];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function buildTimeline(status, createdAt) {
  const events = [{ event: "created", description: "Application created", createdAt }];

  const statusFlow = ["saved", "applied", "screening", "interview", "technical", "final", "offer", "accepted"];
  const statusIndex = statusFlow.indexOf(status);

  if (status === "rejected") {
    events.push({
      event: "status_changed",
      description: "Status changed from Applied to Rejected",
      createdAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
    events.push({
      event: "rejected",
      description: "Application rejected",
      createdAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
  } else if (status === "withdrawn") {
    events.push({
      event: "status_changed",
      description: "Status changed from Applied to Withdrawn",
      createdAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
    });
    events.push({
      event: "withdrawn",
      description: "Application withdrawn",
      createdAt: new Date(createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
    });
  } else if (statusIndex > 0) {
    for (let i = 1; i <= statusIndex; i++) {
      events.push({
        event: "status_changed",
        description: `Status changed to ${statusFlow[i]}`,
        createdAt: new Date(createdAt.getTime() + i * 3 * 24 * 60 * 60 * 1000),
      });
    }
  }

  return events;
}

function buildInterviews(status, createdAt) {
  const interviews = [];
  const statusFlow = ["saved", "applied", "screening", "interview", "technical", "final", "offer", "accepted"];
  const statusIndex = statusFlow.indexOf(status);

  if (statusIndex >= 3) {
    const interviewCount = Math.min(statusIndex - 2, 3);
    for (let i = 0; i < interviewCount; i++) {
      interviews.push({
        type: randomItem(interviewTypes),
        date: randomDate(createdAt, new Date()),
        interviewer: `Interviewer ${i + 1}`,
        meetingLink: "https://meet.example.com/interview",
        prepNotes: "Review system design concepts and practice coding problems.",
        result: i < interviewCount - 1 ? "pass" : "pending",
        status: i < interviewCount - 1 ? "completed" : "scheduled",
      });
    }
  }

  return interviews;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const existingUser = await User.findOne({ email: DEMO_EMAIL });
    if (existingUser) {
      console.log("Demo user already exists. Deleting old demo data...");
      await Application.deleteMany({ user: existingUser._id });
      await existingUser.deleteOne();
    }

    const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
    const user = await User.create({
      email: DEMO_EMAIL,
      password: hashedPassword,
    });

    console.log(`Created demo user: ${DEMO_EMAIL}`);

    const applications = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 30; i++) {
      const company = randomItem(companies);
      const role = randomItem(company.roles);
      const status = randomItem(statuses);
      const createdAt = randomDate(threeMonthsAgo, now);
      const appliedDate = status !== "saved" ? randomDate(createdAt, now) : null;

      const salaryMin = Math.floor(Math.random() * 20) + 5;
      const salaryMax = salaryMin + Math.floor(Math.random() * 15) + 5;

      applications.push({
        user: user._id,
        company: company.name,
        jobTitle: role,
        jobUrl: `https://careers.${company.name.toLowerCase().replace(/\s/g, "")}.com/jobs/${i}`,
        location: randomItem(locations),
        workType: randomItem(workTypes),
        employmentType: randomItem(employmentTypes),
        salaryMin,
        salaryMax,
        jobDescription: `We are looking for a ${role} to join our team at ${company.name}. You will work on exciting projects and collaborate with cross-functional teams.`,
        status,
        priority: randomItem(priorities),
        source: randomItem(sources),
        appliedDate,
        deadline: Math.random() > 0.5 ? randomDate(now, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) : null,
        recruiterName: Math.random() > 0.3 ? `Recruiter ${i + 1}` : "",
        recruiterEmail: Math.random() > 0.3 ? `recruiter${i + 1}@${company.name.toLowerCase().replace(/\s/g, "")}.com` : "",
        recruiterPhone: Math.random() > 0.5 ? `+91${Math.floor(Math.random() * 9000000000 + 1000000000)}` : "",
        resumeUsed: Math.random() > 0.3 ? `Resume_${role.replace(/\s/g, "_")}.pdf` : "",
        coverLetter: Math.random() > 0.5 ? `Cover letter for ${role} position` : "",
        tags: [company.name, role.split(" ")[0], randomItem(["urgent", "dream", "backup"])],
        followUpDate: Math.random() > 0.6 ? randomDate(now, new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)) : null,
        interviews: buildInterviews(status, createdAt),
        notes: Math.random() > 0.5 ? [{ text: "Initial screening call went well. Waiting for feedback.", createdAt: randomDate(createdAt, now) }] : [],
        timeline: buildTimeline(status, createdAt),
        createdAt,
        updatedAt: randomDate(createdAt, now),
      });
    }

    await Application.insertMany(applications);
    console.log(`Seeded ${applications.length} applications`);

    console.log("\nSeed complete!");
    console.log(`Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
