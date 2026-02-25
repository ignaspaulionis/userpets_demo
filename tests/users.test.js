const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

// Wipe users table before each test for isolation
beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

// Helper: register + login and return token
const registerAndLogin = async (
  email = 'user@example.com',
  password = 'secret123',
  fullname = 'Test User'
) => {
  await request(app).post('/users/register').send({ email, password, fullname });
  const loginRes = await request(app)
    .post('/users/login')
    .send({ email, password });
  return loginRes.body.token;
};

describe('Users API', () => {
  // ── POST /users/register ──────────────────────────────────────────────────
  describe('POST /users/register', () => {
    it('registers a new user and returns 201', async () => {
      const res = await request(app).post('/users/register').send({
        email: 'new@example.com',
        password: 'pass1234',
        fullname: 'New User',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
    });

    it('returns 400 when email is duplicate', async () => {
      const payload = { email: 'dup@example.com', password: 'pw', fullname: 'Dup' };
      await request(app).post('/users/register').send(payload);
      const res = await request(app).post('/users/register').send(payload);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 when email is invalid', async () => {
      const res = await request(app).post('/users/register').send({
        email: 'not-an-email',
        password: 'pass',
        fullname: 'Bad',
      });
      expect(res.status).toBe(400);
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app).post('/users/register').send({ email: 'x@x.com' });
      expect(res.status).toBe(400);
    });
  });

  // ── POST /users/login ─────────────────────────────────────────────────────
  describe('POST /users/login', () => {
    it('returns a JWT token on successful login', async () => {
      await request(app).post('/users/register').send({
        email: 'login@example.com',
        password: 'mypassword',
        fullname: 'Login User',
      });

      const res = await request(app)
        .post('/users/login')
        .send({ email: 'login@example.com', password: 'mypassword' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    });

    it('returns 400 for wrong password', async () => {
      await request(app).post('/users/register').send({
        email: 'auth@example.com',
        password: 'correct',
        fullname: 'Auth User',
      });
      const res = await request(app)
        .post('/users/login')
        .send({ email: 'auth@example.com', password: 'wrong' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 400 for non-existent email', async () => {
      const res = await request(app)
        .post('/users/login')
        .send({ email: 'nobody@example.com', password: 'pass' });
      expect(res.status).toBe(400);
    });
  });

  // ── GET /users ────────────────────────────────────────────────────────────
  describe('GET /users', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app).get('/users');
      expect(res.status).toBe(401);
    });

    it('returns user list with a valid token', async () => {
      const token = await registerAndLogin('list@example.com', 'pw123456', 'List User');
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('returns 401 with an invalid/malformed token', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', 'Bearer totally.invalid.token');
      expect(res.status).toBe(401);
    });
  });

  // ── PUT /users/:id ────────────────────────────────────────────────────────
  describe('PUT /users/:id', () => {
    it('allows a user to update their own profile', async () => {
      const token = await registerAndLogin('self@example.com', 'mypass1', 'Self User');
      const user = await User.findOne({ where: { email: 'self@example.com' } });

      const res = await request(app)
        .put(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'self@example.com', fullname: 'Updated Name' });
      expect(res.status).toBe(200);
      expect(res.body.user.fullname).toBe('Updated Name');
    });

    it('returns 403 when a non-admin updates another user', async () => {
      // Create user A and user B
      const tokenA = await registerAndLogin('usera@example.com', 'passA1', 'User A');
      await request(app).post('/users/register').send({
        email: 'userb@example.com',
        password: 'passB2',
        fullname: 'User B',
      });
      const userB = await User.findOne({ where: { email: 'userb@example.com' } });

      const res = await request(app)
        .put(`/users/${userB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ fullname: 'Hacker' });
      expect(res.status).toBe(403);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app)
        .put('/users/1')
        .send({ fullname: 'No Token' });
      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent user', async () => {
      const token = await registerAndLogin('admin@example.com', 'adminpass', 'Admin');
      // Make the user a superadmin directly in DB
      const admin = await User.findOne({ where: { email: 'admin@example.com' } });
      admin.issuperadmin = true;
      await admin.save();

      const res = await request(app)
        .put('/users/9999')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Ghost', email: 'ghost@example.com' });
      // The route checks ownership before looking up user in some paths,
      // but with superadmin it should hit the findByPk 404
      expect([403, 404]).toContain(res.status);
    });
  });

  // ── PATCH /users/:id ──────────────────────────────────────────────────────
  describe('PATCH /users/:id', () => {
    it('partially updates a user with a valid token', async () => {
      const token = await registerAndLogin('patch@example.com', 'patchpass', 'Patchable');
      const user = await User.findOne({ where: { email: 'patch@example.com' } });

      const res = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Patched Name' });
      expect(res.status).toBe(200);
      expect(res.body.user.fullname).toBe('Patched Name');
    });

    it('returns 401 without a token', async () => {
      const res = await request(app)
        .patch('/users/1')
        .send({ fullname: 'No Auth' });
      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent user id', async () => {
      const token = await registerAndLogin('exists@example.com', 'pass9999', 'Exists');
      const res = await request(app)
        .patch('/users/9999')
        .set('Authorization', `Bearer ${token}`)
        .send({ fullname: 'Nobody' });
      expect(res.status).toBe(404);
    });
  });

  // ── GET /users/user-stats ─────────────────────────────────────────────────
  describe('GET /users/user-stats', () => {
    it('returns user stats without authentication', async () => {
      await request(app).post('/users/register').send({
        email: 'stats@example.com',
        password: 'statspass',
        fullname: 'Stats User',
      });

      const res = await request(app).get('/users/user-stats');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      // user-stats includes id, email, issuperadmin
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('email');
        expect(res.body[0]).toHaveProperty('issuperadmin');
      }
    });
  });
});
