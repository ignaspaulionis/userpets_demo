const request = require('supertest');
const app = require('../app');

describe('Users API', () => {
  const registerUser = async (overrides = {}) => {
    const payload = {
      email: 'user@example.com',
      password: 'password123',
      fullname: 'Test User',
      ...overrides,
    };
    return request(app).post('/users/register').send(payload);
  };

  it('registers user and returns id', async () => {
    const res = await registerUser();

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('fails register validation for missing fields', async () => {
    const res = await request(app).post('/users/register').send({ email: 'bad@example.com' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('logs in valid user and returns token', async () => {
    await registerUser();
    const res = await request(app).post('/users/login').send({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('rejects invalid login', async () => {
    await registerUser();
    const res = await request(app).post('/users/login').send({
      email: 'user@example.com',
      password: 'wrong',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid credentials' });
  });

  it('denies GET /users without token', async () => {
    const res = await request(app).get('/users');

    expect(res.status).toBe(401);
  });

  it('allows GET /users with token', async () => {
    await registerUser();
    const login = await request(app).post('/users/login').send({
      email: 'user@example.com',
      password: 'password123',
    });

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('allows updating self and denies updating another user', async () => {
    const u1 = await registerUser();
    const u2 = await registerUser({ email: 'other@example.com', fullname: 'Other User' });

    const login = await request(app).post('/users/login').send({
      email: 'user@example.com',
      password: 'password123',
    });

    const selfUpdate = await request(app)
      .put(`/users/${u1.body.id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ fullname: 'Updated Name', email: 'user@example.com' });

    expect(selfUpdate.status).toBe(200);

    const forbidden = await request(app)
      .put(`/users/${u2.body.id}`)
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ fullname: 'Nope', email: 'other@example.com' });

    expect(forbidden.status).toBe(403);
    expect(forbidden.body).toEqual({ error: 'Access denied' });
  });
});
