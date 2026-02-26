const request = require('supertest');
const app = require('../app');
const User = require('../models/user');

describe('Route reachability smoke', () => {
  it('GET /pets is reachable', async () => {
    const res = await request(app).get('/pets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /tags is reachable', async () => {
    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /users/register is reachable', async () => {
    const res = await request(app).post('/users/register').send({
      email: 'smoke@example.com',
      password: 'Pass1234!',
      fullname: 'Smoke User',
    });
    expect(res.status).toBe(201);
  });

  it('GET /users enforces auth gate', async () => {
    const unauth = await request(app).get('/users');
    expect(unauth.status).toBe(401);

    await request(app).post('/users/register').send({
      email: 'auth@example.com',
      password: 'Pass1234!',
      fullname: 'Auth User',
    });
    const user = await User.findOne({ where: { email: 'auth@example.com' } });
    expect(user).toBeTruthy();
  });
});
