const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const app = require("../server");
const User = require("../database/user");

const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = "testpass123";

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);
});

afterAll(async () => {
  await User.deleteMany({ email: TEST_EMAIL });
  await mongoose.disconnect();
});

describe("Authentication", () => {
  test("should register a new user", async () => {
    const res = await request(app)
      .post("/user/register")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  test("should reject registration with invalid email", async () => {
    const res = await request(app)
      .post("/user/register")
      .send({ email: "invalid-email", password: TEST_PASSWORD });

    expect(res.status).toBe(400);
  });

  test("should reject registration with short password", async () => {
    const res = await request(app)
      .post("/user/register")
      .send({ email: `test2_${Date.now()}@example.com`, password: "123" });

    expect(res.status).toBe(400);
  });

  test("should reject duplicate registration", async () => {
    const res = await request(app)
      .post("/user/register")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(409);
  });

  test("should login with valid credentials", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  test("should reject login with wrong password", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ email: TEST_EMAIL, password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  test("should reject login with non-existent email", async () => {
    const res = await request(app)
      .post("/user/login")
      .send({ email: "nonexistent@example.com", password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });

  test("should access /user/me with valid token", async () => {
    const loginRes = await request(app)
      .post("/user/login")
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    const token = loginRes.body.token;

    const res = await request(app)
      .get("/user/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  test("should reject /user/me without token", async () => {
    const res = await request(app).get("/user/me");

    expect(res.status).toBe(401);
  });

  test("should reject /user/me with invalid token", async () => {
    const res = await request(app)
      .get("/user/me")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.status).toBe(401);
  });
});
