const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const app = require("../server");
const User = require("../database/user");
const Application = require("../database/application");

const TEST_EMAIL = `apptest_${Date.now()}@example.com`;
const TEST_PASSWORD = "testpass123";
let authToken;
let userId;
let applicationId;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
  const user = await User.create({ email: TEST_EMAIL, password: hashedPassword });
  userId = user._id.toString();

  const loginRes = await request(app)
    .post("/user/login")
    .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

  authToken = loginRes.body.token;
});

afterAll(async () => {
  await Application.deleteMany({ user: userId });
  await User.deleteMany({ email: TEST_EMAIL });
  await mongoose.disconnect();
});

describe("Application CRUD", () => {
  test("should create a new application", async () => {
    const res = await request(app)
      .post("/application")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        company: "Test Company",
        jobTitle: "Software Engineer",
        location: "Bengaluru",
        status: "applied",
        salaryMin: 10,
        salaryMax: 20,
      });

    expect(res.status).toBe(201);
    expect(res.body.application.company).toBe("Test Company");
    expect(res.body.application.jobTitle).toBe("Software Engineer");
    applicationId = res.body.application._id;
  });

  test("should reject creation without company", async () => {
    const res = await request(app)
      .post("/application")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        jobTitle: "Software Engineer",
        location: "Bengaluru",
      });

    expect(res.status).toBe(400);
  });

  test("should reject creation without job title", async () => {
    const res = await request(app)
      .post("/application")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        company: "Test Company",
        location: "Bengaluru",
      });

    expect(res.status).toBe(400);
  });

  test("should reject creation without auth token", async () => {
    const res = await request(app)
      .post("/application")
      .send({
        company: "Test Company",
        jobTitle: "Software Engineer",
      });

    expect(res.status).toBe(401);
  });

  test("should get all applications for user", async () => {
    const res = await request(app)
      .get("/application")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.applications).toBeDefined();
    expect(res.body.applications.length).toBeGreaterThan(0);
    expect(res.body.pagination).toBeDefined();
  });

  test("should get application by id", async () => {
    const res = await request(app)
      .get(`/application/${applicationId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.application._id).toBe(applicationId);
  });

  test("should return 404 for non-existent application", async () => {
    const res = await request(app)
      .get("/application/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });

  test("should update an application", async () => {
    const res = await request(app)
      .patch(`/application/${applicationId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        status: "interview",
        priority: "high",
      });

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe("interview");
    expect(res.body.application.priority).toBe("high");
  });

  test("should change application status", async () => {
    const res = await request(app)
      .patch(`/application/${applicationId}/status`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ status: "offer" });

    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe("offer");
  });

  test("should reject invalid status value", async () => {
    const res = await request(app)
      .patch(`/application/${applicationId}/status`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ status: "invalid_status" });

    expect(res.status).toBe(400);
  });

  test("should add a note to an application", async () => {
    const res = await request(app)
      .post(`/application/${applicationId}/notes`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ text: "Interview scheduled for next week" });

    expect(res.status).toBe(200);
    expect(res.body.application.notes.length).toBeGreaterThan(0);
  });

  test("should add an interview to an application", async () => {
    const res = await request(app)
      .post(`/application/${applicationId}/interviews`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        type: "technical",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        interviewer: "John Doe",
        meetingLink: "https://meet.example.com/interview",
      });

    expect(res.status).toBe(200);
    expect(res.body.application.interviews.length).toBeGreaterThan(0);
  });

  test("should get statistics", async () => {
    const res = await request(app)
      .get("/application/statistics")
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.statistics).toBeDefined();
    expect(res.body.statistics.total).toBeGreaterThan(0);
    expect(res.body.statistics.byStatus).toBeDefined();
  });

  test("should delete an application", async () => {
    const res = await request(app)
      .delete(`/application/${applicationId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(200);
  });

  test("should return 404 when deleting non-existent application", async () => {
    const res = await request(app)
      .delete(`/application/${applicationId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(res.status).toBe(404);
  });
});

describe("User isolation", () => {
  test("should not access another user's application", async () => {
    const otherEmail = `other_${Date.now()}@example.com`;
    const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    const otherUser = await User.create({ email: otherEmail, password: hashedPassword });

    const createRes = await request(app)
      .post("/application")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        company: "Isolation Test",
        jobTitle: "Test Role",
        location: "Test City",
      });

    const appId = createRes.body.application._id;

    const otherLogin = await request(app)
      .post("/user/login")
      .send({ email: otherEmail, password: TEST_PASSWORD });

    const res = await request(app)
      .get(`/application/${appId}`)
      .set("Authorization", `Bearer ${otherLogin.body.token}`);

    expect(res.status).toBe(404);

    await Application.deleteOne({ _id: appId });
    await User.deleteOne({ email: otherEmail });
  });
});
