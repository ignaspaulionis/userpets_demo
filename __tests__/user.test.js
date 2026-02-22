const request = require('supertest');
const app = require('../server');

describe('User API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/users/register')
      .send({ email: 'test@test.com', password: 'password123', fullname: 'Test User' });

    expect(res.statusCode).toEqual(200);
  });

  it('should login a user and receive a token', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeDefined();
  });

  it('should fail login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/users/login')
      .send({ email: 'test@test.com', password: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
  });
});