import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import supertest from 'supertest';
import express from 'express';
import { signup, login } from '../controllers/authController';

let mongoServer: MongoMemoryServer;
const app = express();
app.use(express.json());
app.post('/api/auth/signup', signup);
app.post('/api/auth/login', login);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Authentication API Unit Tests', () => {
  const testUser = {
    username: 'test_dev',
    email: 'dev@google.com',
    password: 'super_secure_password',
  };

  it('should successfully register a new user with valid parameters', async () => {
    const res = await supertest(app)
      .post('/api/auth/signup')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should reject registration if the email is already in use', async () => {
    const res = await supertest(app)
      .post('/api/auth/signup')
      .send({
        username: 'another_user',
        email: testUser.email,
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Email address is already registered');
  });

  it('should reject registration if the password is too short', async () => {
    const res = await supertest(app)
      .post('/api/auth/signup')
      .send({
        username: 'short_pass_user',
        email: 'short@dev.com',
        password: '123',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Password must be at least 6 characters');
  });

  it('should authenticate user and return token on login with correct credentials', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe(testUser.username);
  });

  it('should reject authentication on login with invalid credentials', async () => {
    const res = await supertest(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'incorrect_password',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid email or password');
  });
});
