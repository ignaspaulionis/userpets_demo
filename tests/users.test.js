const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

const registerPayload = {
  email: 'owner@example.com',
  password: 'Pass1234!',
  fullname: 'Owner User',
};

describe('Users API', () => {
  describe('POST /users/register', () => {
    it('registers user with valid payload', async () => {
      const res = await request(app).post('/users/register').send(registerPayload);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('fails when registering duplicate email', async () => {
      await request(app).post('/users/register').send(registerPayload);
      const res = await request(app).post('/users/register').send(registerPayload);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /users/login', () => {
    it('logs in existing user and returns token', async () => {
      await request(app).post('/users/register').send(registerPayload);
      const res = await request(app).post('/users/login').send({
        email: registerPayload.email,
        password: registerPayload.password,
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('fails with invalid credentials', async () => {
      await request(app).post('/users/register').send(registerPayload);
      const res = await request(app).post('/users/login').send({
        email: registerPayload.email,
        password: 'wrong-password',
      });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('protected /users routes', () => {
    it('returns 401 for GET /users without token', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('allows owner to update their own profile', async () => {
      await request(app).post('/users/register').send(registerPayload);
      const loginRes = await request(app).post('/users/login').send({
        email: registerPayload.email,
        password: registerPayload.password,
      });

      const owner = await User.findOne({ where: { email: registerPayload.email } });

      const updateRes = await request(app)
        .put(`/users/${owner.id}`)
        .set('Authorization', `Bearer ${loginRes.body.token}`)
        .send({ email: 'owner.updated@example.com', fullname: 'Updated Owner' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body).toHaveProperty('user');
      expect(updateRes.body.user.email).toBe('owner.updated@example.com');
    });

    it('returns 403 when user updates another user profile', async () => {
      const userA = { email: 'a@example.com', password: 'Pass1234!', fullname: 'A User' };
      const userB = { email: 'b@example.com', password: 'Pass1234!', fullname: 'B User' };

      await request(app).post('/users/register').send(userA);
      await request(app).post('/users/register').send(userB);

      const loginA = await request(app).post('/users/login').send({
        email: userA.email,
        password: userA.password,
      });

      const b = await User.findOne({ where: { email: userB.email } });

      const res = await request(app)
        .put(`/users/${b.id}`)
        .set('Authorization', `Bearer ${loginA.body.token}`)
        .send({ email: 'hijack@example.com', fullname: 'Hijack' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });
  });
});
